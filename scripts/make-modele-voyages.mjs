// Génère docs/MODELE-VOYAGES-BENANI.xlsx (modèle de saisie des voyages, calqué sur la base du site)
// Usage : node scripts/make-modele-voyages.mjs   — exemples tirés des programmes démo de dev.db
import { createRequire } from "node:module";
import path from "node:path";
import { BRAND, dataSheet, guideSheet, listsSheet } from "./xlsx-common.mjs";

const require = createRequire(import.meta.url);
const ExcelJS = require("exceljs");
const Database = require("better-sqlite3");
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const db = new Database(path.join(ROOT, "dev.db"), { readonly: true });
const J = (v, l = "fr") => { try { const o = JSON.parse(v ?? "null"); return Array.isArray(o?.[l]) ? o[l].join(" ; ") : (o?.[l] ?? ""); } catch { return ""; } };

// ── listes autorisées
const destinations = db.prepare("select slug, name, scope from Destination order by sortOrder").all().map((d) => ({ ...d, fr: JSON.parse(d.name).fr }));
const citiesCfg = JSON.parse(db.prepare("select value from Setting where key='composer:cities'").get()?.value ?? '{"cities":[]}');
export const LISTS = {
  L_DestMaroc: destinations.filter((d) => d.scope !== "INTERNATIONAL").map((d) => d.fr),
  L_DestMonde: destinations.filter((d) => d.scope === "INTERNATIONAL" && !d.slug.startsWith("omra")).map((d) => d.fr),
  L_DestTous: destinations.map((d) => d.fr),
  L_Villes: citiesCfg.cities.map((c) => c.name.fr),
  L_OuiNon: ["Oui", "Non"],
  L_TypeVoyage: ["Circuit", "Séjour", "Croisière"],
  L_TypeOmra: ["Omra", "Hajj"],
  L_StatutPrix: ["Démo", "Indicatif", "Validé", "Sur demande"],
  L_ModePrix: ["Par personne", "Par groupe"],
  L_Repas: ["Petit-déjeuner", "Demi-pension", "Pension complète", "Selon programme", "Aucun"],
  L_StatutDepart: ["Ouvert", "Fermé"],
  L_GroupeOption: ["Hébergement", "Activité", "Repas", "Transfert", "Service"],
  L_UniteOption: ["Par personne", "Par réservation", "Par personne et par nuit"],
  L_Vol: ["Direct", "Avec escale"],
  L_Arrivee: ["Djeddah", "Médine"],
};

const statutFr = { DEMO: "Démo", INDICATIVE: "Indicatif", VALIDATED: "Validé", ON_REQUEST: "Sur demande" };
const typeFr = { CIRCUIT: "Circuit", SEJOUR: "Séjour", CROISIERE: "Croisière", OMRA: "Omra" };
const destName = (id) => JSON.parse(db.prepare("select name from Destination where id=?").get(id).name).fr;

