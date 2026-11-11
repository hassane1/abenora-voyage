// Vérifie que chaque destination affiche SA propre photo (carte de /destinations et bannière de sa page).
// Échoue (code 1) si deux destinations différentes reçoivent la même image principale.
// Usage : node scripts/check-destination-photos.mjs [BASE_URL]   (serveur de développement lancé)
import { chromium } from "playwright";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const file = (src) => {
  if (!src) return null;
  const u = new URL(src, BASE);
  return decodeURIComponent(u.searchParams.get("url") ?? u.pathname);
};
const browser = await chromium.launch();
const page = await browser.newPage();
let failed = false;
for (const locale of ["fr", "ar"]) {
  await page.goto(`${BASE}/${locale}/destinations`, { waitUntil: "networkidle" });
  const cards = await page.$$eval(`main a[href^="/${locale}/destinations/"]`, (as) => as.map((a) => ({ href: a.getAttribute("href"), src: a.querySelector("img")?.getAttribute("src") ?? null })));
  const seen = new Map();
  for (const c of cards) {
    const slug = c.href.split("/").pop();
    const img = file(c.src);
    if (!img) console.log(`  · ${slug} : visuel décoratif (aucune photo)`);
    else if (seen.has(img)) {
      console.log(`  ✘ ${slug} : même image que ${seen.get(img)} (${img})`);
      failed = true;
    } else seen.set(img, slug);
  }
  console.log(`/${locale}/destinations : ${cards.length} cartes, ${seen.size} photos distinctes`);
}
// bannière de chaque page destination
const slugs = await page.$$eval(`main a[href^="/ar/destinations/"]`, (as) => as.map((a) => a.getAttribute("href").split("/").pop()));
const banners = new Map();
for (const slug of slugs) {
  await page.goto(`${BASE}/fr/destinations/${slug}`, { waitUntil: "domcontentloaded" });
  const src = await page.$eval("section img", (i) => i.getAttribute("src")).catch(() => null);
  const img = file(src);
  if (img && banners.has(img)) {
    console.log(`  ✘ bannière ${slug} : même image que ${banners.get(img)} (${img})`);
    failed = true;
  } else if (img) banners.set(img, slug);
  else console.log(`  · bannière ${slug} : visuel décoratif`);
}
console.log(`Bannières : ${slugs.length} pages, ${banners.size} photos distinctes`);
await browser.close();
if (failed) {
  console.log("✘ Doublons détectés.");
  process.exit(1);
}
console.log("✔ Chaque destination a sa propre photo.");
