// Captures d'écran + erreurs console des pages publiques (bureau et mobile)
// usage : node scripts/shots.mjs [dossier_sortie] [chemins…]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.argv[2] ?? "shots";
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/fr", "/ar", "/fr/destinations/merzouga", "/fr/compte", "/fr/sur-mesure", "/fr/legal/cgv"];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
let problems = 0;
for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  for (const p of paths) {
    errors.length = 0;
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    // défilement pour déclencher les révélations au scroll
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const file = `${out}/${name}${p.replace(/[/?=&]/g, "_")}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const msg = [overflow > 1 ? `débordement horizontal ${overflow}px` : "", ...errors.slice(0, 5)].filter(Boolean);
    if (msg.length) problems++;
    console.log(`${name} ${p} ${msg.length ? "⚠ " + msg.join(" | ") : "ok"}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(problems ? 1 : 0);