// ── colonnes communes à un voyage (une ligne = un voyage, référence unique)
const tripCols = (dests, typeList, refHelp) => [
  { key: "ref", header: "Référence", required: true, width: 13, note: `${refHelp} Unique ; relie ce voyage aux onglets Programme, Départs, Grille et Options. Une référence commençant par EX- est un exemple ignoré à l'import.` },
  { key: "publish", header: "Publier", list: "L_OuiNon", width: 9, note: "Oui = visible sur le site après import. Non = brouillon." },
  { key: "dest", header: "Destination", required: true, list: dests, width: 22 },
  { key: "type", header: "Type", list: typeList, width: 12 },
  { key: "title_fr", header: "Titre FR", required: true, width: 38, wrap: true },
  { key: "title_en", header: "Titre EN", width: 30, note: "Facultatif : laisser vide = l'agence ou Claude traduit." },
  { key: "title_ar", header: "Titre AR", width: 30, note: "Facultatif : laisser vide = traduction faite ensuite." },
  { key: "summary_fr", header: "Résumé FR", required: true, width: 50, wrap: true, note: "2 à 3 phrases affichées sur la carte et en tête de fiche." },
  { key: "summary_en", header: "Résumé EN", width: 30 },
  { key: "summary_ar", header: "Résumé AR", width: 30 },
];
const priceCols = [
  { key: "transport", header: "Transport (FR)", width: 26, wrap: true },
  { key: "accommodation", header: "Hébergement (FR)", width: 30, wrap: true, note: "Catégorie et type, ex. « Hôtel 4★ à Marrakech, bivouac à Merzouga »." },
  { key: "meals", header: "Repas", list: "L_Repas", width: 16 },
  { key: "included", header: "Inclus (FR, séparés par ;)", width: 40, wrap: true },
  { key: "excluded", header: "Non inclus (FR, séparés par ;)", width: 34, wrap: true },
  { key: "price", header: "Prix adulte (MAD)", numFmt: '#,##0" MAD"', int: [0, 1000000], width: 15, note: "Prix « à partir de » par personne (ou par groupe selon la colonne suivante). Vide = sur demande." },
  { key: "mode", header: "Mode de prix", list: "L_ModePrix", width: 14 },
  { key: "status", header: "Statut du prix", list: "L_StatutPrix", required: true, width: 13, note: "Démo = exemple non contractuel ; Indicatif = prix publié à confirmer ; Validé = prix ferme ; Sur demande = pas de prix affiché." },
  { key: "child", header: "% prix enfant (4-11 ans)", int: [0, 100], width: 12 },
  { key: "childFree", header: "Gratuit moins de (ans)", int: [0, 18], width: 11 },
  { key: "private", header: "Supplément privé (MAD/pers.)", int: [0, 100000], numFmt: '#,##0" MAD"', width: 14 },
  { key: "deposit", header: "Acompte %", int: [0, 100], width: 10 },
  { key: "capacity", header: "Places par départ", int: [1, 500], width: 10 },
  { key: "cancel", header: "Conditions d'annulation (FR)", width: 36, wrap: true },
  { key: "warnings", header: "Avertissements (FR, séparés par ;)", width: 30, wrap: true },
  { key: "slug", header: "Identifiant web (facultatif)", width: 26, note: "Adresse de la fiche, ex. « marrakech-3-jours ». Vide = créé à partir du titre." },
];
// durée : nuits d'hôtel saisies, jours calculés (nuits + 1, + 1 journée de trajet)
const durationCols = (startIdx) => {
  const L = (i) => String.fromCharCode(65 + i);
  const n = L(startIdx), tdy = L(startIdx + 1);
  return [
    { key: "nights", header: "Nuits d'hôtel", required: true, int: [1, 60], width: 10, note: "Unité de durée : nombre de nuits à l'hôtel." },
    { key: "travelDay", header: "Journée de trajet", list: "L_OuiNon", width: 10, note: "Oui pour les longues distances (trajet de nuit ou arrivée tardive, sans nuit d'hôtel)." },
    { key: "days", header: "Jours (calculé)", width: 10, formula: (r) => `IF(${n}${r}="","",${n}${r}+1+IF(${tdy}${r}="Oui",1,0))`, note: "Calcul automatique : nuits + 1, + 1 si journée de trajet. Ne pas saisir." },
    { key: "from", header: "Ville de départ", required: true, list: "L_Villes", width: 16 },
    { key: "to", header: "Ville d'arrivée", required: true, list: "L_Villes", width: 16 },
  ];
};

