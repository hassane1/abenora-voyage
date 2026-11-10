/**
 * Test de bout en bout du moteur de réservation (serveur lancé : npm run dev).
 * Usage : node scripts/test-booking-flow.mjs [http://localhost:3000]
 *
 * Vérifie : calcul du prix, création d'une réservation « en attente »,
 * notification enregistrée, protection contre la surréservation (requêtes simultanées).
 */
import Database from "better-sqlite3";

const BASE = process.argv[2] ?? "http://localhost:3000";
const db = new Database(new URL("../dev.db", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "✔" : "✘"} ${msg}`);
  if (!cond) failures++;
};
const post = (path, body) => fetch(`${BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `test-${Math.random()}` }, body: JSON.stringify(body) });

const circuit = db.prepare("select id, priceAdultMad from Circuit where slug = 'immersion-desert-3j'").get();
const dep = db.prepare("select id, capacity, seatsHeld from Departure where circuitId = ? and status = 'OPEN' and seatsHeld = 0 order by date limit 1").get(circuit.id);

// 1. Devis
const q = await (await post("/api/quote", { circuitId: circuit.id, adults: 2, childAges: [7, 2], privateTour: false, optionCodes: ["camp-standard"], locale: "fr" })).json();
const expected = 2 * circuit.priceAdultMad + Math.round(circuit.priceAdultMad * 0.5); // 2 adultes + 1 enfant à 50 %, bébé gratuit
ok(q.price?.lines.reduce((s, l) => s + l.amount, 0) === expected, `Calcul du prix (attendu ${expected} MAD avant réductions, reçu ${q.price?.lines.reduce((s, l) => s + l.amount, 0)})`);
ok(q.price?.isDemo === true, "Le tarif est signalé comme démonstration");

// 2. Réservation
const contact = { firstName: "Test", lastName: "Automatique", email: "test.parcours@example.com", phone: "+212600000000", whatsapp: "", country: "Maroc", departureCity: "Fès", specialNeeds: "", comments: "Créée par scripts/test-booking-flow.mjs", consent: true, locale: "fr", website: "", promoCode: "" };
const r = await post("/api/bookings", { circuitId: circuit.id, departureId: dep.id, adults: 2, childAges: [7], privateTour: false, optionCodes: ["camp-standard"], ...contact });
const created = await r.json();
ok(r.status === 201 && /^[A-Z]{2,5}-\d{6}-[A-Z0-9]{4}$/.test(created.reference), `Réservation créée : ${created.reference}`);
ok(created.status === "PENDING", "Statut « En attente de confirmation »");
const seats = db.prepare("select seatsHeld from Departure where id = ?").get(dep.id).seatsHeld;
ok(seats === 3, `Places bloquées sur le départ : ${seats}/3`);
const notifs = db.prepare("select status, \"to\" from Notification where bookingId = (select id from Booking where reference = ?)").all(created.reference);
ok(notifs.length >= 1, `Notifications enregistrées : ${notifs.map((n) => `${n.to} (${n.status})`).join(", ")}`);

// 3. Anti-surréservation : 6 demandes simultanées de 4 personnes sur un départ de capacité 12 dont 3 déjà pris
const results = await Promise.all(
  Array.from({ length: 6 }, (_, i) =>
    post("/api/bookings", { circuitId: circuit.id, departureId: dep.id, adults: 4, childAges: [], privateTour: false, optionCodes: [], ...contact, email: `concurrent${i}@example.com` }),
  ),
);
const statuses = results.map((x) => x.status);
const accepted = statuses.filter((s) => s === 201).length;
const after = db.prepare("select seatsHeld, capacity from Departure where id = ?").get(dep.id);
ok(accepted === 2 && statuses.filter((s) => s === 409).length === 4, `Requêtes simultanées : ${accepted} acceptées, ${statuses.filter((s) => s === 409).length} refusées (complet)`);
ok(after.seatsHeld <= after.capacity, `Capacité jamais dépassée : ${after.seatsHeld}/${after.capacity}`);

// 4. Validation serveur
const bad = await post("/api/bookings", { circuitId: circuit.id, departureId: dep.id, adults: 0, childAges: [], privateTour: false, optionCodes: [], ...contact, email: "pas-un-email" });
ok(bad.status === 400, "Données invalides refusées par le serveur (400)");

console.log(failures ? `\n${failures} échec(s)` : "\nTous les tests sont passés.");
console.log("Nettoyage : npm run db:reset pour remettre la base de démonstration à zéro.");
process.exit(failures ? 1 : 0);
