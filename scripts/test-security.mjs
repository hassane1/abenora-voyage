/**
 * Tests de sécurité dynamiques (serveur lancé : npm run dev ou npm start).
 * Usage : node scripts/test-security.mjs [http://localhost:3000]
 *
 * Crée un administrateur TEMPORAIRE (MFA activé, ancien hachage bcrypt) supprimé à la fin, et vérifie :
 *  en-têtes HTTP · injection SQL (API, recherche, connexion ; tables intactes) · XSS réfléchi · CSRF de l'API ·
 *  falsification de prix / affectation de masse · traversée de répertoire · IDOR sur les documents ·
 *  usurpation d'IP par en-tête · limites de débit · force brute · migration Argon2id · MFA anti-rejeu ·
 *  révocation de session · ré-authentification des opérations critiques · redirection ouverte · EXIF retiré.
 * Rapport : storage/security-report.json
 */
import "dotenv/config";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const ROOT = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const db = new Database(path.join(ROOT, "dev.db"));
const hasTable = (t) => !!db.prepare("select name from sqlite_master where type='table' and name=?").get(t);
const results = [];
const ok = (cond, msg) => {
  console.log(`${cond ? "✔" : "✘"} ${msg}`);
  results.push({ ok: !!cond, test: msg });
};
const skip = (msg) => {
  console.log(`– ${msg} (non applicable)`);
  results.push({ ok: null, test: msg });
};
const json = (p, body, headers = {}) =>
  fetch(`${BASE}${p}`, { method: "POST", headers: { "content-type": "application/json", origin: BASE, ...headers }, body: JSON.stringify(body) });