// ── exemples tirés de la base (marqués EX-)
const circuitRow = (slug, ref) => {
  const c = db.prepare("select * from Circuit where slug=?").get(slug);
  if (!c) return null;
  return {
    ref, publish: "Non", dest: destName(c.destinationId), type: typeFr[c.programType] ?? "Circuit",
    title_fr: `EXEMPLE – à remplacer : ${J(c.title)}`, title_en: J(c.title, "en"), title_ar: J(c.title, "ar"),
    summary_fr: J(c.summary), summary_en: J(c.summary, "en"), summary_ar: J(c.summary, "ar"),
    nights: c.nights, travelDay: c.days > c.nights + 1 ? "Oui" : "Non", from: c.startPoint, to: c.endPoint,
    transport: J(c.transport), accommodation: J(c.accommodation), meals: "Selon programme", included: J(c.included), excluded: J(c.excluded),
    price: c.priceAdultMad, mode: c.pricingMode === "PER_GROUP" ? "Par groupe" : "Par personne", status: statutFr[c.priceStatus] ?? "Démo",
    child: c.childPricePercent, childFree: c.childFreeUnderAge, private: c.privateSupplementMad, deposit: c.depositPercent, capacity: c.defaultCapacity,
    cancel: J(c.cancellationPolicy), warnings: J(c.warnings), slug: "",
    _id: c.id,
  };
};
const ex = {
  nat: [circuitRow("escapade-saharienne-2j", "EX-NAT-001"), circuitRow("marrakech-ville-imperiale-2j", "EX-NAT-002")].filter(Boolean),
  int: [circuitRow("istanbul-8-jours-air-arabia", "EX-INT-001")].filter(Boolean),
  omr: [circuitRow("omra-ramadan-2027", "EX-OMR-001")].filter(Boolean),
};

const wb = new ExcelJS.Workbook();
wb.creator = "Benani Travel";
wb.created = new Date();

guideSheet(wb, "Benani Travel — modèle de saisie des voyages", [
  { h: "À quoi sert ce fichier" },
  "Saisir les voyages à programmer sur le site (Maroc, international, Omra et Hajj), leurs programmes jour par jour, leurs dates de départ, leurs options et les tarifs du configurateur « sur mesure ». Une fois rempli, renvoyez-le : il est importé automatiquement (contrôle ligne par ligne, puis création ou mise à jour des voyages).",
  { h: "Règles simples" },
  "1. Une ligne = un voyage, identifié par une RÉFÉRENCE unique : NAT-001, NAT-002… (Maroc), INT-001… (international), OMR-001… (Omra et Hajj). La même référence relie les onglets « Programme jour par jour », « Départs & places », « Grille hôtels × chambres » et « Options & suppléments ».",
  "2. Les colonnes marquées * (titre doré) sont obligatoires. Les cellules vertes sont calculées automatiquement : ne les remplissez pas.",
  "3. La durée se saisit en NUITS D'HÔTEL. Les jours sont calculés : nuits + 1, + 1 « journée de trajet » pour les longues distances (trajet de nuit ou arrivée tardive, sans nuit d'hôtel). Exemple : affiche « Nouvel An Marrakech–Imlil » = 2 nuits (1 auberge à Imlil + 1 hôtel), trajet court → 3 jours.",
  "4. Utilisez les listes déroulantes (destination, ville, statut du prix, repas…). Les dates au format JJ/MM/AAAA, les prix en dirhams sans espace ni « MAD ».",
  "5. Textes : remplissez au moins le français. Les colonnes EN et AR sont facultatives : laissées vides, elles seront traduites ensuite.",
  "6. Statut du prix : « Démo » = exemple non contractuel (affiché « Tarifs démo ») ; « Indicatif » = prix publié à confirmer ; « Validé » = prix ferme ; « Sur demande » = aucun prix affiché.",
  "7. Les lignes surlignées en jaune (références EX-…) sont des EXEMPLES tirés du site : remplacez-les ou laissez-les, elles sont ignorées à l'import.",
  { h: "Omra et Hajj" },
  "Onglet « Omra & Hajj » : une ligne par programme (compagnie, vol, nuits à Médine et à La Mecque…). Les prix par hôtel et par type de chambre (double, triple, quadruple, quintuple, sextuple) se saisissent dans « Grille hôtels × chambres » : une ligne par hôtel (ou formule), avec la distance au Haram. Le prix « à partir de » est calculé automatiquement à partir de la grille si vous le laissez vide.",
  { h: "Configurateur « sur mesure »" },
  "Onglet « Sur mesure – tarifs » : une ligne par destination, avec les nuits d'hôtel minimum / maximum / proposées par défaut, le prix par nuit et par personne des trois niveaux d'hébergement (Essentiel, Confort, Prestige) et, pour l'international, le prix du vol. Les valeurs pré-remplies sont les tarifs DÉMO actuels.",
  { h: "Renvoyer le fichier" },
  "Enregistrez le fichier (sans changer le nom des onglets ni des colonnes) et envoyez-le dans la conversation du projet. Un import d'essai (« dry-run ») est d'abord lancé : vous recevez la liste des erreurs éventuelles, ligne par ligne, avant toute modification du site. Une sauvegarde de la base est faite automatiquement avant l'import réel.",
  { p: "Données personnelles : ce fichier ne contient aucune donnée client.", fill: BRAND.ivory },
]);

