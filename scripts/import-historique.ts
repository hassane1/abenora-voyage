/**
 * Import de l'historique des voyages réalisés (docs/HISTORIQUE-VOYAGES-BENANI.xlsx).
 *   npm run import:historique -- --dry-run [--file chemin.xlsx]   → contrôle seul
 *   npm run import:historique -- [--file chemin.xlsx]             → sauvegarde de la base puis import
 * Chaque ligne crée (ou met à jour) un dossier CONFIRMÉ et terminé, marqué « historique » :
 *   - aucune place bloquée sur les départs (départ d'archive fermé, à capacité 0) ;
 *   - aucun paiement enregistré (le montant payé reste une information interne) ;
 *   - aucun e-mail envoyé ; AUCUN avis importé (seul le client peut écrire son avis, via une invitation).
 */
import "dotenv/config";
import path from "node:path";
import { copyFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import ExcelJS from "exceljs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const file = args.includes("--file") ? args[args.indexOf("--file") + 1] : path.join(process.cwd(), "docs", "HISTORIQUE-VOYAGES-BENANI.xlsx");
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });
const SHEET = "Voyages réalisés";

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/\*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const HEAD: Record<string, string> = {
  "ref. interne": "ref", type: "type", destination: "dest", "programme (liste ou texte libre)": "program", "date de depart": "start", "date de retour": "end", adultes: "adults", enfants: "children",
  "nom du client principal": "last", prenom: "first", "e-mail": "email", "telephone / whatsapp": "phone", "langue preferee": "lang", "montant paye (mad, facultatif)": "paid", "ville de depart": "from",
  "remarques internes": "notes", "le client accepte d'etre contacte pour donner son avis": "consent", "date du consentement": "consentDate", "moyen du consentement": "consentHow",
};
const cellValue = (v: ExcelJS.CellValue): unknown => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if ("result" in v) return cellValue((v as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
    if ("richText" in v) return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join("");
    if ("text" in v) return String((v as { text: unknown }).text);
    return null;
  }
  return typeof v === "string" ? v.trim() : v;
};
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const int = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN);
const day = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet(SHEET);
  if (!ws) throw new Error(`Onglet « ${SHEET} » introuvable.`);
  const keys: (string | null)[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => (keys[i] = HEAD[norm(str(cellValue(c.value)))] ?? null));
  const rows: (Record<string, unknown> & { _line: number })[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const r: Record<string, unknown> & { _line: number } = { _line: n };
    row.eachCell({ includeEmpty: false }, (c, i) => {
      const k = keys[i];
      const v = cellValue(c.value);
      if (k && v !== null && v !== "") r[k] = v;
    });
    if (Object.keys(r).length > 1) rows.push(r);
  });

  const destinations = await db.destination.findMany();
  const destBy = new Map(destinations.flatMap((d) => [[norm(String((d.name as Record<string, string>).fr ?? "")), d], [d.slug, d]] as [string, typeof d][]));
  const circuits = await db.circuit.findMany({ select: { id: true, slug: true, title: true, destinationId: true } });
  const errors: string[] = [];
  const err = (line: number, m: string) => errors.push(`ligne ${line} : ${m}`);
  const seen = new Set<string>();
  type Plan = { r: (typeof rows)[number]; ref: string; dest: (typeof destinations)[number]; circuitId: string | null; start: Date; end: Date; consent: boolean };
  const plans: Plan[] = [];
  const today = day(new Date());
  for (const r of rows) {
    const ref = str(r.ref).toUpperCase();
    if (/^EX-/.test(ref)) continue;
    const L = r._line;
    const before = errors.length;
    if (!/^[A-Z0-9][A-Z0-9-]{1,30}$/.test(ref)) err(L, `référence « ${ref || "vide"} » invalide (lettres, chiffres et tirets).`);
    if (seen.has(ref)) err(L, `référence ${ref} en double.`);
    seen.add(ref);
    if (!["national", "international", "omra", "hajj"].includes(norm(str(r.type)))) err(L, "« Type » : National, International, Omra ou Hajj.");
    const dest = destBy.get(norm(str(r.dest)));
    if (!dest) err(L, `destination « ${str(r.dest)} » inconnue (liste déroulante).`);
    const start = r.start instanceof Date ? day(r.start) : null;
    const end = r.end instanceof Date ? day(r.end) : null;
    if (!start) err(L, "« Date de départ » invalide (JJ/MM/AAAA).");
    if (!end) err(L, "« Date de retour » invalide (JJ/MM/AAAA).");
    if (start && end && end < start) err(L, "la date de retour est avant la date de départ.");
    if (end && end >= today) err(L, "la date de retour doit être passée (voyage déjà réalisé).");
    const adults = int(r.adults);
    if (!adults || Number.isNaN(adults) || adults < 1) err(L, "« Adultes » : nombre entier ≥ 1.");
    if (Number.isNaN(int(r.children))) err(L, "« Enfants » : nombre entier.");
    if (Number.isNaN(int(r.paid))) err(L, "« Montant payé » : nombre en MAD.");
    if (!str(r.last) || !str(r.first)) err(L, "nom et prénom du client obligatoires.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(r.email))) err(L, `e-mail « ${str(r.email)} » invalide.`);
    const c = norm(str(r.consent));
    if (c !== "oui" && c !== "non") err(L, "consentement à l'avis : Oui ou Non (obligatoire).");
    if (c === "oui" && !(r.consentDate instanceof Date)) err(L, "consentement « Oui » : indiquez la date du consentement.");
    if (c === "oui" && !str(r.consentHow)) err(L, "consentement « Oui » : indiquez le moyen (oral, WhatsApp, e-mail, écrit).");
    if (str(r.lang) && !["FR", "EN", "AR"].includes(str(r.lang).toUpperCase())) err(L, "« Langue » : FR, EN ou AR.");
    if (errors.length > before || !dest || !start || !end) continue;
    const p = norm(str(r.program));
    const circuit = p ? circuits.find((x) => x.slug === p || norm(String((x.title as Record<string, string>).fr ?? "")) === p) : undefined;
    plans.push({ r, ref, dest, circuitId: circuit?.id ?? null, start, end, consent: c === "oui" });
  }

  console.log(`Fichier : ${file}`);
  console.log(`Dossiers à créer ou mettre à jour : ${plans.length} (dont ${plans.filter((p) => p.consent).length} avec consentement à l'avis)`);
  if (errors.length) {
    console.log(`\n✘ ${errors.length} erreur(s) — rien n'a été importé :`);
    errors.forEach((e) => console.log(`  - « ${SHEET} », ${e}`));
    process.exitCode = 1;
    return;
  }
  if (DRY) {
    console.log("\n✔ Contrôle réussi (dry-run) : aucune modification effectuée.");
    return;
  }

  const dbFile = dbUrl.replace(/^file:/, "");
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
  await copyFile(dbFile, `${dbFile}.bak-avant-import-historique-${stamp}`);
  console.log(`Sauvegarde : ${dbFile}.bak-avant-import-historique-${stamp}`);

  for (const p of plans) {
    const r = p.r;
    // programme : celui du site si reconnu, sinon un programme d'archive (non publié) par destination
    let circuitId = p.circuitId;
    if (!circuitId) {
      const slug = `historique-${p.dest.slug}`;
      const arch =
        (await db.circuit.findUnique({ where: { slug } })) ??
        (await db.circuit.create({
          data: {
            slug, destinationId: p.dest.id, published: false, title: { fr: `Voyage réalisé — ${(p.dest.name as Record<string, string>).fr}` }, summary: { fr: "Programme d'archive pour les dossiers importés depuis l'historique." },
            days: 1, nights: 0, startPoint: "—", endPoint: "—", transport: { fr: "" }, accommodation: { fr: "" }, meals: { fr: "" }, included: { fr: [] }, excluded: { fr: [] }, optionalActivities: { fr: [] }, cancellationPolicy: { fr: "" }, warnings: { fr: [] },
            priceStatus: "ON_REQUEST", programType: ["omra", "hajj"].includes(norm(str(r.type))) ? "OMRA" : "CIRCUIT", sourceNote: "Archive : dossiers importés depuis l'historique", defaultCapacity: 0,
          },
        }));
      circuitId = arch.id;
    }
    // départ d'archive : fermé, aucune place bloquée
    const dep = (await db.departure.findUnique({ where: { circuitId_date: { circuitId, date: p.start } } })) ?? (await db.departure.create({ data: { circuitId, date: p.start, capacity: 0, seatsHeld: 0, status: "CLOSED", isDemo: false } }));
    const email = str(r.email).toLowerCase();
    const customer = await db.customer.findFirst({ where: { email, emailVerifiedAt: { not: null } } });
    const reference = `HIS-${p.ref}`.slice(0, 40);
    const data = {
      circuitId, departureId: dep.id, startDate: p.start, endDate: p.end, adults: int(r.adults)!, children: int(r.children) ?? 0, childAges: [], privateTour: false, options: [],
      // récapitulatif compatible avec l'affichage des dossiers (aucun montant : voyage réalisé hors site)
      pricing: {
        onRequest: true, isDemo: false, noteKind: null, lines: [], discounts: [], subtotal: 0, total: 0, taxIncluded: 0, taxRatePercent: 0, deposit: 0, balance: 0,
        travelers: int(r.adults)! + (int(r.children) ?? 0),
        source: "HISTORIQUE", importedAt: new Date().toISOString(), program: str(r.program) || null, type: str(r.type), amountPaidMad: int(r.paid),
        reviewConsent: { value: p.consent, date: r.consentDate instanceof Date ? day(r.consentDate).toISOString() : null, channel: str(r.consentHow) || null },
      },
      totalMad: 0, depositMad: 0, pricesAreDemo: false, status: "CONFIRMED", paymentStatus: "NONE",
      firstName: str(r.first), lastName: str(r.last), email, phone: str(r.phone), whatsapp: str(r.phone) || null, country: "Maroc", departureCity: str(r.from) || null,
      comments: str(r.notes) ? `[Historique] ${str(r.notes)}` : "[Historique]", locale: (str(r.lang) || "FR").toLowerCase(),
      consentAt: r.consentDate instanceof Date ? day(r.consentDate) : new Date(), customerId: customer?.id ?? null,
    };
    const existing = await db.booking.findUnique({ where: { reference } });
    // un client qui s'est désinscrit des demandes d'avis le reste, même si le fichier indique « Oui »
    const withdrawn = (existing?.pricing as { reviewConsent?: { withdrawnAt?: string } } | null)?.reviewConsent?.withdrawnAt;
    if (withdrawn) data.pricing.reviewConsent = { ...data.pricing.reviewConsent, value: false, withdrawnAt: withdrawn } as typeof data.pricing.reviewConsent;
    if (existing) await db.booking.update({ where: { id: existing.id }, data: data as never });
    else {
      const b = await db.booking.create({ data: { ...data, reference, accessToken: randomBytes(24).toString("base64url") } as never });
      await db.bookingEvent.create({ data: { bookingId: b.id, type: "NOTE", actor: "import", note: "Dossier importé depuis l'historique (voyage déjà réalisé ; aucun e-mail envoyé, aucun paiement enregistré)." } });
    }
    console.log(`${existing ? "↻" : "+"} ${reference} — ${data.lastName} ${data.firstName}${p.consent ? " (avis : consentement oui)" : ""}`);
  }
  console.log(`\n✔ Import terminé : ${plans.length} dossier(s). Aucune invitation envoyée : utilisez Administration → Avis.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
