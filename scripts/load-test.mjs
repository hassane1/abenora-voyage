/**
 * Test de charge local (à lancer contre un serveur de PRODUCTION : npm run build && npm start).
 * Usage : node scripts/load-test.mjs [http://localhost:3001] [connexions=100] [durée_s=20]
 *
 * Mesure le débit et la latence des pages clés, puis vérifie l'absence de survente
 * avec des centaines de réservations simultanées sur un même départ.
 * Pour ce test, démarrer le serveur avec RATE_LIMIT_MULTIPLIER=1000 (sinon la limitation de débit
 * par IP refuse — à juste titre — l'essentiel des requêtes venant d'une seule machine).
 *
 * ⚠ Les chiffres obtenus valent pour CETTE machine et une base SQLite locale : ils ne prouvent pas
 * une capacité en production (voir README §Performance).
 */
import autocannon from "autocannon";
import Database from "better-sqlite3";

const BASE = process.argv[2] ?? "http://localhost:3001";
const connections = Number(process.argv[3] ?? 100);
const duration = Number(process.argv[4] ?? 20);
const db = new Database(new URL("../dev.db", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const circuit = db.prepare("select id from Circuit where slug = 'immersion-desert-3j'").get();

const scenarios = [
  { title: "Accueil /fr", url: `${BASE}/fr` },
  { title: "Page Merzouga", url: `${BASE}/fr/destinations/merzouga` },
  { title: "Fiche circuit", url: `${BASE}/fr/circuits/immersion-desert-3j` },
  {
    title: "Calcul de prix (API, serveur)",
    url: `${BASE}/api/quote`,
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ circuitId: circuit.id, adults: 2, childAges: [7], privateTour: false, optionCodes: ["camp-standard"], locale: "fr" }),
  },
];

const results = [];
const only = process.env.ONLY_BOOKINGS === "1";
for (const s of only ? [] : scenarios) {
  const r = await autocannon({ ...s, connections, duration });
  const errors = r.errors + r.timeouts + (r.non2xx ?? 0);
  results.push({ scénario: s.title, "req/s (moy.)": Math.round(r.requests.average), "latence p50 ms": r.latency.p50, "latence p97,5 ms": r.latency.p97_5, "latence p99 ms": r.latency.p99, erreurs: errors, total: r.requests.total });
  console.log(`✔ ${s.title} : ${Math.round(r.requests.average)} req/s, p99 ${r.latency.p99} ms, ${errors} erreur(s)`);
}
console.table(results);

// --- Survente : N réservations simultanées de 2 personnes sur un départ libre ------------------
const dep = db.prepare("select id, capacity, seatsHeld from Departure where circuitId = ? and status = 'OPEN' and seatsHeld = 0 order by date desc limit 1").get(circuit.id);
const N = 300;
const contact = { firstName: "Charge", lastName: "Test", phone: "+212600000000", whatsapp: "", country: "Maroc", departureCity: "", specialNeeds: "", comments: "test de charge", consent: true, locale: "fr", website: "", promoCode: "" };
const t0 = Date.now();
const statuses = await Promise.all(
  Array.from({ length: N }, (_, i) =>
    fetch(`${BASE}/api/bookings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ circuitId: circuit.id, departureId: dep.id, adults: 2, childAges: [], privateTour: false, optionCodes: [], ...contact, email: `charge${i}@example.com` }),
    }).then((r) => r.status, () => 0),
  ),
);
const after = db.prepare("select seatsHeld, capacity from Departure where id = ?").get(dep.id);
const created = statuses.filter((s) => s === 201).length;
const booked = db.prepare("select coalesce(sum(adults + children), 0) n from Booking where departureId = ? and status in ('PENDING','CONFIRMED')").get(dep.id).n;
console.log(`\n${N} réservations simultanées en ${Date.now() - t0} ms : ${created} acceptées, ${statuses.filter((s) => s === 409).length} refusées (complet), ${statuses.filter((s) => s !== 201 && s !== 409).length} autres`);
const counts = statuses.reduce((m, s) => ((m[s] = (m[s] ?? 0) + 1), m), {});
console.log("Codes HTTP :", JSON.stringify(counts), "(0 = connexion refusée côté client)");
const noOversell = after.seatsHeld <= after.capacity && booked === after.seatsHeld && created * 2 === booked;
console.log(`${noOversell ? "✔" : "✘"} Places : ${after.seatsHeld}/${after.capacity} bloquées, ${booked} voyageurs en dossiers — ${noOversell ? "aucune survente" : "INCOHÉRENCE"}`);
console.log("Nettoyage : npm run db:reset");
process.exit(noOversell ? 0 : 1);
