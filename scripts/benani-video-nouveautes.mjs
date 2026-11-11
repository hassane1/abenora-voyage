/**
 * Vidéo « nouvelle version » du site Benani Travel (nouveautés), voix off et musique originale.
 * Prérequis : npm run dev — Usage : NARRATION_DIR=video/voix-nv-AAAAMMJJ node scripts/benani-video-nouveautes.mjs
 * Arabe : VIDEO_LOCALE=ar TEXTS_FILE=…/textes.json NARRATION_DIR=… ; résultat : video/benani-travel-nouvelle-version[-ar]-voix-AAAAMMJJ.mp4 (+ -leger)
 */
import "dotenv/config";
import { chromium } from "playwright";
import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, renameSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
/** Langue de la vidéo : VIDEO_LOCALE=ar filme le site arabe ; TEXTS_FILE = légendes traduites { clé: { t, s, k, p } } */
const L = process.env.VIDEO_LOCALE === "ar" ? "ar" : "fr";
const TEXTS = process.env.TEXTS_FILE ? JSON.parse(readFileSync(process.env.TEXTS_FILE, "utf8")) : null;
const tx = (fr, ar) => (L === "ar" ? ar : fr);
const OUT = path.resolve("video");
const TAG = process.env.VIDEO_TAG ?? new Date().toISOString().slice(0, 10).replaceAll("-", "");
const RAW_DIR_NAME = `raw-${process.env.VIDEO_LOCALE ?? "fr"}-${TAG}`;
const RAW = path.join(OUT, RAW_DIR_NAME);
const W = 1920;
const H = 1080;

rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: { dir: RAW, size: { width: W, height: H } },
  locale: "fr-FR",
});
const page = await context.newPage();
const T0 = Date.now(); // début approximatif de l'enregistrement vidéo

/** Voix off facultative : NARRATION_DIR contient voix.json { clé: { file, ms } } (une piste audio par scène) */
const VOIX = process.env.NARRATION_DIR && existsSync(path.join(process.env.NARRATION_DIR, "voix.json")) ? JSON.parse(readFileSync(path.join(process.env.NARRATION_DIR, "voix.json"), "utf8")) : null;
const CUES = [];
/** Déclenche la voix de la scène et renvoie sa durée (ms), 0 sans voix */
function speak(key) {
  const v = VOIX?.[key];
  if (!v) return 0;
  CUES.push({ file: v.file, at: Date.now() - T0 });
  return v.ms;
}

/** Styles des incrustations (titres, sous-titres, maquette mobile) */
const OVERLAY_CSS = `
#promo-cap{position:fixed;left:50%;bottom:64px;transform:translateX(-50%) translateY(20px);z-index:99999;opacity:0;transition:all .6s cubic-bezier(.22,1,.36,1);
  background:rgba(20,40,63,.92);color:#fff;border-radius:22px;padding:18px 34px;font-family:system-ui,Segoe UI,sans-serif;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35);backdrop-filter:blur(6px);max-width:1200px}
#promo-cap.on{opacity:1;transform:translateX(-50%) translateY(0)}
#promo-cap b{display:block;font:600 34px/1.2 'Cormorant Garamond',Georgia,serif;color:#ECD3A8}
#promo-cap span{display:block;margin-top:6px;font-size:20px;color:rgba(255,255,255,.85)}
#promo-card{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0;transition:opacity .8s;
  background:radial-gradient(circle at 70% 20%,rgba(216,164,93,.35),transparent 50%),linear-gradient(160deg,#14283F 0%,#0b1726 60%,#3a2418 100%);color:#fff;font-family:system-ui,Segoe UI,sans-serif}
#promo-card.on{opacity:1}
#promo-card .k{letter-spacing:.35em;text-transform:uppercase;color:#D8A45D;font-weight:700;font-size:20px}
#promo-card h1{font:600 110px/1 'Cormorant Garamond',Georgia,serif;margin:22px 0 10px;letter-spacing:.12em}
#promo-card p{font-size:30px;color:rgba(255,255,255,.85);max-width:1200px;line-height:1.4}
#promo-card small{margin-top:40px;font-size:18px;color:rgba(255,255,255,.55)}
#promo-phone{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;gap:90px;background:linear-gradient(160deg,#FAF7F1,#f0e2c8);opacity:0;transition:opacity .7s}
#promo-phone.on{opacity:1}
#promo-phone .ph{width:410px;height:860px;border-radius:56px;background:#111;padding:14px;box-shadow:0 40px 90px rgba(20,40,63,.45)}
#promo-phone iframe{width:390px;height:832px;border:0;border-radius:44px;background:#fff}
#promo-phone .tx{max-width:560px;font-family:system-ui,Segoe UI,sans-serif;color:#14283F}
#promo-phone .tx b{display:block;font:600 64px/1.05 'Cormorant Garamond',Georgia,serif}
#promo-phone .tx span{display:block;margin-top:18px;font-size:26px;color:#6a7480;line-height:1.4}
`;