// --- TOTP / chiffrement (mêmes algorithmes que src/lib/security.ts) ---------------
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const b32dec = (s) => {
  let bits = 0, v = 0;
  const out = [];
  for (const ch of s) {
    v = (v << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((v >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
};
const b32enc = (buf) => {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
};
const totp = (secret, step = Math.floor(Date.now() / 30000)) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", b32dec(secret)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, "0");
};
const encKey = () => createHash("sha256").update(`enc:${process.env.AUTH_SECRET}`).digest();
const encrypt = (plain) => {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", encKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
};
void createDecipheriv;
/** attend le début d'une nouvelle fenêtre TOTP (le serveur refuse de réutiliser un code) */
const nextStep = async () => {
  const ms = 30000 - (Date.now() % 30000) + 300;
  await new Promise((r) => setTimeout(r, ms));
};

// --- administrateur temporaire ----------------------------------------------------
const run = randomBytes(3).toString("hex");
const adminEmail = `secu-${run}@example.com`;
const adminPw = `Secu-${randomBytes(9).toString("hex")}`;
const noMfaEmail = `secu-nomfa-${run}@example.com`;
const mfaSecret = b32enc(randomBytes(20));
const cols = db.prepare("pragma table_info(AdminUser)").all().map((c) => c.name);
const hasMfa = cols.includes("mfaSecret");
db.prepare(
  `insert into AdminUser (id, email, name, passwordHash, role, active${hasMfa ? ", mfaEnabled, mfaSecret" : ""}, createdAt) values (?, ?, 'Test sécurité', ?, 'ADMIN', 1${hasMfa ? ", 1, ?" : ""}, ?)`,
).run(...[`s${run}`, adminEmail, bcrypt.hashSync(adminPw, 10), ...(hasMfa ? [encrypt(mfaSecret)] : []), new Date().toISOString().replace("Z", "+00:00")]);
if (hasTable("RateLimit")) db.prepare("delete from RateLimit").run();

const counts = () => Object.fromEntries(["Circuit", "AdminUser", "Booking", "Departure"].map((t) => [t, db.prepare(`select count(*) n from "${t}"`).get().n]));

const browser = await chromium.launch();
try {
  // ------------------------------------------------------------------ en-têtes
  const home = await fetch(`${BASE}/fr`);
  const h = home.headers;
  const csp = h.get("content-security-policy") ?? "";
  ok(/script-src[^;]*'nonce-/.test(csp) && /frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp) && /base-uri 'self'/.test(csp), "CSP restrictive à nonce (frame-ancestors, object-src, base-uri)");
  ok(h.get("x-content-type-options") === "nosniff" && h.get("x-frame-options") === "DENY", "nosniff + X-Frame-Options DENY");
  ok(!!h.get("referrer-policy") && /camera=\(\)/.test(h.get("permissions-policy") ?? ""), "Referrer-Policy et Permissions-Policy");
  ok(!h.get("x-powered-by"), "Pas d'en-tête X-Powered-By");
  const loginPage = await fetch(`${BASE}/admin/login`);
  ok(/no-store/.test(loginPage.headers.get("cache-control") ?? ""), "Administration : Cache-Control no-store");

  // ------------------------------------------------------------------ injection SQL
  const before = counts();
  const payloads = ["' OR '1'='1", "1; DROP TABLE Circuit;--", "\" OR 1=1 --", "x' UNION SELECT passwordHash FROM AdminUser--"];
  let sqlOk = true;
  for (const p of payloads) {
    const q = await json("/api/quote", { circuitId: p, adults: 2, childAges: [], privateTour: false, optionCodes: [], promoCode: p, locale: "fr" });
    const d = await fetch(`${BASE}/api/departures?circuitId=${encodeURIComponent(p)}`);
    const s = await fetch(`${BASE}/fr/circuits?q=${encodeURIComponent(p)}`);
    const body = await d.text();
    if (q.status >= 500 || d.status >= 500 || s.status >= 500 || /\$2[aby]\$|\$argon2/.test(body)) sqlOk = false;
  }
  ok(sqlOk, `Injection SQL : ${payloads.length} charges × devis, départs, recherche → aucune erreur 500 ni fuite`);

  // ------------------------------------------------------------------ XSS réfléchi
  const xss = "<script>alert(1)</script>";
  const page = await (await fetch(`${BASE}/fr/circuits?q=${encodeURIComponent(xss)}`)).text();
  ok(!page.includes(xss), "XSS réfléchi : la recherche n'injecte pas de balise <script>");

  // ------------------------------------------------------------------ CSRF de l'API
  const evil = { origin: "https://site-malveillant.example" };
  const c1 = await json("/api/bookings", {}, evil);
  const c2 = await json("/api/quote", {}, evil);
  ok(c1.status === 403 && c2.status === 403, "CSRF : écriture API depuis une autre origine refusée (403)");

  // ------------------------------------------------------------------ limites / usurpation d'IP
  let last = 0;
  for (let i = 0; i < 62; i++) last = (await json("/api/quote", { circuitId: "x", adults: 1, childAges: [], privateTour: false, optionCodes: [], locale: "fr" }, { "x-forwarded-for": `10.0.${i}.1` })).status;
  ok(last === 429, "Usurpation d'IP : changer X-Forwarded-For ne contourne pas la limite (61e devis → 429)");
  let chat = 0;
  for (let i = 0; i < 11; i++) chat = (await json("/api/chat", { locale: "fr", messages: [{ role: "user", content: "Bonjour" }] })).status;
  ok(chat === 429, "Limite de l'assistant (11e message / min → 429)");
  const big = await fetch(`${BASE}/api/quote`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ x: "a".repeat(300 * 1024) }) });
  ok(big.status === 413, "Corps de requête API > 256 Ko refusé (413)");
  if (hasTable("RateLimit")) db.prepare("delete from RateLimit").run();

  // ------------------------------------------------------------------ prix falsifié / affectation de masse
  const dep = db.prepare("select d.id, d.circuitId from Departure d join Circuit c on c.id = d.circuitId where c.published = 1 and d.date > ? and d.capacity - d.seatsHeld >= 2 and d.status = 'OPEN' order by d.date limit 1").get(new Date().toISOString());
  if (dep) {
    const r = await json("/api/bookings", {
      circuitId: dep.circuitId, departureId: dep.id, adults: 1, childAges: [], privateTour: false, optionCodes: [],
      firstName: "Secu", lastName: "Test", email: `secu-${run}@example.com`, phone: "+212600000000", whatsapp: "", country: "Maroc", departureCity: "", specialNeeds: "", comments: "", consent: true, locale: "fr", website: "", promoCode: "",
      totalMad: 1, status: "CONFIRMED", paymentStatus: "PAID", customerId: "autre",
    });
    const b = r.status === 201 ? db.prepare("select * from Booking where reference = ?").get((await r.json()).reference) : null;
    ok(!!b && b.totalMad > 1 && b.status === "PENDING" && b.paymentStatus !== "PAID" && (b.customerId === undefined || b.customerId === null), "Prix falsifié et champs interdits ignorés (total recalculé, statut PENDING)");
  } else skip("Prix falsifié (aucun départ disponible)");

  // ------------------------------------------------------------------ traversée / IDOR
  const t1 = await fetch(`${BASE}/api/documents/..%2F..%2F.env`);
  const t2 = await fetch(`${BASE}/uploads/..%2F..%2F.env`);
  const t2body = await t2.text();
  ok(t1.status === 404 && !t2body.includes("AUTH_SECRET"), "Traversée de répertoire refusée (.env inaccessible)");
  if (hasTable("BookingDocument")) {
    const doc = db.prepare("select d.id, b.id bid from BookingDocument d join Booking b on b.id = d.bookingId limit 1").get();
    const other = doc && db.prepare("select accessToken from Booking where id <> ? limit 1").get(doc.bid);
    if (doc && other) {
      const r = await fetch(`${BASE}/api/documents/${doc.id}?token=${other.accessToken}`);
      ok(r.status === 403, "IDOR : document d'un autre dossier refusé avec un jeton valide d'un autre dossier (403)");
      const r2 = await fetch(`${BASE}/api/documents/${doc.id}?token=${db.prepare("select accessToken from Booking where id = ?").get(doc.bid).accessToken}`);
      ok(/attachment/.test(r2.headers.get("content-disposition") ?? "") && /sandbox/.test(r2.headers.get("content-security-policy") ?? ""), "Document servi en pièce jointe avec CSP sandbox");
    } else skip("IDOR documents (aucun document en base)");
  } else skip("IDOR documents");

  // ------------------------------------------------------------------ connexion admin
  const ctx = await browser.newContext();
  const a = await ctx.newPage();
  const login = async (email, pw) => {
    await a.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
    await a.fill('input[name="email"]', email);
    await a.fill('input[name="password"]', pw);
    await a.click("button:has-text('Se connecter')");
    await a.waitForURL((u) => !(u.pathname === "/admin/login" && !u.search));
  };
  // SQLi sur le formulaire de connexion
  await login("admin'--@example.com", "' OR '1'='1");
  ok(a.url().includes("error="), "Injection SQL sur la connexion administrateur refusée");
  const after = counts();
  ok(JSON.stringify({ ...before, Booking: 0 }) === JSON.stringify({ ...after, Booking: 0 }), "Tables intactes après les charges d'injection");

  // connexion légitime (ancien hachage bcrypt) + MFA
  await login(adminEmail, adminPw);
  const hashNow = db.prepare("select passwordHash from AdminUser where email = ?").get(adminEmail).passwordHash;
  ok(hashNow.startsWith("$argon2id$"), "Mot de passe migré de bcrypt vers Argon2id à la connexion");
  if (hasMfa) {
    ok(a.url().includes("/admin/login/mfa"), "MFA demandé après le mot de passe");
    await nextStep();
    const code = totp(mfaSecret);
    await a.fill('input[name="code"]', code);
    await a.click("button:has-text('Valider')");
    await a.waitForURL(`${BASE}/admin`);
    ok(true, "Connexion en deux étapes réussie");
    const stolen = (await ctx.cookies()).find((c) => c.name === "admin_session");

    // déconnexion → le cookie capturé ne vaut plus rien
    const rev = await fetch(`${BASE}/admin/reservations`, { headers: { cookie: `admin_session=${stolen.value}` }, redirect: "manual" });
    ok(rev.status === 200, "(contrôle) le cookie est valide avant la déconnexion");
    await a.goto(`${BASE}/admin`);
    await a.locator("form:has(button:has-text('Se déconnecter')) button").first().evaluate((b) => b.form.requestSubmit());
    await a.waitForURL(/\/admin\/login/);
    const replay = await fetch(`${BASE}/admin/reservations`, { headers: { cookie: `admin_session=${stolen.value}` }, redirect: "manual" });
    ok(replay.status === 307 && /\/admin\/login/.test(replay.headers.get("location") ?? ""), "Session révoquée : cookie rejoué après déconnexion refusé");

    // anti-rejeu du code TOTP
    await login(adminEmail, adminPw);
    await a.fill('input[name="code"]', code);
    await a.click("button:has-text('Valider')");
    await a.waitForURL((u) => u.search.includes("error=1") || u.pathname === "/admin");
    ok(a.url().includes("error=1"), "MFA : réutilisation d'un code déjà accepté refusée");
    await nextStep();
    await a.fill('input[name="code"]', totp(mfaSecret));
    await a.click("button:has-text('Valider')");
    await a.waitForURL(`${BASE}/admin`);

    // ré-authentification
    db.prepare("update AdminSession set authAt = ? where userId = ?").run(new Date(Date.now() - 20 * 60000).toISOString().replace("Z", "+00:00"), `s${run}`);
    await a.goto(`${BASE}/admin/utilisateurs`, { waitUntil: "networkidle" });
    await a.fill('form:has(button:has-text("Créer")) input[name="email"]', `secu-tmp-${run}@example.com`);
    await a.fill('form:has(button:has-text("Créer")) input[name="password"]', `Tmp-${randomBytes(8).toString("hex")}`);
    await a.click('button:has-text("Créer")');
    await a.waitForURL(/\/admin\/confirmer/);
    ok(!db.prepare("select 1 from AdminUser where email = ?").get(`secu-tmp-${run}@example.com`), "Opération critique bloquée sans ré-authentification récente");
    await a.fill('input[name="password"]', adminPw);
    await nextStep();
    await a.fill('input[name="code"]', totp(mfaSecret));
    await a.click('button:has-text("Confirmer")');
    await a.waitForURL(/\/admin\/utilisateurs/);
    ok(true, "Ré-authentification (mot de passe + code) acceptée, retour à la page d'origine");

    // redirection ouverte
    let openOk = true;
    for (const n of ["https://evil.example", "//evil.example", "/admin@evil.example", "/\\evil.example"]) {
      await a.goto(`${BASE}/admin/confirmer?next=${encodeURIComponent(n)}`);
      const v = await a.inputValue('input[name="next"]');
      if (!v.startsWith("/admin") || v.startsWith("//") || v.includes("evil.example") && !v.startsWith("/admin")) openOk = false;
      if (/^https?:/.test(v) || v.startsWith("//")) openOk = false;
    }
    ok(openOk, "Redirection ouverte impossible (4 variantes)");

    // EXIF retiré au téléversement (JPEG minimal avec segment APP1 « Exif » contenant un faux GPS)
    const exif = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0", "latin1"), Buffer.from([0xff, 0xe1, 0x00, 0x18]), Buffer.from("Exif\0\0GPS-33.5N-7.6W\0\0", "latin1"), Buffer.from([0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 0x3f, 0, 0x11, 0x22, 0xff, 0xd9])]);
    await a.goto(`${BASE}/admin/medias`, { waitUntil: "networkidle" });
    const t0 = Date.now();
    await a.setInputFiles('input[name="file"]', { name: "photo.jpg", mimeType: "image/jpeg", buffer: exif });
    await a.fill('input[name="alt_fr"]', "Test EXIF");
    await a.fill('input[name="credit"]', "Test");
    await a.fill('input[name="license"]', "Test");
    await a.click('button:has-text("Téléverser")');
    await a.waitForURL((u) => u.search.length > 0);
    const dir = path.join(ROOT, "public", "uploads");
    const fresh = readdirSync(dir).filter((f) => f.endsWith(".jpg") && statSync(path.join(dir, f)).mtimeMs >= t0 - 1000);
    const stored = fresh.length ? readFileSync(path.join(dir, fresh[0])) : null;
    ok(!!stored && !stored.includes("GPS-33.5N") && stored[0] === 0xff, "Métadonnées EXIF (GPS) retirées des photos téléversées");
    if (fresh.length) db.prepare("delete from Media where url = ?").run(`/uploads/${fresh[0]}`);
  } else skip("MFA, révocation, ré-authentification");

  // admin SANS MFA (MFA exigé) : aucune route d'export, d'impression ni de document ne doit répondre
  if (hasMfa && process.env.ADMIN_MFA_REQUIRED !== "false") {
    const noMfaPw = `NoMfa-${randomBytes(9).toString("hex")}`;
    db.prepare("insert into AdminUser (id, email, name, passwordHash, role, active, mfaEnabled, createdAt) values (?, ?, 'Sans MFA', ?, 'ADMIN', 1, 0, ?)").run(`n${run}`, noMfaEmail, bcrypt.hashSync(noMfaPw, 10), new Date().toISOString().replace("Z", "+00:00"));
    await ctx.clearCookies();
    await login(noMfaEmail, noMfaPw);
    await a.waitForURL((u) => u.pathname === "/admin/securite", { timeout: 15000 }).catch(() => {});
    ok(a.url().includes("/admin/securite"), "Admin sans MFA : renvoyé vers la configuration du MFA");
    const cookie = (await ctx.cookies()).filter((c) => c.name === "admin_session").map((c) => `${c.name}=${c.value}`).join("; ");
    const doc = hasTable("BookingDocument") ? db.prepare("select id from BookingDocument limit 1").get() : null;
    const routes = ["/admin/reservations/export", "/admin/newsletter/export", ...(doc ? [`/api/documents/${doc.id}`] : []), "/admin/reservations/imprimer"];
    const out = [];
    for (const r of routes) {
      const res = await fetch(`${BASE}${r}`, { headers: { cookie }, redirect: "manual" });
      const body = res.status === 200 ? await res.text() : "";
      // 403 attendu ; une page (impression) redirige vers la configuration du MFA ; 404 = route absente de ce projet
      const blocked = res.status === 403 || (res.status === 307 && /securite/.test(res.headers.get("location") ?? "")) || res.status === 404;
      out.push({ r, status: res.status, blocked: blocked && !/;.*@/.test(body) });
    }
    ok(out.every((o) => o.blocked) && out.filter((o) => o.status === 403).length >= 2, `Admin sans MFA : exports et documents refusés (${out.map((o) => `${o.r} → ${o.status}`).join(", ")})`);
  } else skip("Admin sans MFA (MFA non exigé)");

  // session voyageur inactive depuis plus de 7 jours : refusée et supprimée
  const csCols = hasTable("CustomerSession") ? db.prepare("pragma table_info(CustomerSession)").all().map((c) => c.name) : [];
  const someCustomer = csCols.includes("lastSeenAt") ? db.prepare("select id from Customer limit 1").get() : null;
  if (someCustomer) {
    const tok = randomBytes(32).toString("base64url");
    const iso = (d) => d.toISOString().replace("Z", "+00:00");
    const sid = `cs${run}`;
    db.prepare('insert into CustomerSession (id, tokenHash, customerId, expiresAt, createdAt, lastSeenAt) values (?, ?, ?, ?, ?, ?)').run(
      sid, createHash("sha256").update(tok).digest("hex"), someCustomer.id, iso(new Date(Date.now() + 20 * 86400000)), iso(new Date(Date.now() - 10 * 86400000)), iso(new Date(Date.now() - 8 * 86400000)),
    );
    await fetch(`${BASE}/fr/compte`, { headers: { cookie: `traveler_session=${tok}` }, redirect: "manual" });
    ok(!db.prepare("select 1 from CustomerSession where id = ?").get(sid), "Session voyageur inactive depuis 8 jours refusée et supprimée");
    db.prepare("delete from CustomerSession where id = ?").run(sid);
  } else skip("Expiration des sessions voyageurs (pas de comptes voyageurs)");

  // force brute
  await ctx.clearCookies();
  for (let i = 0; i < 6; i++) await login(adminEmail, "mauvais-mot-de-passe");
  ok(a.url().includes("error=locked"), "Force brute : compte verrouillé après 5 échecs");
} finally {
  await browser.close();
  db.prepare("delete from AdminUser where email in (?, ?, ?)").run(adminEmail, `secu-tmp-${run}@example.com`, noMfaEmail);
  if (hasTable("RateLimit")) db.prepare("delete from RateLimit").run();
  const passed = results.filter((r) => r.ok === true).length;
  const failed = results.filter((r) => r.ok === false).length;
  mkdirSync(path.join(ROOT, "storage"), { recursive: true });
  writeFileSync(path.join(ROOT, "storage", "security-report.json"), JSON.stringify({ date: new Date().toISOString(), base: BASE, passed, failed, results }, null, 2));
  console.log(`\n${passed} réussi(s), ${failed} échec(s) — rapport : storage/security-report.json`);
  process.exitCode = failed ? 1 : 0;
}
