/**
 * Vidéo de présentation du site Benani Travel (pour validation client), avec musique originale.
 * Prérequis : serveur lancé (npm run dev) — Usage : node scripts/benani-video.mjs [http://localhost:3000]
 * Résultat : video/benani-travel-presentation.mp4 (1920×1080) + version légère 1280 px
 */
import "dotenv/config";
import { chromium } from "playwright";
import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, renameSync } from "node:fs";
import path from "node:path";

// Compte d'administration TEMPORAIRE pour filmer le back-office (MFA activé, supprimé à la fin)
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { createCipheriv, createHash, createHmac, randomBytes } from "node:crypto";
const db = new Database(new URL("../dev.db", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const ADMIN = (() => {
  const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const secret = Array.from(randomBytes(20), (b) => B32[b % 32]).join("");
  const dec = (s) => {
    let bits = 0, v = 0;
    const o = [];
    for (const ch of s) {
      v = (v << 5) | B32.indexOf(ch);
      bits += 5;
      if (bits >= 8) {
        o.push((v >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return Buffer.from(o);
  };
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", createHash("sha256").update(`enc:${process.env.AUTH_SECRET}`).digest(), iv);
  const data = Buffer.concat([c.update(secret, "utf8"), c.final()]);
  const enc = [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
  const email = `video-${randomBytes(3).toString("hex")}@example.com`;
  const pw = randomBytes(12).toString("hex");
  db.prepare(`insert into AdminUser (id, email, name, passwordHash, role, active, mfaEnabled, mfaSecret, createdAt) values (?, ?, 'Direction', ?, 'ADMIN', 1, 1, ?, ?)`).run(`v${Date.now()}`, email, bcrypt.hashSync(pw, 10), enc, new Date().toISOString().replace("Z", "+00:00"));
  const totp = () => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const h = createHmac("sha1", dec(secret)).update(buf).digest();
    const x = h[h.length - 1] & 15;
    return String((((h[x] & 127) << 24) | (h[x + 1] << 16) | (h[x + 2] << 8) | h[x + 3]) % 1e6).padStart(6, "0");
  };
  return { email, pw, totp };
})();
process.on("exit", () => db.prepare("delete from AdminUser where email = ?").run(ADMIN.email));

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = path.resolve("video");
const RAW = path.join(OUT, "raw");
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

async function inject() {
  await page.addStyleTag({ content: OVERLAY_CSS }).catch(() => {});
}

async function goto(url) {
  await page.goto(BASE + url, { waitUntil: "networkidle" }).catch(() => {});
  await inject();
  // pas de bouton flottant ni d'indicateur de développement dans la vidéo
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  await wait(400);
}

async function caption(title, sub = "", ms = 3200) {
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
  await wait(ms);
  await page.evaluate(() => document.getElementById("promo-cap")?.classList.remove("on"));
  await wait(500);
}

async function card(kicker, title, text, small = "", ms = 3800) {
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
  await wait(ms);
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
  await el.click().catch(() => {});
  await wait(500);
}

// ─────────────────────────────── SCÉNARIO ───────────────────────────────
const BRAND = "Benani Travel";
const LOGO = `<img src="${BASE}/uploads/brand/benani-travel-logo.jpg" style="width:150px;height:150px;border-radius:999px;margin-bottom:24px;box-shadow:0 20px 50px rgba(0,0,0,.45)"/>`;
// pas de bandeau cookies dans la vidéo
await page.goto(BASE + "/fr", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.setItem("cookie-notice-v1", "1"));

console.log("▶ Intro");
await goto("/fr");
await card("Agence de voyage · Maroc", `${LOGO}<br/>BENANI TRAVEL`, "Explorez le Maroc autrement.<br/>Circuits, excursions, séjours et voyages sur mesure", "Présentation du site — version à valider", 4600);

console.log("▶ Accueil");
await page.mouse.move(W * 0.7, H * 0.4, { steps: 20 });
await caption("Un accueil immersif", "Grande photo du Sahara, trois accès directs et une recherche complète", 3600);
await clickText("button[role=tab]", "Activités");
await wait(600);
await clickText("button[role=tab]", "Circuits");
await caption("Recherche : destination, date, voyageurs, durée, budget", "Les résultats ne montrent que les départs réellement ouverts", 3200);
await scrollTo("#destinations", 1800, -70);
await caption("Destinations incontournables", "Merzouga ouverte à la réservation, les autres destinations prêtes à être publiées depuis l'admin", 3800);
await scrollToText("h2", "circuits les plus populaires", 1800);
await page.mouse.move(W * 0.3, H * 0.6, { steps: 15 });
await caption("Nos circuits les plus populaires", "Photos, prochain départ, places restantes et prix « à partir de »", 3600);
await scrollToText("h2", "Places disponibles", 1800);
await caption("Prochains départs en temps réel", "Dates et places viennent directement du moteur de réservation", 3000);
await scrollToText("h2", "Expériences et activités", 1800);
await caption("Expériences et activités", "Dromadaire, bivouac, quad, buggy, 4x4, Khamlia, oasis, ciel étoilé…", 3000);

console.log("▶ Heure par heure");
await scrollToText("h2", "heure par heure", 1800);
const slider = page.locator('input[type="range"]').first();
await caption("Le Sahara heure par heure", "Une journée à Merzouga, de l'aube à la nuit étoilée", 1400);
for (const v of ["1", "2", "3", "4"]) {
  await slider.evaluate((el, val) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, v);
  await wait(1100);
}

console.log("▶ Sur mesure + confiance");
await scrollTo("#composer", 1800, -70);
await caption("Voyages sur mesure", "Le visiteur compose son séjour ou demande un devis personnalisé", 3200);
await scrollToText("h2", "Pourquoi voyager avec nous", 1800);
await caption("Pourquoi voyager avec nous ?", "Rien n'est confirmé sans l'agence, programmes réalistes, contact WhatsApp", 3200);
await scrollToText("h2", "Témoignages vérifiés", 1600);
await caption("Témoignages vérifiés uniquement", "Seuls les voyageurs ayant fait un séjour confirmé peuvent publier un avis — aucun faux avis", 3600);
await scrollToText("h2", "Questions fréquentes", 1800);
await page.locator("details summary").first().click().catch(() => {});
await wait(800);
await caption("FAQ, conseils, newsletter et contact", "Inscription à la newsletter avec confirmation par e-mail", 3000);
await scrollTo(99999, 2200, 0);
await caption("Pied de page professionnel", "Coordonnées Benani Travel, Instagram, pages légales", 3000);

console.log("▶ Merzouga");
await goto("/fr/destinations/merzouga");
await caption("Merzouga, vivez la magie du Sahara", "Erg Chebbi, expériences, bivouacs, circuits, carte, conseils, FAQ, calendrier des séjours", 3600);
await scrollTo("#carte", 2200, -60);
await wait(2200);
await caption("Carte interactive avec trajets réels", "Itinéraires sur OpenStreetMap, temps de route calculés", 3000);
await scrollTo("#calendrier", 1800, -70);
await caption("Le calendrier des séjours", "Les départs ouverts et les places restantes", 3000);

console.log("▶ Fiche circuit + réservation");
await goto("/fr/circuits/grand-sud-marocain-4j");
await caption("Fiches circuits détaillées", "Programme jour par jour, inclus / exclus, annulation, PDF, WhatsApp", 3000);
await scrollToText("h2", "Programme jour par jour", 2000);
await wait(1200);
await goto("/fr/reservation?circuit=immersion-desert-3j");
await caption("Réservation en quelques étapes", "Dates disponibles, voyageurs, options, prix recalculé par le serveur, n° de dossier unique", 4000);

console.log("▶ Espace voyageur");
await goto("/fr/compte");
await caption("Espace voyageur", "Réservations, documents de voyage, reçus, messagerie, demande d'annulation, favoris", 3600);
await goto("/fr/sur-mesure");
await scrollToText("h2", "Un autre projet", 1800);
await caption("Demande de devis sur mesure", "Devis préparé par l'agence → accepté en ligne → transformé en réservation", 3600);

console.log("▶ Multilingue");
await goto("/ar");
await caption("Français · English · العربية", "Site entièrement multilingue, avec affichage de droite à gauche", 3000);

console.log("▶ Mobile");
// le site interdit l'affichage en iframe (anti-clickjacking) : on capture la version mobile à part
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mp = await mctx.newPage();
await mp.goto(BASE + "/fr", { waitUntil: "networkidle" });
await mp.evaluate(() => localStorage.setItem("cookie-notice-v1", "1"));
await mp.goto(BASE + "/fr", { waitUntil: "networkidle" });
await mp.waitForTimeout(800);
const shot = (await mp.screenshot({ clip: { x: 0, y: 0, width: 390, height: 3400 }, fullPage: true })).toString("base64");
await mctx.close();
await goto("/fr");
await page.evaluate((img) => {
  const el = document.createElement("div");
  el.id = "promo-phone";
  el.innerHTML = `<div class="ph"><div style="width:390px;height:832px;border-radius:44px;overflow:hidden;background:#fff"><img id="mshot" src="data:image/png;base64,${img}" style="width:390px;display:block;transition:transform 5s ease-in-out"/></div></div><div class="tx"><b>Pensé pour le mobile</b><span>Navigation façon application, réservation et WhatsApp toujours accessibles.</span></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("on"));
}, shot);
await wait(3000);
await page.evaluate(() => {
  const i = document.getElementById("mshot");
  if (i) i.style.transform = "translateY(-2560px)";
});
await wait(5400);

console.log("▶ Administration");
await page.evaluate(() => {
  const el = document.createElement("div");
  el.id = "promo-card";
  el.className = "on";
  el.innerHTML = `<div class="k">Back-office</div><h1 style="font-size:84px;letter-spacing:.04em">Administration</h1><p>Connexion protégée par double authentification</p>`;
  document.body.appendChild(el);
});
await wait(1500);
await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', ADMIN.email);
await page.fill('input[name="password"]', ADMIN.pw);
await Promise.all([page.waitForURL(/mfa/), page.press('input[name="password"]', "Enter")]);
await page.fill('input[name="code"]', ADMIN.totp());
await Promise.all([page.waitForURL(`${BASE}/admin`), page.press('input[name="code"]', "Enter")]);
await goto("/admin");
await caption("Tableau de bord", "Réservations du jour et du mois, chiffre d'affaires, paiements, demandes à traiter", 3600);
await goto("/admin/calendrier");
await caption("Calendrier des départs", "Places occupées, voyageurs confirmés et en attente", 3000);
await goto("/admin/finances");
await caption("Finances", "Ventes, encaissements, acomptes et soldes dus, remboursements", 3000);
await goto("/admin/identite");
await caption("Identité modifiable sans code", "Nom, logo, coordonnées, réseaux sociaux, informations légales", 3200);
await goto("/admin/journal");
await caption("Sécurité", "Rôles de l'équipe, journal d'audit, limitation des tentatives", 3000);

console.log("▶ Outro");
await goto("/fr");
await card("Benani Travel", `${LOGO}`, "Explorez le Maroc autrement.", "Tarifs et disponibilités de démonstration à remplacer · Photos : Super Morocco Travels · En attente de votre validation", 4800);

await context.close();
await browser.close();
db.prepare("delete from AdminUser where email = ?").run(ADMIN.email);

// ─────────────────────────────── ENCODAGE ───────────────────────────────
const webm = readdirSync(RAW).find((f) => f.endsWith(".webm"));
const rawPath = path.join(RAW, webm);
const mp4 = path.join(OUT, "benani-travel-presentation.mp4");
console.log("▶ Encodage MP4 + musique…");
const music = path.join(OUT, "musique-originale.wav");
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
// version légère pour l'envoi
const light = path.join(OUT, "benani-travel-presentation-leger.mp4");
execFileSync(ffmpeg, ["-y", "-i", mp4, "-vf", "scale=1280:-2", "-c:v", "libx264", "-crf", "28", "-preset", "medium", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", light], { stdio: "ignore" });
rmSync(RAW, { recursive: true, force: true });
console.log("✔ Vidéo :", mp4, "·", light);
