// Génère docs/HISTORIQUE-VOYAGES-BENANI.xlsx : saisie des voyages DÉJÀ RÉALISÉS (pour inviter ces voyageurs à laisser un avis vérifié)
// Usage : npm run make:historique
import { createRequire } from "node:module";
import path from "node:path";
import { BRAND, dataSheet, guideSheet, listsSheet } from "./xlsx-common.mjs";

const require = createRequire(import.meta.url);
const ExcelJS = require("exceljs");
const Database = require("better-sqlite3");
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const db = new Database(path.join(ROOT, "dev.db"), { readonly: true });
const destinations = db.prepare("select name from Destination order by sortOrder").all().map((d) => JSON.parse(d.name).fr);
const cities = JSON.parse(db.prepare("select value from Setting where key='composer:cities'").get()?.value ?? '{"cities":[]}').cities.map((c) => c.name.fr);
const circuits = db.prepare("select slug from Circuit where published=1 order by sortOrder").all().map((c) => c.slug);

const wb = new ExcelJS.Workbook();
wb.creator = "Benani Travel";
guideSheet(wb, "Benani Travel — historique des voyages réalisés", [
  { h: "À quoi sert ce fichier" },
  "Enregistrer les voyages que l'agence a DÉJÀ organisés, pour pouvoir inviter ces voyageurs à déposer un avis sur le site. Seuls de vrais voyageurs, invités par un lien personnel, peuvent écrire un avis : l'agence ne saisit jamais d'avis à leur place, et chaque avis reste soumis à votre validation (Administration → Avis) avant publication avec la mention « séjour vérifié ».",
  { h: "Comment remplir" },
  "1. Une ligne = un dossier (un groupe ou une famille), avec une référence interne unique (ex. H-2025-001).",
  "2. Colonnes * obligatoires. Dates au format JJ/MM/AAAA. La date de retour doit être passée.",
  "3. « Programme » : choisissez un programme du site dans la liste ou écrivez un intitulé libre (ex. « Omra Ramadan 2025 »).",
  "4. CONSENTEMENT : mettez « Oui » UNIQUEMENT si le client a accepté d'être contacté pour donner son avis, et indiquez la date et le moyen (oral, WhatsApp, e-mail, écrit). Sans « Oui », aucune invitation ne pourra être envoyée.",
  "5. Les lignes jaunes EX-… sont des exemples, ignorées à l'import.",
  { h: "Ce qui se passe à l'import" },
  "Chaque ligne devient un dossier « terminé » marqué « historique » : aucune place n'est bloquée sur les départs, aucun paiement n'est enregistré (le montant payé reste une information interne) et AUCUN e-mail n'est envoyé. Les invitations à donner un avis se font ensuite, à la main, depuis Administration → Avis (une invitation et au plus une relance par dossier).",
  { h: "Données personnelles (loi 09-08)" },
  { p: "Ce fichier contient des données personnelles : ne collectez que le nécessaire, conservez-le dans un endroit sûr, ne le partagez pas en dehors de l'agence et supprimez les copies inutiles. Chaque e-mail d'invitation contient un lien permettant au client de refuser toute nouvelle sollicitation. Les clients peuvent demander l'accès, la rectification ou la suppression de leurs données à tout moment.", fill: BRAND.goldLight },
  { h: "Renvoyer le fichier" },
  "Envoyez-le dans la conversation du projet : un contrôle (« dry-run ») est fait d'abord, avec la liste des erreurs ligne par ligne, puis l'import réel après sauvegarde de la base.",
]);

const mad = '#,##0" MAD"';
dataSheet(wb, "Voyages réalisés", [
  { key: "ref", header: "Réf. interne", required: true, width: 14, note: "Unique, ex. H-2025-001. EX-… = exemple ignoré." },
  { key: "type", header: "Type", required: true, list: "L_Type", width: 13 },
  { key: "dest", header: "Destination", required: true, list: "L_Dest", width: 24 },
  { key: "program", header: "Programme (liste ou texte libre)", list: "L_Prog", width: 34, note: "Un programme du site, ou un intitulé libre (la liste n'est qu'une aide : la saisie libre est acceptée)." },
  { key: "start", header: "Date de départ", required: true, date: true, width: 13 },
  { key: "end", header: "Date de retour", required: true, date: true, width: 13 },
  { key: "adults", header: "Adultes", required: true, int: [1, 200], width: 8 },
  { key: "children", header: "Enfants", int: [0, 200], width: 8 },
  { key: "last", header: "Nom du client principal", required: true, width: 18 },
  { key: "first", header: "Prénom", required: true, width: 16 },
  { key: "email", header: "E-mail", required: true, width: 28, note: "Indispensable pour l'invitation à donner un avis." },
  { key: "phone", header: "Téléphone / WhatsApp", width: 18 },
  { key: "lang", header: "Langue préférée", list: "L_Langue", width: 10 },
  { key: "paid", header: "Montant payé (MAD, facultatif)", int: [0, 10000000], numFmt: mad, width: 14, note: "Information interne : n'est pas enregistrée comme un paiement." },
  { key: "from", header: "Ville de départ", list: "L_Villes", width: 16 },
  { key: "notes", header: "Remarques internes", width: 30 },
  { key: "consent", header: "Le client accepte d'être contacté pour donner son avis", required: true, list: "L_OuiNon", width: 18, note: "Oui uniquement si le client l'a accepté. Sans Oui, aucune invitation possible." },
  { key: "consentDate", header: "Date du consentement", date: true, width: 13 },
  { key: "consentHow", header: "Moyen du consentement", list: "L_Moyen", width: 14 },
], {
  rows: [
    { ref: "EX-H-001", type: "National", dest: destinations[0] ?? "Merzouga", program: "escapade-saharienne-2j", start: new Date(Date.UTC(2025, 9, 18)), end: new Date(Date.UTC(2025, 9, 19)), adults: 2, children: 1, last: "EXEMPLE", first: "À remplacer", email: "client@example.com", phone: "+212 6 00 00 00 00", lang: "FR", paid: 3000, from: "Marrakech", notes: "Exemple", consent: "Oui", consentDate: new Date(Date.UTC(2025, 9, 19)), consentHow: "WhatsApp" },
  ],
  maxRows: 1000,
});
listsSheet(wb, {
  L_Type: ["National", "International", "Omra", "Hajj"],
  L_Dest: destinations,
  L_Prog: circuits,
  L_Villes: cities,
  L_Langue: ["FR", "EN", "AR"],
  L_OuiNon: ["Oui", "Non"],
  L_Moyen: ["Oral", "WhatsApp", "E-mail", "Écrit"],
});
// la liste « Programme » ne bloque pas la saisie libre
const ws = wb.getWorksheet("Voyages réalisés");
for (let r = 2; r <= 1000; r++) {
  const c = ws.getCell(r, 4);
  if (c.dataValidation) c.dataValidation = { ...c.dataValidation, showErrorMessage: false };
}
const out = path.join(ROOT, "docs", "HISTORIQUE-VOYAGES-BENANI.xlsx");
await wb.xlsx.writeFile(out);
console.log("✔", out);