const NAT = [...tripCols("L_DestMaroc", "L_TypeVoyage", "Format NAT-001."), ...durationCols(10), ...priceCols];
dataSheet(wb, "Voyages nationaux", NAT, { rows: ex.nat });
const INT = [...tripCols("L_DestMonde", "L_TypeVoyage", "Format INT-001."), ...durationCols(10), ...priceCols, { key: "airline", header: "Compagnie aérienne", width: 18 }, { key: "flight", header: "Vol", list: "L_Vol", width: 12 }];
dataSheet(wb, "Voyages internationaux", INT, { rows: ex.int, tabColor: BRAND.emerald });

// Omra : nuits à Médine et à La Mecque, total calculé
const OMR_BASE = tripCols("L_DestTous", "L_TypeOmra", "Format OMR-001.");
const L = (i) => String.fromCharCode(65 + i);
const iMed = OMR_BASE.length, iMak = iMed + 1, iTot = iMed + 2, iTrav = iMed + 3;
const OMR = [
  ...OMR_BASE,
  { key: "nMed", header: "Nuits à Médine", int: [0, 40], width: 10 },
  { key: "nMak", header: "Nuits à La Mecque", int: [0, 40], width: 10 },
  { key: "nights", header: "Nuits d'hôtel (calculé)", width: 11, formula: (r) => `IF(AND(${L(iMed)}${r}="",${L(iMak)}${r}=""),"",N(${L(iMed)}${r})+N(${L(iMak)}${r}))` },
  { key: "travelDay", header: "Journée de trajet", list: "L_OuiNon", width: 10, note: "Oui si un jour de voyage s'ajoute sans nuit d'hôtel (vol de nuit, escale longue)." },
  { key: "days", header: "Jours (calculé)", width: 10, formula: (r) => `IF(${L(iTot)}${r}="","",${L(iTot)}${r}+1+IF(${L(iTrav)}${r}="Oui",1,0))` },
  { key: "from", header: "Ville de départ", required: true, list: "L_Villes", width: 16 },
  { key: "arrival", header: "Aéroport d'arrivée", list: "L_Arrivee", width: 12 },
  { key: "airline", header: "Compagnie aérienne", width: 18 },
  { key: "flight", header: "Vol", list: "L_Vol", width: 12 },
  { key: "guide", header: "Encadrement religieux", list: "L_OuiNon", width: 11 },
  { key: "visa", header: "Visa inclus", list: "L_OuiNon", width: 9 },
  ...priceCols.filter((c) => !["mode"].includes(c.key)),
];
const omrRows = ex.omr.map((r) => ({ ...r, type: "Omra", nMed: 4, nMak: r.nights - 4, arrival: "Médine", airline: "", flight: "Avec escale", guide: "Oui", visa: "Oui" }));
dataSheet(wb, "Omra & Hajj", OMR, { rows: omrRows, tabColor: BRAND.emerald });

