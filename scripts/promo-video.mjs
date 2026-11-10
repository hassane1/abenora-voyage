/**
 * Vidéo de présentation du site (pour validation client).
 * Prérequis : serveur lancé (npm run dev) — Usage : node scripts/promo-video.mjs [http://localhost:3000]
 * Résultat : video/rimal-presentation.mp4 (1920×1080, H.264)
 */
import "dotenv/config";
import { chromium } from "playwright";
import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, renameSync } from "node:fs";
import path from "node:path";

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
console.log("▶ Intro");
await goto("/fr");
await card("Plateforme touristique · Maroc", "RIMAL", "Le Maroc comme vous ne l'avez jamais vécu.<br/>Première destination : Merzouga — désert du Sahara", "Présentation de la version de démonstration pour validation", 4200);

console.log("▶ Accueil");
await page.mouse.move(W * 0.7, H * 0.4, { steps: 20 });
await caption("Un accueil immersif", "Photo plein écran, recherche par circuits, activités ou séjour sur mesure", 3800);
await clickText("button[role=tab]", "Activités");
await wait(700);
await clickText("button[role=tab]", "Sur mesure");
await wait(700);
await clickText("button[role=tab]", "Circuits");
await scrollTo(H * 0.92, 1600, 0);
await caption("Des engagements qui rassurent", "Aucun paiement en ligne · équipe locale · conseil WhatsApp · 100 % personnalisable", 3000);
await scrollToText("h2", "Circuits au départ", 1800);
await page.mouse.move(W * 0.3, H * 0.6, { steps: 15 });
await caption("Des circuits qui donnent envie de réserver", "Photos, points forts, prochain départ et places restantes, prix « à partir de »", 4200);
await scrollToText("h2", "Places disponibles", 1800);
await page.evaluate(() => {
  const s = [...document.querySelectorAll(".snap-x")][0];
  s?.scrollTo({ left: 600, behavior: "smooth" });
});
await caption("Prochains départs en temps réel", "Les dates et les places viennent directement de la base de réservation", 3400);
await scrollToText("h2", "Que voulez-vous vivre", 1800);
await caption("Les expériences du désert", "Dromadaire, bivouac de luxe, quad, gnawa, dégustation…", 3000);

console.log("▶ Heure par heure");
await scrollToText("h2", "heure par heure", 1800);
const slider = page.locator('input[type="range"]').first();
await caption("Signature unique : le Sahara heure par heure", "Une journée à Merzouga, de l'aube à la nuit étoilée", 1600);
for (const v of ["0", "1", "2", "3", "4"]) {
  await slider.evaluate((el, val) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, v);
  await wait(1300);
}

console.log("▶ Composer");
await scrollTo("#composer", 1800, -70);
await caption("Le visiteur compose son séjour", "Destination, ville de départ, durée, hébergement, activités", 2600);
await clickText("#composer button", "Sur place à Merzouga");
await page.locator("#composer select").nth(1).selectOption("3").catch(() => {});
await wait(500);
await clickText("#composer label", "Excursion en quad");
await clickText("#composer label", "Dîner sous les");
await clickText("#composer button", "Créer mon programme");
await wait(1800);
await caption("Programme jour par jour + estimation du prix", "Généré instantanément à partir des circuits et des tarifs de l'agence", 3600);
await scrollTo("#demande-express", 1800, -80);
await caption("Demande de réservation en 30 secondes", "Calendrier des départs, coordonnées, envoi : le dossier arrive dans l'administration", 3600);

console.log("▶ Merzouga");
await goto("/fr/destinations/merzouga");
await caption("Une page Merzouga complète", "Erg Chebbi, expériences, circuits, hébergements, carte, FAQ, réservation", 3400);
await scrollTo("#carte", 2200, -60);
await wait(2500);
await caption("Carte interactive avec trajets réels", "Itinéraires calculés sur OpenStreetMap, sans durée inventée", 3200);
await clickText("#carte button[role=tab]", "Grand Sud");
await wait(3500);

