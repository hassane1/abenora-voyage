// Capture « au-dessus de la ligne de flottaison » d'une page : node scripts/shot-top.mjs <fichier.png> <chemin> [largeur] [hauteur] [scrollY]
import { chromium } from "playwright";
const [file, p = "/fr", w = "1440", h = "900", y = "0"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + p, { waitUntil: "networkidle" });
await page.evaluate((sy) => window.scrollTo(0, Number(sy)), y);
await page.waitForTimeout(1200);
await page.screenshot({ path: file });
await browser.close();