const RTL_CSS = `#promo-cap,#promo-card,#promo-phone .tx{direction:rtl}#promo-cap b,#promo-card h1,#promo-phone .tx b{font-family:'Segoe UI',Tahoma,sans-serif;letter-spacing:0}`;
async function inject() {
  await page.addStyleTag({ content: OVERLAY_CSS + (L === "ar" ? RTL_CSS : "") }).catch(() => {});
}

async function goto(url) {
  if (L === "ar") url = url === "/ar" ? "/fr" : url.replace(/^\/fr(?=\/|$)/, "/ar");
  await page.goto(BASE + url, { waitUntil: "networkidle" }).catch(() => {});
  await inject();
  // pas de bouton flottant ni d'indicateur de développement dans la vidéo
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  await wait(400);
}

async function caption(title, sub = "", ms = 3200) {
  const key = title;
  if (TEXTS?.[key]) [title, sub] = [TEXTS[key].t ?? title, TEXTS[key].s ?? sub];
  await page.evaluate(
    ([t, s]) => {
      let el = document.getElementById("promo-cap");
      if (!el) {
        el = document.createElement("div");
        el.id = "promo-cap";
        document.body.appendChild(el);
      }
      el.innerHTML = `<b>${t}</b>${s ? `<span>${s}</span>` : ""}`;
      requestAnimationFrame(() => el.classList.add("on"));
    },
    [title, sub],
  );
  const voice = speak(key);
  await wait(Math.max(ms, voice ? voice + 700 : 0));
  await page.evaluate(() => document.getElementById("promo-cap")?.classList.remove("on"));
  await wait(500);
}

async function card(kicker, title, text, small = "", ms = 3800, key = "") {
  const tr = TEXTS?.[key];
  if (tr) [kicker, text, small] = [tr.k ?? kicker, tr.p ?? text, tr.s ?? small];
  await page.evaluate(
    ([k, t, p, s]) => {
      const el = document.createElement("div");
      el.id = "promo-card";
      el.innerHTML = `<div class="k">${k}</div><h1>${t}</h1><p>${p}</p>${s ? `<small>${s}</small>` : ""}`;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add("on"));
    },
    [kicker, title, text, small],
  );
  const voice = speak(key);
  await wait(Math.max(ms, voice ? voice + 800 : 0));
  await page.evaluate(() => {
    const el = document.getElementById("promo-card");
    el?.classList.remove("on");
    setTimeout(() => el?.remove(), 900);
  });
  await wait(900);
}

/** Défilement fluide jusqu'à un élément ou une position */
async function scrollTo(target, ms = 1800, offset = -90) {
  await page.evaluate(
    async ([t, d, off]) => {
      const startY = scrollY;
      const el = typeof t === "string" ? document.querySelector(t) : null;
      const endY = el ? el.getBoundingClientRect().top + scrollY + off : t;
      const t0 = performance.now();
      await new Promise((res) => {
        const step = (now) => {
          const k = Math.min(1, (now - t0) / d);
          const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          scrollTo(0, startY + (endY - startY) * e);
          k < 1 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });
    },
    [target, ms, offset],
  );
  await wait(250);
}

async function scrollToText(selector, text, ms = 1800, offset = -110) {
  const y = await page.evaluate(
    ([s, t]) => {
      const el = [...document.querySelectorAll(s)].find((e) => e.textContent.includes(t));
      return el ? el.getBoundingClientRect().top + scrollY : null;
    },
    [selector, text],
  );
  if (y !== null) await scrollTo(y + offset, ms, 0);
}

async function clickText(selector, text) {
  const el = page.locator(selector, { hasText: text }).first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
    await wait(250);
  }
  await el.click({ timeout: 4000 }).catch(() => {});
  await wait(500);
}

