/**
 * Test de bout en bout des fonctions « agence » (serveur lancé : npm run dev).
 * Usage : node scripts/test-agence.mjs [http://localhost:3000]
 *
 * Crée un administrateur de test TEMPORAIRE (supprimé à la fin) et vérifie :
 *  - sécurité admin : redirection sans session, MFA obligatoire, connexion en deux étapes, en-têtes HTTP
 *  - toutes les pages d'administration (aucune erreur)
 *  - compte voyageur : inscription, vérification d'e-mail, rattachement de dossier, messagerie, annulation
 *  - documents privés (403 sans droit), reçu de paiement
 *  - voyage sur mesure : demande → devis → acceptation → réservation
 *  - newsletter : double opt-in
 * Les données créées restent en base : `npm run db:reset` pour revenir à la démonstration.
 */
import "dotenv/config";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const db = new Database(new URL("../dev.db", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "✔" : "✘"} ${msg}`);
  if (!cond) failures++;
};
const lastMailLink = (to, re) => {
  const rows = db.prepare(`select body from Notification where "to" = ? order by createdAt desc limit 5`).all(to);
  for (const r of rows) {
    const m = r.body.match(re);
    // les liens des e-mails utilisent NEXT_PUBLIC_SITE_URL : on les redirige vers le serveur testé
    if (m) return m[0].replace(/&amp;/g, "&").replace(/^https?:\/\/[^/]+/, BASE);
  }
  return null;
};

// --- TOTP (même algorithme que src/lib/security.ts) ---------------------------
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
const totp = (secret) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = createHmac("sha1", b32dec(secret)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, "0");
};
const decrypt = (payload) => {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", createHash("sha256").update(`enc:${process.env.AUTH_SECRET}`).digest(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
};

const run = randomBytes(3).toString("hex");
const adminEmail = `test-admin-${run}@example.com`;
const adminPw = `Test-${randomBytes(8).toString("hex")}`;
db.prepare(`insert into AdminUser (id, email, name, passwordHash, role, active, mfaEnabled, createdAt) values (?, ?, 'Admin test', ?, 'ADMIN', 1, 0, ?)`).run(`t${run}`, adminEmail, bcrypt.hashSync(adminPw, 10), new Date().toISOString().replace("Z", "+00:00"));
db.prepare(`delete from RateLimit`).run();

const browser = await chromium.launch();
try {
  // ---------------------------------------------------------------- sécurité HTTP
  const home = await fetch(`${BASE}/fr`);
  const csp = home.headers.get("content-security-policy") ?? "";
  ok(/script-src 'self' 'nonce-/.test(csp) && /frame-ancestors 'none'/.test(csp), "CSP à nonce et anti-clickjacking présents");
  ok(home.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff");
  const adm = await fetch(`${BASE}/admin`, { redirect: "manual" });
  ok(adm.status === 307 && (adm.headers.get("location") ?? "").includes("/admin/login"), "Administration inaccessible sans session");

  // ---------------------------------------------------------------- admin : connexion + MFA
  const actx = await browser.newContext();
  const a = await actx.newPage();
  const errors = [];
  a.on("pageerror", (e) => errors.push(e.message));
  await a.goto(`${BASE}/admin/login`);
  await a.fill('input[name="email"]', adminEmail);
  await a.fill('input[name="password"]', adminPw);
  await a.click("button:has-text('Se connecter')");
  await a.waitForURL(/securite/);
  ok(a.url().includes("mfa=setup"), "MFA obligatoire : redirection vers la configuration");
  await a.click("button:has-text('Configurer maintenant')");
  await a.waitForURL(/setup=1/);
  const secret = decrypt(db.prepare("select mfaSecret from AdminUser where email = ?").get(adminEmail).mfaSecret);
  await a.fill('input[name="code"]', totp(secret));
  await a.click("button:has-text('Activer')");
  await a.waitForURL(/ok=mfa/);
  ok(db.prepare("select mfaEnabled from AdminUser where email = ?").get(adminEmail).mfaEnabled === 1, "MFA activé pour le compte");
  // reconnexion : mot de passe puis code
  await actx.clearCookies();
  await a.goto(`${BASE}/admin/login`);
  await a.fill('input[name="email"]', adminEmail);
  await a.fill('input[name="password"]', adminPw);
  await a.click("button:has-text('Se connecter')");
  await a.waitForURL(/login\/mfa/);
  await a.fill('input[name="code"]', "000000");
  await a.click("button:has-text('Valider')");
  await a.waitForURL(/error=1/);
  ok(true, "Code MFA faux refusé");
  // le serveur refuse de réutiliser un code déjà accepté (anti-rejeu) : on attend la fenêtre suivante
  await new Promise((r) => setTimeout(r, 30000 - (Date.now() % 30000) + 300));
  await a.fill('input[name="code"]', totp(secret));
  await a.click("button:has-text('Valider')");
  await a.waitForURL(`${BASE}/admin`);
  ok(await a.isVisible("text=Tableau de bord"), "Connexion en deux étapes réussie");
  const audits = db.prepare("select action from AuditLog where actor = ?").all(adminEmail).map((r) => r.action);
  ok(audits.includes("MFA_ENABLED") && audits.includes("MFA_FAIL") && audits.includes("LOGIN_OK"), `Journal d'audit : ${[...new Set(audits)].join(", ")}`);

  const pages = ["/admin", "/admin/finances", "/admin/reservations", "/admin/calendrier", "/admin/demandes", "/admin/messages", "/admin/clients", "/admin/circuits", "/admin/activites", "/admin/options", "/admin/destinations", "/admin/contenus", "/admin/pages", "/admin/medias", "/admin/avis", "/admin/promos", "/admin/newsletter", "/admin/identite", "/admin/parametres", "/admin/utilisateurs", "/admin/journal", "/admin/notifications", "/admin/recherche?q=MET"];
  const bad = [];
  for (const p of pages) {
    const r = await a.goto(`${BASE}${p}`);
    if (!r || r.status() !== 200 || (await a.locator("text=Unhandled Runtime Error").count())) bad.push(`${p} (${r?.status()})`);
  }
  ok(bad.length === 0 && errors.length === 0, `${pages.length} pages d'administration sans erreur${bad.length ? " — échecs : " + bad.join(", ") : ""}${errors.length ? " — " + errors[0] : ""}`);

  // identité : le nom saisi apparaît sur le site
  await a.goto(`${BASE}/admin/identite`);
  const phoneBefore = db.prepare("select value from Setting where key = 'brand.phone'").get()?.value ?? "";
  await a.fill('input[name="phone"]', "+212 5 00 00 00 00");
  await a.click("button:has-text('Enregistrer')");
  await a.waitForURL(/ok=1/);
  const footer = await (await fetch(`${BASE}/fr`)).text();
  ok(footer.includes("+212 5 00 00 00 00"), "Coordonnées modifiées dans l'admin affichées sur le site");
  db.prepare("update Setting set value = ? where key = 'brand.phone'").run(phoneBefore); // on remet le numéro d'origine

  // ---------------------------------------------------------------- voyageur : compte
  const cctx = await browser.newContext();
  const c = await cctx.newPage();
  const cEmail = `voyageur-${run}@example.com`;
  // une réservation sans compte avec cet e-mail (via l'API)
  const circuit = db.prepare("select id from Circuit where slug = 'escapade-saharienne-2j'").get();
  const dep = db.prepare("select id from Departure where circuitId = ? and status = 'OPEN' and capacity - seatsHeld >= 2 order by date limit 1").get(circuit.id);
  const br = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ circuitId: circuit.id, departureId: dep.id, adults: 2, childAges: [], privateTour: false, optionCodes: [], firstName: "Amina", lastName: "Test", email: cEmail, phone: "+212600000001", whatsapp: "", country: "Maroc", departureCity: "", specialNeeds: "", comments: "", consent: true, locale: "fr", website: "", promoCode: "" }),
  });
  const booking = await br.json();
  ok(br.status === 201, `Réservation sans compte : ${booking.reference}`);

  await c.goto(`${BASE}/fr/compte?mode=register`);
  await c.fill('input[name="firstName"]', "Amina");
  await c.fill('input[name="lastName"]', "Test");
  await c.fill('input[name="email"]', cEmail);
  await c.fill('input[name="password"]', "voyage-sahara-2026");
  await c.check('input[name="terms"]');
  await c.click("button:has-text('Créer un compte')");
  await c.waitForURL(/created=1/);
  ok(await c.isVisible("text=Bonjour Amina"), "Compte voyageur créé et connecté");
  const verify = lastMailLink(cEmail, /http[^"]+\/api\/account\/verify\?token=[\w-]+/);
  ok(!!verify, "E-mail de vérification enregistré");
  await c.goto(verify);
  await c.waitForURL(/verify=ok/);
  const linked = db.prepare("select customerId from Booking where reference = ?").get(booking.reference).customerId;
  ok(!!linked, "Vérification d'e-mail : la réservation sans compte est rattachée automatiquement");
  await c.goto(`${BASE}/fr/compte/dossier/${booking.reference}`);
  await c.fill('textarea[name="body"]', "Bonjour, pouvez-vous prévoir un repas végétarien ?");
  await c.click("button:has-text('Envoyer le message')");
  await c.waitForURL(/msg=sent/);
  ok(db.prepare("select count(*) n from Message m join Booking b on b.id = m.bookingId where b.reference = ?").get(booking.reference).n === 1, "Message du client enregistré");
  await c.click("summary:has-text('Demander l')");
  await c.fill('textarea[name="reason"]', "Changement de dates");
  await c.click("form button:has-text('Demander l')");
  await c.waitForURL(/cancel=sent/);
  ok(!!db.prepare("select cancelRequestedAt from Booking where reference = ?").get(booking.reference).cancelRequestedAt, "Demande d'annulation enregistrée (sans annulation automatique)");
  ok(db.prepare("select status from Booking where reference = ?").get(booking.reference).status === "PENDING", "Le statut reste à la décision de l'agence");

  // admin : réponse, document, paiement
  const bid = db.prepare("select id from Booking where reference = ?").get(booking.reference).id;
  await a.goto(`${BASE}/admin/reservations/${bid}`);
  await a.fill('textarea[name="body"]', "Bien noté, repas végétarien prévu.");
  await a.click("button:has-text('Envoyer')");
  await a.waitForURL(/ok=msg/);
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
  await a.fill('input[name="title"]', "Bon d'échange bivouac");
  await a.setInputFiles('input[name="file"]', { name: "bon.pdf", mimeType: "application/pdf", buffer: pdf });
  await a.click("button:has-text('Déposer')");
  await a.waitForURL(/ok=doc/);
  await a.setInputFiles('input[name="file"]', { name: "piege.pdf", mimeType: "application/pdf", buffer: Buffer.from("<script>alert(1)</script>") });
  await a.fill('input[name="title"]', "Faux PDF");
  await a.click("button:has-text('Déposer')");
  await a.waitForURL(/error=file/);
  ok(true, "Fichier déguisé (HTML renommé en .pdf) refusé");
  const doc = db.prepare("select id from BookingDocument where bookingId = ?").get(bid);
  ok((await fetch(`${BASE}/api/documents/${doc.id}`)).status === 403, "Document inaccessible sans droit (403)");
  const mine = await c.request.get(`${BASE}/api/documents/${doc.id}`);
  ok(mine.status() === 200 && (await mine.body()).subarray(0, 5).toString() === "%PDF-", "Document téléchargeable par le titulaire du dossier");
  await a.fill('input[name="amount"]', "500");
  await a.click("form:has(input[name=amount]) button");
  await a.waitForURL(/ok=payment/);
  const receipt = await c.goto(`${BASE}/fr/recu/${booking.reference}`);
  ok(receipt.status() === 200 && (await c.isVisible("text=Reçu de paiement")), "Reçu de paiement disponible pour le voyageur");

  // ---------------------------------------------------------------- sur mesure → devis → réservation
  const g = await (await browser.newContext()).newPage();
  const gEmail = `sur-mesure-${run}@example.com`;
  await g.goto(`${BASE}/fr/sur-mesure`);
  const form = g.locator("form:has(input[name=kind][value=SUR_MESURE])");
  await form.locator('input[name="name"]').fill("Karim Test");
  await form.locator('input[name="email"]').fill(gEmail);
  await form.locator('input[name="departureCity"]').fill("Fès");
  await form.locator('input[name="startDate"]').fill(new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10));
  await form.locator('textarea[name="message"]').fill("Trois jours dans le désert en famille, rythme tranquille.");
  await form.locator('input[name="consent"]').check();
  await form.locator("button[class*=btn-primary]").click();
  await g.waitForSelector("text=Numéro de dossier");
  const req = db.prepare("select id, reference from QuoteRequest where email = ?").get(gEmail);
  ok(/^SM-\d{4}-[A-Z0-9]{4}$/.test(req?.reference ?? ""), `Demande sur mesure numérotée : ${req?.reference}`);
  await a.goto(`${BASE}/admin/demandes/${req.id}`, { waitUntil: "networkidle" });
  await a.fill('textarea[name="lines"]', "Circuit privé 3 jours | 1 | 4000\nBivouac confort | 2 | 900");
  await a.click("button:has-text('Enregistrer et envoyer')");
  await a.waitForURL(/ok=sent/);
  const quote = db.prepare("select number, totalMad, status from Quote where requestId = ?").get(req.id);
  ok(quote.totalMad === 5800 && quote.status === "SENT", `Devis ${quote.number} calculé par le serveur (${quote.totalMad} MAD) et envoyé`);
  const qlink = lastMailLink(gEmail, /http[^"]+\/devis\/DV-[^"]+/);
  await g.goto(qlink);
  await g.click("button:has-text('J\\'accepte ce devis')");
  await g.waitForURL(/r=accepted/);
  ok(db.prepare("select status from Quote where number = ?").get(quote.number).status === "ACCEPTED", "Devis accepté par le client");
  await a.goto(`${BASE}/admin/demandes/${req.id}`);
  await a.click("button:has-text('Transformer en réservation')");
  await a.waitForURL(/ok=fromquote/);
  const qb = db.prepare("select reference, totalMad, status from Booking where quoteId = (select id from Quote where number = ?)").get(quote.number);
  ok(qb?.totalMad === 5800 && qb.status === "PENDING", `Devis transformé en réservation ${qb?.reference} (en attente de confirmation)`);

  // ---------------------------------------------------------------- newsletter
  const nEmail = `news-${run}@example.com`;
  await g.goto(`${BASE}/fr#newsletter`);
  await g.fill("#nl-email", nEmail);
  await g.check('#newsletter input[name="consent"]');
  await g.click("#newsletter button:has-text('M\\'inscrire')");
  await g.waitForSelector("text=Inscription enregistrée, text=Merci !", { timeout: 10000 }).catch(() => {});
  ok(db.prepare("select status from NewsletterSubscriber where email = ?").get(nEmail)?.status === "PENDING", "Newsletter : inscription en attente de confirmation (double opt-in)");
  await g.goto(lastMailLink(nEmail, /http[^"]+\/api\/newsletter\?action=confirm&(amp;)?token=[\w-]+/));
  ok(db.prepare("select status from NewsletterSubscriber where email = ?").get(nEmail)?.status === "CONFIRMED", "Newsletter : confirmation par lien");

  // ---------------------------------------------------------------- anti-énumération
  let locked = false;
  for (let i = 0; i < 12; i++) {
    const p = await (await browser.newContext()).newPage();
    await p.goto(`${BASE}/fr/espace-client`, { waitUntil: "networkidle" });
    await p.fill('input[name="ref"]', `MET-000000-${i}AAA`);
    await p.fill('input[name="email"]', "x@example.com");
    await Promise.all([p.waitForURL(/notfound/), p.click("button:has-text('Consulter')")]);
    if (p.url().includes("notfound=locked")) locked = true;
    await p.context().close();
  }
  ok(locked, "Recherche de dossiers limitée (anti-énumération)");
} finally {
  await browser.close();
  db.prepare("delete from AdminUser where email = ?").run(adminEmail);
  db.prepare("delete from RateLimit").run();
}
console.log(failures ? `\n${failures} échec(s)` : "\nTous les tests sont passés.");
process.exit(failures ? 1 : 0);