// grille hôtel × chambre (Omra et international)
const gridRows = [];
for (const r of [...ex.omr, ...ex.int]) {
  const g = JSON.parse(db.prepare("select priceGrid from Circuit where id=?").get(r._id).priceGrid ?? "null");
  for (const row of g?.rows ?? []) gridRows.push({ ref: r.ref, hotel: row.label.fr, detail: row.detail?.fr ?? "", d2: row.prices.d2 ?? null, t3: row.prices.t3 ?? null, q4: row.prices.q4 ?? null, q5: row.prices.q5 ?? null, s6: row.prices.s6 ?? null });
}
const mad = '#,##0" MAD"';
dataSheet(wb, "Grille hôtels × chambres", [
  { key: "ref", header: "Référence du voyage", required: true, width: 14 },
  { key: "hotel", header: "Hôtel ou formule", required: true, width: 30, note: "Nom de l'hôtel (ou de la formule) tel qu'il apparaît sur l'affiche." },
  { key: "detail", header: "Ville et distance au Haram (ou détail)", width: 34, note: "Ex. « La Mecque, à 700 m » ou « Médine, zone centrale »." },
  { key: "d2", header: "Double (MAD/pers.)", numFmt: mad, int: [0, 1000000], width: 14 },
  { key: "t3", header: "Triple (MAD/pers.)", numFmt: mad, int: [0, 1000000], width: 14 },
  { key: "q4", header: "Quadruple (MAD/pers.)", numFmt: mad, int: [0, 1000000], width: 14 },
  { key: "q5", header: "Quintuple (MAD/pers.)", numFmt: mad, int: [0, 1000000], width: 14 },
  { key: "s6", header: "Sextuple (MAD/pers.)", numFmt: mad, int: [0, 1000000], width: 14 },
], { rows: gridRows, tabColor: BRAND.emerald });

// programme jour par jour
const dayRows = [];
for (const r of [...ex.nat.slice(0, 1), ...ex.omr]) {
  for (const d of db.prepare("select * from CircuitDay where circuitId=? order by dayNumber").all(r._id)) {
    dayRows.push({ ref: r.ref, day: d.dayNumber, title_fr: J(d.title), title_en: J(d.title, "en"), title_ar: J(d.title, "ar"), desc_fr: J(d.description), items_fr: J(d.items), meals: "", night: "" });
  }
}
dataSheet(wb, "Programme jour par jour", [
  { key: "ref", header: "Référence du voyage", required: true, width: 14 },
  { key: "day", header: "N° du jour", required: true, int: [1, 60], width: 8 },
  { key: "title_fr", header: "Titre du jour FR", required: true, width: 34 },
  { key: "title_en", header: "Titre EN", width: 24 },
  { key: "title_ar", header: "Titre AR", width: 24 },
  { key: "desc_fr", header: "Description FR", width: 60, wrap: true },
  { key: "items_fr", header: "Étapes / visites FR (séparées par ;)", width: 50, wrap: true },
  { key: "meals", header: "Repas du jour", list: "L_Repas", width: 16 },
  { key: "night", header: "Nuit à (lieu, type d'hébergement)", width: 30, note: "Ex. « Merzouga, bivouac ». Vide pour le dernier jour ou une journée de trajet." },
], { rows: dayRows });

// départs
const depRows = [];
for (const r of [...ex.nat, ...ex.omr]) for (const d of db.prepare("select date, capacity, status from Departure where circuitId=? and date > ? order by date limit 2").all(r._id, Date.now())) depRows.push({ ref: r.ref, date: new Date(d.date), seats: d.capacity, status: d.status === "OPEN" ? "Ouvert" : "Fermé" });
dataSheet(wb, "Départs & places", [
  { key: "ref", header: "Référence du voyage", required: true, width: 14 },
  { key: "date", header: "Date de départ", required: true, date: true, width: 14 },
  { key: "seats", header: "Places", required: true, int: [1, 500], width: 9 },
  { key: "status", header: "Statut", list: "L_StatutDepart", width: 10 },
], { rows: depRows });

