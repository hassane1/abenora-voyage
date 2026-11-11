/**
 * Import du fichier Excel des voyages (docs/MODELE-VOYAGES-BENANI.xlsx ou fichier renvoyé par l'agence).
 *   npm run import:voyages -- --dry-run [--file chemin.xlsx]   → contrôle seul, rapport d'erreurs ligne par ligne
 *   npm run import:voyages -- [--file chemin.xlsx]             → sauvegarde de la base puis création / mise à jour
 * Les voyages sont identifiés par leur RÉFÉRENCE (NAT-001, INT-001, OMR-001) ; rien d'autre n'est effacé.
 * Les lignes dont la référence commence par EX- (exemples) sont ignorées.
 */
import "dotenv/config";
import path from "node:path";
import { copyFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { destConfigSchema } from "../src/lib/composer-engine";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const file = args.includes("--file") ? args[args.indexOf("--file") + 1] : path.join(process.cwd(), "docs", "MODELE-VOYAGES-BENANI.xlsx");
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });

type Row = Record<string, unknown> & { _line: number };
const errors: string[] = [];
const warn: string[] = [];
const err = (sheet: string, line: number, msg: string) => errors.push(`« ${sheet} », ligne ${line} : ${msg}`);

// en-têtes du modèle → clés internes (le libellé exact importe peu : comparaison sans accents ni astérisque)
const HEAD: Record<string, string> = {
  reference: "ref", publier: "publish", destination: "dest", type: "type", "titre fr": "title_fr", "titre en": "title_en", "titre ar": "title_ar",
  "resume fr": "summary_fr", "resume en": "summary_en", "resume ar": "summary_ar", "nuits d'hotel": "nights", "nuits d'hotel (calcule)": "nights", "journee de trajet": "travelDay", "jours (calcule)": "days",
  "ville de depart": "from", "ville d'arrivee": "to", "transport (fr)": "transport", "hebergement (fr)": "accommodation", repas: "meals", "inclus (fr, separes par ;)": "included", "non inclus (fr, separes par ;)": "excluded",
  "prix adulte (mad)": "price", "mode de prix": "mode", "statut du prix": "status", "% prix enfant (4-11 ans)": "child", "gratuit moins de (ans)": "childFree", "supplement prive (mad/pers.)": "private", "acompte %": "deposit",
  "places par depart": "capacity", "conditions d'annulation (fr)": "cancel", "avertissements (fr, separes par ;)": "warnings", "identifiant web (facultatif)": "slug", "compagnie aerienne": "airline", vol: "flight",
  "nuits a medine": "nMed", "nuits a la mecque": "nMak", "aeroport d'arrivee": "arrival", "encadrement religieux": "guide", "visa inclus": "visa",
  "reference du voyage": "ref", "hotel ou formule": "hotel", "ville et distance au haram (ou detail)": "detail", "double (mad/pers.)": "d2", "triple (mad/pers.)": "t3", "quadruple (mad/pers.)": "q4", "quintuple (mad/pers.)": "q5", "sextuple (mad/pers.)": "s6",
  "n° du jour": "day", "titre du jour fr": "title_fr", "description fr": "desc_fr", "etapes / visites fr (separees par ;)": "items_fr", "repas du jour": "meals", "nuit a (lieu, type d'hebergement)": "night",
  "date de depart": "date", places: "seats", statut: "status", "reference du voyage (ou tous)": "ref", "code court": "code", groupe: "group", "libelle fr": "label_fr", "libelle en": "label_en", "libelle ar": "label_ar", "prix (mad)": "price", unite: "unit",
  "nuits min": "min", "nuits max": "max", "nuits proposees": "def", ...Object.fromEntries(["essentiel", "confort", "luxe"].flatMap((k) => [[`${k} – type d'hebergement`, `${k}_type`], [`${k} – description`, `${k}_desc`], [`${k} – prix (mad/nuit/pers.)`, `${k}_price`]])), "vol a/r depuis casablanca (mad/pers.)": "flight", "supplement autres aeroports (mad/pers.)": "flightExtra", remarques: "note",
};
const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/\*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
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
function rows(wb: ExcelJS.Workbook, name: string): Row[] {
  const ws = wb.getWorksheet(name);
  if (!ws) {
    errors.push(`Onglet « ${name} » introuvable : ne renommez pas les onglets du modèle.`);
    return [];
  }
  const keys: (string | null)[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => (keys[i] = HEAD[norm(String(cellValue(c.value) ?? ""))] ?? null));
  const out: Row[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const r: Row = { _line: n };
    let any = false;
    row.eachCell({ includeEmpty: false }, (c, i) => {
      const k = keys[i];
      if (!k || k === "days") return;
      const v = cellValue(c.value);
      if (v !== null && v !== "") {
        r[k] = v;
        any = true;
      }
    });
    if (any && !(keys.includes("ref") && !r.ref && Object.keys(r).length <= 2)) out.push(r);
  });
  return out;
}
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const int = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN);
const list = (v: unknown) => str(v).split(";").map((x) => x.trim()).filter(Boolean);
const tri = (fr: unknown, en?: unknown, ar?: unknown) => ({ fr: str(fr), ...(str(en) ? { en: str(en) } : {}), ...(str(ar) ? { ar: str(ar) } : {}) });
const slugify = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
const STATUS: Record<string, string> = { demo: "DEMO", indicatif: "INDICATIVE", valide: "VALIDATED", "sur demande": "ON_REQUEST" };
const TYPE: Record<string, string> = { circuit: "CIRCUIT", sejour: "SEJOUR", croisiere: "CROISIERE", omra: "OMRA", hajj: "OMRA" };
const GROUP: Record<string, string> = { hebergement: "HEBERGEMENT", activite: "ACTIVITE", repas: "REPAS", transfert: "TRANSFERT", service: "SERVICE" };
const UNIT: Record<string, string> = { "par personne": "PER_PERSON", "par reservation": "PER_BOOKING", "par personne et par nuit": "PER_PERSON_NIGHT" };
const yes = (v: unknown) => norm(str(v)) === "oui";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const destinations = await db.destination.findMany();
  const destByName = new Map(destinations.flatMap((d) => [[norm(String((d.name as Record<string, string>).fr ?? "")), d], [d.slug, d]] as [string, typeof d][]));

  type Trip = { sheet: string; r: Row; program: "NAT" | "INT" | "OMR" };
  const trips: Trip[] = [
    ...rows(wb, "Voyages nationaux").map((r) => ({ sheet: "Voyages nationaux", r, program: "NAT" as const })),
    ...rows(wb, "Voyages internationaux").map((r) => ({ sheet: "Voyages internationaux", r, program: "INT" as const })),
    ...rows(wb, "Omra & Hajj").map((r) => ({ sheet: "Omra & Hajj", r, program: "OMR" as const })),
  ];
  const grid = rows(wb, "Grille hôtels × chambres");
  const daysRows = rows(wb, "Programme jour par jour");
  const deps = rows(wb, "Départs & places");
  const opts = rows(wb, "Options & suppléments");
  const sm = rows(wb, "Sur mesure – tarifs");
  const isExample = (ref: unknown) => /^EX-/i.test(str(ref));

  // ── contrôle des voyages
  const seen = new Set<string>();
  const plans: { ref: string; data: Record<string, unknown>; slug: string; destId: string }[] = [];
  for (const { sheet, r, program } of trips) {
    const ref = str(r.ref).toUpperCase();
    if (isExample(ref)) continue;
    const L = r._line;
    const before = errors.length;
    if (!new RegExp(`^${program}-\\d{3,4}$`).test(ref)) err(sheet, L, `référence « ${ref || "vide"} » invalide (format attendu ${program}-001).`);
    if (seen.has(ref)) err(sheet, L, `référence ${ref} en double.`);
    seen.add(ref);
    const dest = destByName.get(norm(str(r.dest)));
    if (!dest) err(sheet, L, `destination « ${str(r.dest)} » inconnue (utilisez la liste déroulante).`);
    for (const [k, label] of [["title_fr", "Titre FR"], ["summary_fr", "Résumé FR"], ["from", "Ville de départ"]] as const) if (!str(r[k])) err(sheet, L, `« ${label} » est obligatoire.`);
    if (program !== "OMR" && !str(r.to)) err(sheet, L, "« Ville d'arrivée » est obligatoire.");
    const nights = program === "OMR" ? (int(r.nMed) ?? 0) + (int(r.nMak) ?? 0) : int(r.nights);
    if (!nights || Number.isNaN(nights) || nights < 1) err(sheet, L, program === "OMR" ? "indiquez les nuits à Médine et/ou à La Mecque." : "« Nuits d'hôtel » doit être un nombre entier ≥ 1.");
    const status = STATUS[norm(str(r.status))];
    if (!status) err(sheet, L, `« Statut du prix » invalide (${str(r.status) || "vide"}) : Démo, Indicatif, Validé ou Sur demande.`);
    const price = int(r.price);
    if (Number.isNaN(price)) err(sheet, L, "« Prix adulte » doit être un nombre en MAD, sans espace ni texte.");
    const gridRows = grid.filter((g) => str(g.ref).toUpperCase() === ref);
    for (const g of gridRows) for (const k of ["d2", "t3", "q4", "q5", "s6"]) if (Number.isNaN(int(g[k]))) err("Grille hôtels × chambres", g._line, `prix « ${k} » invalide.`);
    const gridMin = gridRows.flatMap((g) => ["d2", "t3", "q4", "q5", "s6"].map((k) => int(g[k]))).filter((v): v is number => typeof v === "number" && v > 0);
    if (status && status !== "ON_REQUEST" && price === null && gridMin.length === 0) err(sheet, L, "prix manquant : indiquez « Prix adulte » ou une grille hôtels × chambres (ou statut « Sur demande »).");
    const travel = yes(r.travelDay);
    const days = (nights || 0) + 1 + (travel ? 1 : 0);
    if (!dest || errors.length > before) continue; // ligne en erreur : signalée, les autres lignes restent contrôlées
    const slug = str(r.slug) ? slugify(str(r.slug)) : slugify(str(r.title_fr));
    if (!slug) err(sheet, L, "identifiant web impossible à créer : précisez la colonne « Identifiant web ».");
    const colKeys = [
      { key: "s6", fr: "Sextuple", en: "Sextuple", ar: "سداسي" },
      { key: "q5", fr: "Quintuple", en: "Quintuple", ar: "خماسي" },
      { key: "q4", fr: "Quadruple", en: "Quadruple", ar: "رباعي" },
      { key: "t3", fr: "Triple", en: "Triple", ar: "ثلاثي" },
      { key: "d2", fr: "Double", en: "Double", ar: "ثنائي" },
    ].filter((c) => gridRows.some((g) => int(g[c.key])));
    const priceGrid = gridRows.length
      ? { columns: colKeys.map((c) => ({ key: c.key, label: { fr: c.fr, en: c.en, ar: c.ar } })), rows: gridRows.map((g) => ({ label: { fr: str(g.hotel) }, detail: { fr: str(g.detail) }, prices: Object.fromEntries(colKeys.map((c) => [c.key, int(g[c.key]) || null])) })) }
      : null;
    const omraBits = program === "OMR" ? [str(r.airline) && `Compagnie : ${str(r.airline)}`, str(r.flight) && `Vol ${str(r.flight).toLowerCase()}`, str(r.arrival) && `arrivée à ${str(r.arrival)}`, `${int(r.nMed) ?? 0} nuit(s) à Médine, ${int(r.nMak) ?? 0} à La Mecque`].filter(Boolean).join(" · ") : str(r.airline) ? `Compagnie : ${str(r.airline)}${str(r.flight) ? ` · vol ${str(r.flight).toLowerCase()}` : ""}` : "";
    const included = list(r.included);
    if (program === "OMR" && yes(r.visa) && !included.some((x) => /visa/i.test(x))) included.push("Visa Omra");
    if (program === "OMR" && yes(r.guide) && !included.some((x) => /encadrement/i.test(x))) included.push("Encadrement religieux");
    plans.push({
      ref,
      slug,
      destId: dest.id,
      data: {
        title: tri(r.title_fr, r.title_en, r.title_ar),
        summary: tri(r.summary_fr, r.summary_en, r.summary_ar),
        days,
        nights,
        startPoint: str(r.from),
        endPoint: str(r.to) || str(r.from),
        transport: { fr: [str(r.transport), omraBits].filter(Boolean).join(" — ") },
        accommodation: { fr: str(r.accommodation) },
        meals: { fr: str(r.meals) },
        included: { fr: included },
        excluded: { fr: list(r.excluded) },
        cancellationPolicy: { fr: str(r.cancel) },
        warnings: { fr: list(r.warnings) },
        pricingMode: norm(str(r.mode)) === "par groupe" ? "PER_GROUP" : "PER_PERSON",
        priceAdultMad: price ?? (gridMin.length ? Math.min(...gridMin) : null),
        childPricePercent: int(r.child) ?? 50,
        childFreeUnderAge: int(r.childFree) ?? 4,
        privateSupplementMad: int(r.private) ?? 0,
        depositPercent: int(r.deposit) ?? 30,
        defaultCapacity: int(r.capacity) ?? 12,
        priceStatus: status,
        priceGrid,
        programType: program === "OMR" ? "OMRA" : (TYPE[norm(str(r.type))] ?? "CIRCUIT"),
        published: yes(r.publish),
      },
    });
  }
  const knownRefs = seen; // toutes les références des onglets voyages (même en erreur) : évite les erreurs en cascade
  // ── contrôle des onglets liés
  for (const d of daysRows) {
    if (isExample(d.ref)) continue;
    if (!knownRefs.has(str(d.ref).toUpperCase())) err("Programme jour par jour", d._line, `référence « ${str(d.ref)} » absente des onglets voyages.`);
    if (!int(d.day) || Number.isNaN(int(d.day))) err("Programme jour par jour", d._line, "« N° du jour » invalide.");
    if (!str(d.title_fr)) err("Programme jour par jour", d._line, "« Titre du jour FR » obligatoire.");
  }
  for (const d of deps) {
    if (isExample(d.ref)) continue;
    if (!knownRefs.has(str(d.ref).toUpperCase())) err("Départs & places", d._line, `référence « ${str(d.ref)} » absente des onglets voyages.`);
    if (!(d.date instanceof Date) || Number.isNaN(d.date.getTime())) err("Départs & places", d._line, "date invalide (format JJ/MM/AAAA).");
    else if (d.date < new Date()) warn.push(`« Départs & places », ligne ${d._line} : date passée, ignorée.`);
    if (!int(d.seats) || Number.isNaN(int(d.seats))) err("Départs & places", d._line, "« Places » doit être un entier ≥ 1.");
  }
  for (const o of opts) {
    const ref = str(o.ref).toUpperCase();
    if (isExample(ref)) continue;
    if (ref !== "TOUS" && !knownRefs.has(ref)) err("Options & suppléments", o._line, `référence « ${str(o.ref)} » absente des onglets voyages (ou TOUS).`);
    if (!/^[a-z0-9-]{2,40}$/.test(str(o.code))) err("Options & suppléments", o._line, "« Code court » : minuscules, chiffres et tirets uniquement.");
    if (!GROUP[norm(str(o.group))]) err("Options & suppléments", o._line, "« Groupe » invalide.");
    if (!UNIT[norm(str(o.unit))]) err("Options & suppléments", o._line, "« Unité » invalide.");
    if (int(o.price) === null || Number.isNaN(int(o.price))) err("Options & suppléments", o._line, "« Prix » invalide.");
    if (!str(o.label_fr)) err("Options & suppléments", o._line, "« Libellé FR » obligatoire.");
  }
  const smPlans: { slug: string; r: Row }[] = [];
  for (const s of sm) {
    const dest = destByName.get(norm(str(s.dest)));
    if (!dest) {
      err("Sur mesure – tarifs", s._line, `destination « ${str(s.dest)} » inconnue.`);
      continue;
    }
    const [mn, mx, df] = [int(s.min), int(s.max), int(s.def)];
    if ([mn, mx, df].some((x) => x !== null && (Number.isNaN(x) || x < 1 || x > 14))) err("Sur mesure – tarifs", s._line, "nuits : entiers de 1 à 14.");
    else if (mn && mx && df && !(mn <= df && df <= mx)) err("Sur mesure – tarifs", s._line, "nuits : il faut min ≤ proposées ≤ max.");
    for (const k of ["essentiel_price", "confort_price", "luxe_price", "flight", "flightExtra"]) if (Number.isNaN(int(s[k]))) err("Sur mesure – tarifs", s._line, `prix « ${k} » invalide.`);
    smPlans.push({ slug: dest.slug, r: s });
  }

  // ── rapport
  console.log(`Fichier : ${file}`);
  console.log(`Voyages à créer ou mettre à jour : ${plans.length} · jours de programme : ${daysRows.filter((d) => !isExample(d.ref)).length} · départs : ${deps.filter((d) => !isExample(d.ref)).length} · options : ${opts.filter((o) => !isExample(o.ref)).length} · destinations sur mesure : ${smPlans.length}`);
  warn.forEach((w) => console.log("⚠ " + w));
  if (errors.length) {
    console.log(`\n✘ ${errors.length} erreur(s) — rien n'a été importé :`);
    errors.forEach((e) => console.log("  - " + e));
    process.exitCode = 1;
    return;
  }
  if (DRY) {
    console.log("\n✔ Contrôle réussi (dry-run) : aucune modification effectuée.");
    return;
  }

  // ── import réel : sauvegarde puis écritures
  const dbFile = dbUrl.replace(/^file:/, "");
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
  await copyFile(dbFile, `${dbFile}.bak-avant-import-voyages-${stamp}`);
  console.log(`Sauvegarde : ${dbFile}.bak-avant-import-voyages-${stamp}`);
  const tag = (ref: string) => `[REF:${ref}]`;
  const circuitIds = new Map<string, string>();
  for (const p of plans) {
    const existing = (await db.circuit.findFirst({ where: { sourceNote: { contains: tag(p.ref) } } })) ?? null;
    let slug = p.slug;
    if (!existing) for (let i = 2; await db.circuit.findUnique({ where: { slug } }); i++) slug = `${p.slug}-${i}`;
    const sourceNote = `${tag(p.ref)} Import Excel du ${new Date().toLocaleDateString("fr-FR")}`;
    const c = existing
      ? await db.circuit.update({ where: { id: existing.id }, data: { ...p.data, destinationId: p.destId, sourceNote } as never })
      : await db.circuit.create({ data: { ...p.data, slug, destinationId: p.destId, sourceNote, optionalActivities: { fr: [] } } as never });
    circuitIds.set(p.ref, c.id);
    console.log(`${existing ? "↻" : "+"} ${p.ref} → /circuits/${c.slug}`);
  }
  for (const [ref, id] of circuitIds) {
    const list = daysRows.filter((d) => str(d.ref).toUpperCase() === ref);
    if (!list.length) continue;
    await db.circuitDay.deleteMany({ where: { circuitId: id } });
    for (const d of list)
      await db.circuitDay.create({
        data: { circuitId: id, dayNumber: int(d.day)!, title: tri(d.title_fr, d.title_en, d.title_ar), description: { fr: [str(d.desc_fr), str(d.meals) && `Repas : ${str(d.meals)}`, str(d.night) && `Nuit : ${str(d.night)}`].filter(Boolean).join(" — ") }, items: { fr: list_(d.items_fr) } },
      });
  }
  for (const d of deps) {
    const id = circuitIds.get(str(d.ref).toUpperCase());
    if (!id || !(d.date instanceof Date) || d.date < new Date()) continue;
    const date = new Date(Date.UTC(d.date.getFullYear(), d.date.getMonth(), d.date.getDate()));
    const plan = plans.find((p) => p.ref === str(d.ref).toUpperCase())!;
    const status = norm(str(d.status)) === "ferme" ? "CLOSED" : "OPEN";
    const ex = await db.departure.findUnique({ where: { circuitId_date: { circuitId: id, date } } });
    if (ex) await db.departure.update({ where: { id: ex.id }, data: { capacity: Math.max(int(d.seats)!, ex.seatsHeld), status } });
    else await db.departure.create({ data: { circuitId: id, date, capacity: int(d.seats)!, status, isDemo: plan.data.priceStatus === "DEMO" } });
  }
  for (const o of opts) {
    const ref = str(o.ref).toUpperCase();
    if (isExample(ref)) continue;
    const circuitId = ref === "TOUS" ? null : (circuitIds.get(ref) ?? null);
    const data = { group: GROUP[norm(str(o.group))], label: tri(o.label_fr, o.label_en, o.label_ar), priceMad: int(o.price)!, unit: UNIT[norm(str(o.unit))], priceStatus: STATUS[norm(str(o.status))] ?? "DEMO" };
    const ex = await db.bookingOption.findFirst({ where: { code: str(o.code), circuitId } });
    if (ex) await db.bookingOption.update({ where: { id: ex.id }, data });
    else await db.bookingOption.create({ data: { ...data, code: str(o.code), circuitId, description: { fr: "" } } });
  }
  for (const { slug, r } of smPlans) {
    const row = await db.setting.findUnique({ where: { key: `composer:${slug}` } });
    const cur = row ? destConfigSchema.safeParse(JSON.parse(row.value)) : null;
    if (!cur?.success) {
      warn.push(`Sur mesure : pas de programme en base pour « ${slug} », ligne ignorée.`);
      continue;
    }
    const cfg = cur.data;
    // trois gammes : type d'hébergement, description et prix (le texte FR remplace le FR ; EN/AR conservés)
    for (const k of ["essentiel", "confort", "luxe"] as const) {
      const l = cfg.lodging.find((x) => x.key === k);
      if (!l) continue;
      if (int(r[`${k}_price`]) !== null) l.nightMad = int(r[`${k}_price`])!;
      if (str(r[`${k}_type`])) l.label = { ...l.label, fr: str(r[`${k}_type`]) };
      if (str(r[`${k}_desc`])) l.hint = { ...l.hint, fr: str(r[`${k}_desc`]) };
    }
    if (cfg.flight && int(r.flight) !== null) cfg.flight.baseMad = int(r.flight)!;
    if (cfg.flight && int(r.flightExtra) !== null) cfg.flight.extraNonCasaMad = int(r.flightExtra)!;
    if (int(r.min) && int(r.max) && int(r.def)) cfg.durations = { min: int(r.min)!, max: int(r.max)!, default: int(r.def)! };
    await db.setting.update({ where: { key: `composer:${slug}` }, data: { value: JSON.stringify(destConfigSchema.parse(cfg)) } });
  }
  console.log(`\n✔ Import terminé : ${plans.length} voyage(s), ${smPlans.length} destination(s) sur mesure.`);
}
const list_ = (v: unknown) => list(v);

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