// ─────────────────────────────── SCÉNARIO : NOUVELLE VERSION ───────────────────────────────
const BRAND = "Benani Travel";
const LOGO = `<img src="${BASE}/uploads/brand/benani-travel-logo.jpg" style="width:150px;height:150px;border-radius:999px;margin-bottom:24px;box-shadow:0 20px 50px rgba(0,0,0,.45)"/>`;
await page.goto(BASE + "/" + L, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.setItem("cookie-notice-v1", "1"));

console.log("▶ Intro");
await goto("/fr");
await card("Nouvelle version", `${LOGO}<br/>BENANI TRAVEL`, "Vraies photos · Configurateur sur mesure pour 22 destinations<br/>Gammes Essentiel, Confort, Luxe · Pack complet", "Présentation des nouveautés", 4600, "intro");

console.log("▶ Accueil");
await page.mouse.move(W * 0.7, H * 0.4, { steps: 20 });
await scrollToText("h2", tx("circuits les plus populaires", "الأكثر طلباً"), 1800);
await caption("De vraies photos partout", "Libres de droits, choisies pour chaque destination et chaque circuit", 3600);
await scrollToText("h2", tx("Ce que nous vous promettons", "ما نعدكم به"), 2000, -60);
await caption("Ce que nous vous promettons", "Six engagements, chacun avec sa photo, sur fond nuit et or", 3600);
await scrollToText("h2", tx("Questions fréquentes", "الأسئلة الشائعة"), 2000, -60);
await page.locator("#faq summary").nth(1).click().catch(() => {});
await wait(900);
await caption("Questions fréquentes, façon carnet de voyage", "Chaque question est un billet ; l'aide arrive sous forme de carte postale", 3800);
await scrollTo("#visas", 1800, -70);
await caption("Visas : Europe (Schengen) et autres destinations", "Le dossier visa accompagné de A à Z", 3200);

console.log("▶ Destinations");
await goto("/fr/destinations");
await scrollTo(380, 1400, 0);
await caption("22 destinations, chacune avec sa photo", "Maroc et international, toutes ouvertes à la réservation", 3600);
await scrollTo(1500, 2600, 0);
await wait(400);
await goto("/fr/destinations/akchour");
await caption("Des pages destination complètes", "Présentation, conseils, questions fréquentes et configurateur intégré", 3400);

console.log("▶ Configurateur");
await goto("/fr/sur-mesure");
await scrollTo("#composer", 1800, -40);
const C = page.locator("#composer");
const pick = async (sel, value) => {
  const el = C.locator("select").nth(sel);
  const box = await el.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  await el.selectOption(value).catch(() => {});
  await wait(700);
};
await pick(0, "merzouga");
await page.waitForResponse((r) => r.url().includes("/api/composer?slug=merzouga")).catch(() => {});
await caption("Créez votre voyage sur mesure", "Vingt-deux destinations au choix, au Maroc et dans le monde", 3400);
await pick(1, "casablanca");
await caption("La ville de départ dans une liste", "Vingt-quatre villes du Maroc ; le temps de trajet est estimé automatiquement", 3600);
await pick(2, "2");
await caption("La durée se calcule toute seule", "On choisit les nuits d'hôtel : ici 2 nuits + 1 journée de trajet = 4 jours", 3800);
const lodging = C.locator("fieldset").first().locator("label").nth(2);
await lodging.scrollIntoViewIfNeeded().catch(() => {});
await lodging.click().catch(() => {});
await wait(600);
await caption("Trois gammes : Essentiel, Confort, Luxe", "Avec le type d'hébergement propre à chaque destination", 3600);
const pack = C.locator("fieldset").nth(1).locator("label").first();
await pack.scrollIntoViewIfNeeded().catch(() => {});
await pack.click().catch(() => {});
await wait(700);
await caption("Pack complet des activités", "Toutes les activités d'un coup, avec 15 % de réduction", 3400);
await C.getByRole("button", { name: tx("Créer mon programme", "أنشئ برنامجي") }).click().catch(() => {});
await page.waitForResponse((r) => r.url().endsWith("/api/composer") && r.request().method() === "POST").catch(() => {});
await wait(1200);
await caption("Programme jour par jour et estimation", "Sous-total des activités, réduction du pack et total, recalculés par le serveur", 3800);
const recap = C.locator("div.mt-6.rounded-2xl").first();
const ry = await recap.evaluate((e) => e.getBoundingClientRect().top + scrollY).catch(() => null);
if (ry !== null) await scrollTo(ry - 260, 2000, 0);
await wait(1800);