// options
const optRows = db.prepare("select code, \"group\", label, priceMad, unit, priceStatus from BookingOption where circuitId is null order by sortOrder limit 3").all().map((o) => ({
  ref: "TOUS", code: o.code, group: { HEBERGEMENT: "Hébergement", ACTIVITE: "Activité", REPAS: "Repas", TRANSFERT: "Transfert", SERVICE: "Service" }[o.group] ?? "Service",
  label_fr: J(o.label), label_en: J(o.label, "en"), label_ar: J(o.label, "ar"), price: o.priceMad, unit: { PER_PERSON: "Par personne", PER_BOOKING: "Par réservation", PER_PERSON_NIGHT: "Par personne et par nuit" }[o.unit], status: statutFr[o.priceStatus] ?? "Démo",
}));
dataSheet(wb, "Options & suppléments", [
  { key: "ref", header: "Référence du voyage (ou TOUS)", required: true, width: 16, note: "TOUS = option proposée sur tous les voyages." },
  { key: "code", header: "Code court", required: true, width: 16, note: "Minuscules et tirets, ex. « chambre-single »." },
  { key: "group", header: "Groupe", list: "L_GroupeOption", required: true, width: 14 },
  { key: "label_fr", header: "Libellé FR", required: true, width: 30 },
  { key: "label_en", header: "Libellé EN", width: 22 },
  { key: "label_ar", header: "Libellé AR", width: 22 },
  { key: "price", header: "Prix (MAD)", required: true, int: [0, 1000000], numFmt: mad, width: 12 },
  { key: "unit", header: "Unité", list: "L_UniteOption", required: true, width: 22 },
  { key: "status", header: "Statut du prix", list: "L_StatutPrix", width: 13 },
], { rows: optRows });

// configurateur sur mesure : une ligne par destination (valeurs DÉMO actuelles)
const smRows = destinations.map((d) => {
  const v = db.prepare("select value from Setting where key=?").get(`composer:${d.slug}`);
  if (!v) return null;
  const c = JSON.parse(v.value);
  const lp = (k) => c.lodging.find((l) => l.key === k)?.nightMad ?? null;
  return { dest: d.fr, min: c.durations.min, max: c.durations.max, def: c.durations.default, ess: lp("essentiel"), conf: lp("confort"), prest: lp("prestige"), flight: c.flight?.baseMad ?? null, flightExtra: c.flight?.extraNonCasaMad ?? null, status: "Démo", note: "" };
}).filter(Boolean);
dataSheet(wb, "Sur mesure – tarifs", [
  { key: "dest", header: "Destination", required: true, list: "L_DestTous", width: 24 },
  { key: "min", header: "Nuits min", int: [1, 14], width: 8 },
  { key: "max", header: "Nuits max", int: [1, 14], width: 8 },
  { key: "def", header: "Nuits proposées", int: [1, 14], width: 9 },
  { key: "ess", header: "Essentiel (MAD/nuit/pers.)", numFmt: mad, int: [0, 100000], width: 14 },
  { key: "conf", header: "Confort (MAD/nuit/pers.)", numFmt: mad, int: [0, 100000], width: 14 },
  { key: "prest", header: "Prestige (MAD/nuit/pers.)", numFmt: mad, int: [0, 100000], width: 14 },
  { key: "flight", header: "Vol A/R depuis Casablanca (MAD/pers.)", numFmt: mad, int: [0, 1000000], width: 16, note: "International uniquement." },
  { key: "flightExtra", header: "Supplément autres aéroports (MAD/pers.)", numFmt: mad, int: [0, 1000000], width: 16 },
  { key: "status", header: "Statut", list: "L_StatutPrix", width: 11, note: "Tant que « Démo », le badge « Tarifs démo » reste affiché." },
  { key: "note", header: "Remarques", width: 30 },
], { rows: smRows, maxRows: 60 });

listsSheet(wb, LISTS);
const out = path.join(ROOT, "docs", "MODELE-VOYAGES-BENANI.xlsx");
await wb.xlsx.writeFile(out);
console.log("✔", out, "—", ex.nat.length + ex.int.length + ex.omr.length, "voyages d'exemple,", dayRows.length, "jours,", gridRows.length, "lignes de grille,", smRows.length, "destinations sur mesure");
