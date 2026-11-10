// Captures de l'administration avec un compte temporaire (MFA activé puis compte supprimé)
// usage : node scripts/admin-shots.mjs <dossier> [base]
import "dotenv/config";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { createCipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "shots-admin";
const BASE = process.argv[3] ?? "http://localhost:3000";
mkdirSync(out, { recursive: true });
const db = new Database(new URL("../dev.db", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
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
const totp = () => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = createHmac("sha1", dec(secret)).update(buf).digest();
  const x = h[h.length - 1] & 15;
  return String((((h[x] & 127) << 24) | (h[x + 1] << 16) | (h[x + 2] << 8) | h[x + 3]) % 1e6).padStart(6, "0");
};
const iv = randomBytes(12);
const c = createCipheriv("aes-256-gcm", createHash("sha256").update(`enc:${process.env.AUTH_SECRET}`).digest(), iv);
const data = Buffer.concat([c.update(secret, "utf8"), c.final()]);
const enc = [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
const email = `shots-${randomBytes(3).toString("hex")}@example.com`;
const pw = randomBytes(12).toString("hex");
db.prepare(`insert into AdminUser (id, email, name, passwordHash, role, active, mfaEnabled, mfaSecret, createdAt) values (?, ?, 'Direction', ?, 'ADMIN', 1, 1, ?, ?)`).run(`s${Date.now()}`, email, bcrypt.hashSync(pw, 10), enc, new Date().toISOString().replace("Z", "+00:00"));
const browser = await chromium.launch();
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${BASE}/admin/login`);
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="password"]', pw);
  await p.click("button:has-text('Se connecter')");
  await p.waitForURL(/mfa/);
  await p.fill('input[name="code"]', totp());
  await p.click("button:has-text('Valider')");
  await p.waitForURL(`${BASE}/admin`);
  for (const path of process.argv.slice(4).length ? process.argv.slice(4) : ["/admin", "/admin/finances", "/admin/calendrier", "/admin/identite", "/admin/demandes"]) {
    await p.goto(BASE + path, { waitUntil: "networkidle" });
    await p.screenshot({ path: `${out}/admin${path.replace(/[/?=&]/g, "_")}.png` });
    console.log("ok", path);
  }
} finally {
  await browser.close();
  db.prepare("delete from AdminUser where email = ?").run(email);
}