console.log("▶ À propos, contact");
await goto("/fr/a-propos");
await caption("À propos : une agence marocaine et familiale", "Nouvelle présentation et nouvelle photo", 3400);
await goto("/fr/contact");
await caption("Contact : le conseil sur WhatsApp", "Une question, un projet : l'agence répond rapidement", 3400);

console.log("▶ Outro");
await goto("/fr");
await card("Benani Travel", `${LOGO}`, "Votre agence de voyage, au Maroc et dans le monde.", "Tarifs de démonstration à remplacer par les vôtres", 4800, "outro");

const TOTAL_S = (Date.now() - T0) / 1000 - 0.6;
await context.close();
await browser.close();

// ─────────────────────────────── ENCODAGE ───────────────────────────────
const webm = readdirSync(RAW).find((f) => f.endsWith(".webm"));
const rawPath = path.join(RAW, webm);
const mp4 = path.join(OUT, `benani-travel-nouvelle-version${L === "ar" ? "-ar" : ""}${VOIX ? "-voix" : ""}-${TAG}.mp4`);
console.log("▶ Encodage MP4 + musique…");
const music = path.join(OUT, "musique-originale.wav");
const fadeOut = `afade=t=out:st=${Math.max(0, TOTAL_S - 3).toFixed(2)}:d=3`;
if (VOIX && CUES.length) {
  // musique ≈ -18 dB sous la voix, voix posées à leur instant d'apparition à l'écran
  const inputs = ["-y", "-ss", "0.6", "-i", rawPath, "-stream_loop", "-1", "-i", music];
  const parts = [`[1:a]volume=0.13,afade=t=in:d=2,atrim=0:${TOTAL_S.toFixed(2)}[m]`];
  CUES.forEach((c, i) => {
    inputs.push("-i", c.file);
    const d = Math.max(0, c.at - 600);
    parts.push(`[${i + 2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${d}|${d}[v${i}]`);
  });
  parts.push(`${CUES.map((_, i) => `[v${i}]`).join("")}amix=inputs=${CUES.length}:normalize=0[voix]`);
  parts.push(`[m][voix]amix=inputs=2:normalize=0:duration=first,${fadeOut},alimiter=limit=0.95[a]`);
  execFileSync(ffmpeg, [...inputs, "-filter_complex", parts.join(";"), "-map", "0:v", "-map", "[a]", "-t", TOTAL_S.toFixed(2),
    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", mp4], { stdio: "ignore" });
} else {
  execFileSync(
    ffmpeg,
    [
      "-y", "-ss", "0.6", "-i", rawPath, "-stream_loop", "-1", "-i", music,
      "-map", "0:v", "-map", "1:a", "-shortest",
      "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-r", "30",
      "-af", "volume=0.6,afade=t=in:d=2", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", mp4,
    ],
    { stdio: "ignore" },
  );
}
// version légère pour l'envoi
const light = path.join(OUT, `benani-travel-nouvelle-version${L === "ar" ? "-ar" : ""}${VOIX ? "-voix" : ""}-${TAG}-leger.mp4`);
execFileSync(ffmpeg, ["-y", "-i", mp4, "-vf", "scale=1280:-2", "-c:v", "libx264", "-crf", "28", "-preset", "medium", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", light], { stdio: "ignore" });
rmSync(RAW, { recursive: true, force: true });
console.log("✔ Vidéo :", mp4, "·", light);
