// Captures du site pour le teaser « Bientôt en ligne » : aucun prix, aucune donnée personnelle, aucune page d'administration.
// Usage : node scripts/teaser-captures.mjs [BASE_URL]  → video/teaser-captures/<fr|ar>-<desktop|mobile>-<scène>.png
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = path.resolve("video", "teaser-captures");
mkdirSync(OUT, { recursive: true });

// retire tout montant (MAD, dirham, €) et les éléments flottants ; cache les bandeaux techniques
async function clean(p) {
  await p.addStyleTag({ content: "[class*='fixed'][class*='bottom-']{display:none!important} nextjs-portal{display:none!important} header{position:static!important} [class*=sticky]{position:static!important}" });
  await p.evaluate(() => {
    const re = /([+−-]?\s?\d[\d\s.,  ]*\s?(MAD|درهم|€|DH))|((dès|à partir de|from|ابتداءً من)\s*$)/gi;
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    for (const n of nodes) if (re.test(n.textContent)) n.textContent = n.textContent.replace(re, "").replace(/\s+[·/]\s*$/, "");
    // lignes devenues vides (récapitulatif de prix, « par nuit et par personne »)
    document.querySelectorAll("#composer .tabular-nums, #composer .font-display.text-3xl.text-gold").forEach((e) => (e.textContent = ""));
  });
}

const b = await chromium.launch();
for (const loc of ["fr", "ar"]) {
  for (const [dev, vp, dsf] of [["desktop", { width: 1440, height: 900 }, 1.5], ["mobile", { width: 390, height: 844 }, 2.5]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dsf });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/${loc}`, { waitUntil: "networkidle" });
    await p.evaluate(() => localStorage.setItem("cookie-notice-v1", "1"));
    const shot = async (name, opts = {}) => {
      await clean(p);
      await p.waitForTimeout(500);
      await p.screenshot({ path: path.join(OUT, `${loc}-${dev}-${name}.png`), ...opts });
    };
    // 1. destinations (photos réelles)
    await p.goto(`${BASE}/${loc}/destinations`, { waitUntil: "networkidle" });
    await p.evaluate(() => scrollTo(0, document.querySelector("main a[href*='/destinations/']")?.getBoundingClientRect().top + scrollY - 40));
    await shot("destinations");
    // 2. configurateur : ville de départ, gammes, pack (sans prix)
    await p.goto(`${BASE}/${loc}/destinations/merzouga`, { waitUntil: "networkidle" });
    const C = p.locator("#composer");
    await C.locator("select").nth(1).selectOption("casablanca");
    await C.locator("select").nth(2).selectOption("2");
    await C.locator("fieldset").first().locator("label").nth(2).click();
    await C.locator("fieldset").nth(1).locator("label").first().click();
    await p.evaluate(() => scrollTo(0, document.querySelector("#composer").getBoundingClientRect().top + scrollY - 20));
    await shot("composer");
    await p.evaluate(() => scrollTo(0, document.querySelector("#composer fieldset").getBoundingClientRect().top + scrollY - 60));
    await shot("gammes");
    // 3. programme jour par jour
    await C.getByRole("button", { name: loc === "fr" ? "Créer mon programme" : "أنشئ برنامجي" }).click();
    await p.waitForResponse((r) => r.url().endsWith("/api/composer") && r.request().method() === "POST");
    await p.waitForTimeout(900);
    await p.evaluate(() => scrollTo(0, document.querySelector("#composer ol").getBoundingClientRect().top + scrollY - 160));
    await shot("programme");
    // 4. espace client (formulaire d'accès, aucune donnée)
    await p.goto(`${BASE}/${loc}/espace-client`, { waitUntil: "networkidle" });
    await shot("espace-client");
    // 5. visas
    await p.goto(`${BASE}/${loc}`, { waitUntil: "networkidle" });
    await p.evaluate(() => scrollTo(0, document.querySelector("#visas").getBoundingClientRect().top + scrollY - 20));
    await shot("visas");
    // 6. contact (WhatsApp)
    await p.goto(`${BASE}/${loc}/contact`, { waitUntil: "networkidle" });
    await p.evaluate(() => scrollTo(0, 260));
    await shot("contact");
    // 7. accueil (langues)
    await p.goto(`${BASE}/${loc}`, { waitUntil: "networkidle" });
    await shot("accueil");
    await ctx.close();
    console.log("✔", loc, dev);
  }
}
await b.close();