console.log("▶ Fiche circuit");
await goto("/fr/circuits/grand-sud-marocain-4j");
await caption("Fiches circuits détaillées", "Programme, inclus / non inclus, annulation, PDF, WhatsApp", 3000);
await scrollToText("h2", "Programme jour par jour", 2200);
await wait(1200);
await scrollTo(page.viewportSize().height * 2.6, 2400, 0);
await wait(800);

console.log("▶ Chatbot");
await clickText("button", "Une question ? Discutons");
await wait(600);
await clickText("button", "Combien coûte le Grand Sud");
await wait(2500);
await caption("Assistant de discussion intégré", "Répond à partir du catalogue de l'agence et oriente vers la réservation", 3400);

console.log("▶ Multilingue");
await goto("/ar");
await caption("Français · English · العربية", "Site entièrement multilingue, avec affichage de droite à gauche", 3200);

console.log("▶ Mobile");
await goto("/fr");
await page.evaluate((base) => {
  const el = document.createElement("div");
  el.id = "promo-phone";
  el.innerHTML = `<div class="ph"><iframe src="${base}/fr" title="mobile"></iframe></div><div class="tx"><b>Pensé d'abord pour le mobile</b><span>Navigation façon application, bouton « Composer » central, réservation et WhatsApp toujours accessibles.</span></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("on"));
}, BASE);
await wait(4000);
await page.evaluate(() => {
  const f = document.querySelector("#promo-phone iframe");
  const d = f?.contentWindow;
  if (!d) return;
  d.document.documentElement.style.scrollBehavior = "auto";
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 5000);
    d.scrollTo(0, k * 2600);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});
await wait(5600);

console.log("▶ Administration");
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (email && password) {
  // connexion hors champ (carte titre par-dessus), puis visite des écrans de gestion
  await page.evaluate(() => {
    const el = document.createElement("div");
    el.id = "promo-card";
    el.className = "on";
    el.innerHTML = `<div class="k">Back-office</div><h1 style="font-size:84px;letter-spacing:.04em">Administration</h1><p>Réservations, confirmations, paiements, exports Excel / PDF,<br/>tarifs, disponibilités, avis, médias</p>`;
    document.body.appendChild(el);
  });
  await wait(1200);
  await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
  await inject();
  await page.evaluate(() => {
    const el = document.createElement("div");
    el.id = "promo-card";
    el.className = "on";
    document.body.appendChild(el);
  });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL("**/admin"), page.press('input[name="password"]', "Enter")]);
  await goto("/admin/circuits");
  await caption("Administration complète", "Réservations, confirmations, paiements, exports Excel / PDF, avis, médias", 3000);
  await page.locator("table a").first().click();
  await page.waitForLoadState("networkidle");
  await inject();
  await caption("L'agence gère ses offres", "Tarifs, statut « démo / validé », textes FR-EN-AR, programme, dates et capacités", 3400);
  await scrollTo("#departs", 2000, -60);
  await wait(1500);
}

console.log("▶ Outro");
await goto("/fr");
await card("Version de démonstration", "RIMAL", "Merzouga · Sahara — réservation sur demande de bout en bout", "Tarifs et disponibilités de démonstration · Photos : Super Morocco Travels · En attente de votre validation", 4500);

await context.close();
await browser.close();

// ─────────────────────────────── ENCODAGE ───────────────────────────────
const webm = readdirSync(RAW).find((f) => f.endsWith(".webm"));
const rawPath = path.join(RAW, webm);
const mp4 = path.join(OUT, "rimal-presentation.mp4");
console.log("▶ Encodage MP4…");
execFileSync(
  ffmpeg,
  ["-y", "-i", rawPath, "-ss", "0.6", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", mp4],
  { stdio: "ignore" },
);
renameSync(rawPath, path.join(OUT, "rimal-presentation-brut.webm"));
rmSync(RAW, { recursive: true, force: true });
console.log("✔ Vidéo :", mp4);
