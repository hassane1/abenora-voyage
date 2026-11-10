/**
 * Programmes de l'agence (voyages nationaux et internationaux).
 *
 * 1) PUBLIÉS — repris des affiches transmises par l'utilisateur le 10/11/2026 (programmes Omra, Omra combinée,
 *    croisière) et des 2 offres Instagram de Benani Travel. Prix, dates, hôtels et prestations recopiés tels
 *    quels ; statut INDICATIVE (« tarif publié, à confirmer »). Le déroulé jour par jour est résumé à partir
 *    des étapes indiquées. Les places par départ ne sont pas publiées : valeur indicative.
 *    ⚠ Les affiches portent la marque « Almiaraj Voyages » (El Jadida, licence ODV-6003) et le numéro 06 66 89 32 62
 *    également utilisé par Benani Travel : à confirmer par l'agence avant publication commerciale.
 * 2) EXEMPLES — programmes SIMULÉS à la demande de l'utilisateur (destinations marocaines et étrangères) :
 *    statut DEMO, prix et dates fictifs, signalés comme tels sur le site.
 */
type L = { fr: string; en: string; ar?: string };
const l = (fr: string, en: string, ar?: string): L => ({ fr, en, ...(ar ? { ar } : {}) });

export type ProgDestination = { slug: string; name: L; tagline: L; description: L; region: string; scope: "NATIONAL" | "INTERNATIONAL"; country: string; lat: number; lng: number; sortOrder: number };
export type GridCol = { key: string; label: L };
export type Grid = { columns: GridCol[]; rows: { label: L; detail?: L; prices: Record<string, number | null> }[] };
export type ProgStop = { name: string; lat: number; lng: number; day: number; mode: "DRIVE" | "FLIGHT" | "SEA" | "WALK" | null };
export type Programme = {
  slug: string;
  destination: string;
  type: "CIRCUIT" | "OMRA" | "CROISIERE" | "SEJOUR";
  status: "INDICATIVE" | "DEMO";
  title: L;
  summary: L;
  days: number;
  nights: number;
  start: string;
  end: string;
  priceFrom: number;
  grid?: Grid;
  deposit: number;
  transport: L;
  accommodation: L;
  meals: L;
  included: string[];
  excluded: string[];
  warnings?: string[];
  cancellation: L;
  itinerary: { title: string; description: string }[];
  stops: ProgStop[];
  departures: { dates?: string[]; weekly?: { weekday: number; weeks: number } };
  capacity: number;
  options?: { code: string; label: L; price: number }[];
  source: string;
};

// ───────────────────────────── destinations ─────────────────────────────
export const progDestinations: ProgDestination[] = [
  {
    slug: "omra-la-mecque-medine", scope: "INTERNATIONAL", country: "Arabie saoudite", region: "Hijaz", lat: 21.4225, lng: 39.8262, sortOrder: 20,
    name: l("Omra — La Mecque et Médine", "Umrah — Makkah and Madinah", "العمرة — مكة المكرمة والمدينة المنورة"),
    tagline: l("Votre Omra organisée, du vol au retour", "Your organised Umrah, from flight to return", "عمرتك منظمة من الطيران إلى العودة"),
    description: l(
      "Programmes Omra accompagnés : vols, visa, hôtels proches du Haram à La Mecque et Médine, transferts, visites et encadrement religieux. Plusieurs formules et dates, avec ou sans étape en Turquie, à Dubaï, en Égypte ou en Malaisie.",
      "Accompanied Umrah programmes: flights, visa, hotels near the Haram in Makkah and Madinah, transfers, visits and religious guidance. Several formulas and dates, with or without a stop in Turkey, Dubai, Egypt or Malaysia.",
    ),
  },
  {
    slug: "turquie-istanbul", scope: "INTERNATIONAL", country: "Turquie", region: "Istanbul", lat: 41.0082, lng: 28.9784, sortOrder: 21,
    name: l("Turquie — Istanbul", "Turkey — Istanbul", "تركيا — إسطنبول"),
    tagline: l("Entre Europe et Asie, au fil du Bosphore", "Between Europe and Asia, along the Bosphorus", "بين أوروبا وآسيا على ضفاف البوسفور"),
    description: l("Istanbul, ses mosquées, ses bazars et le Bosphore ; croisières en Méditerranée au départ d'Istanbul.", "Istanbul, its mosques, bazaars and the Bosphorus; Mediterranean cruises from Istanbul."),
  },
  {
    slug: "emirats-dubai", scope: "INTERNATIONAL", country: "Émirats arabes unis", region: "Dubaï", lat: 25.2048, lng: 55.2708, sortOrder: 22,
    name: l("Émirats — Dubaï", "UAE — Dubai", "الإمارات — دبي"),
    tagline: l("Gratte-ciel, désert et bord de mer", "Skyscrapers, desert and seaside", "ناطحات السحاب والصحراء والبحر"),
    description: l("Dubaï entre architecture spectaculaire, souks, plages et désert.", "Dubai: spectacular architecture, souks, beaches and desert."),
  },
  {
    slug: "egypte", scope: "INTERNATIONAL", country: "Égypte", region: "Le Caire et la vallée du Nil", lat: 30.0444, lng: 31.2357, sortOrder: 23,
    name: l("Égypte — Le Caire et le Nil", "Egypt — Cairo and the Nile", "مصر — القاهرة والنيل"),
    tagline: l("Pyramides, temples et croisière sur le Nil", "Pyramids, temples and a Nile cruise", "الأهرامات والمعابد ورحلة في النيل"),
    description: l("Le Caire, Gizeh, Louxor et Assouan.", "Cairo, Giza, Luxor and Aswan."),
  },
  {
    slug: "malaisie", scope: "INTERNATIONAL", country: "Malaisie", region: "Kuala Lumpur", lat: 3.139, lng: 101.6869, sortOrder: 24,
    name: l("Malaisie — Kuala Lumpur", "Malaysia — Kuala Lumpur", "ماليزيا — كوالالمبور"),
    tagline: l("Tours Petronas, jungle et îles", "Petronas Towers, jungle and islands", "أبراج بتروناس والغابات والجزر"),
    description: l("Kuala Lumpur et ses environs, en étape d'un programme Omra.", "Kuala Lumpur and surroundings, as a stop on an Umrah programme."),
  },
  {
    slug: "espagne-andalousie", scope: "INTERNATIONAL", country: "Espagne", region: "Andalousie", lat: 37.3891, lng: -5.9845, sortOrder: 25,
    name: l("Espagne — Andalousie", "Spain — Andalusia", "إسبانيا — الأندلس"),
    tagline: l("Séville, Cordoue, Grenade", "Seville, Cordoba, Granada", "إشبيلية وقرطبة وغرناطة"),
    description: l("Sur les traces d'Al-Andalus : l'Alhambra, la mosquée-cathédrale de Cordoue, l'Alcazar de Séville.", "In the footsteps of Al-Andalus: the Alhambra, Cordoba's mosque-cathedral, Seville's Alcazar."),
  },
];

/** destinations marocaines déjà présentes (« bientôt ») publiées avec un programme d'exemple */
export const publishNational = ["marrakech", "fes", "chefchaouen", "essaouira", "agadir", "dakhla", "ouzoud", "atlas", "ifrane-azrou"];

// ───────────────────────────── grilles ─────────────────────────────
const C = {
  s6: { key: "s6", label: l("Sextuple", "Sextuple", "سداسي") },
  q5: { key: "q5", label: l("Quintuple", "Quintuple", "خماسي") },
  q4: { key: "q4", label: l("Quadruple", "Quadruple", "رباعي") },
  t3: { key: "t3", label: l("Triple", "Triple", "ثلاثي") },
  d2: { key: "d2", label: l("Double", "Double", "ثنائي") },
};
const row = (fr: string, en: string, prices: Record<string, number | null>, detail?: L) => ({ label: l(fr, en), detail, prices });
const det = (fr: string, en: string) => l(fr, en);

const omraIncl = ["Billets d'avion aller-retour", "Visa Omra", "Hébergement dans les hôtels indiqués", "Transferts en Arabie saoudite", "Visites à La Mecque et Médine", "Encadrement religieux et accompagnement de l'agence"];
const omraExcl = ["Dépenses personnelles", "Repas non mentionnés", "Assurance voyage (recommandée)"];
const omraCancel = l(
  "Conditions d'annulation et de paiement précisées par l'agence à la réservation (acompte, date limite de paiement du solde, frais en cas d'annulation après émission du billet et du visa).",
  "Cancellation and payment terms specified by the agency when booking (deposit, balance deadline, fees if cancelled after ticket and visa issue).",
);
const MECCA = { name: "La Mecque", lat: 21.4225, lng: 39.8262 };
const MEDINA = { name: "Médine", lat: 24.4672, lng: 39.6111 };
const CASA = { name: "Casablanca", lat: 33.5731, lng: -7.5898 };
const JEDDAH = { name: "Djeddah", lat: 21.5433, lng: 39.1728 };
const stop = (p: { name: string; lat: number; lng: number }, day: number, mode: ProgStop["mode"]): ProgStop => ({ ...p, day, mode });
const omraStops = (medinaFirst = true): ProgStop[] =>
  medinaFirst
    ? [stop(CASA, 1, "FLIGHT"), stop(MEDINA, 1, "DRIVE"), stop(MECCA, 5, "FLIGHT"), stop(CASA, 99, null)]
    : [stop(CASA, 1, "FLIGHT"), stop(JEDDAH, 1, "DRIVE"), stop(MECCA, 1, "DRIVE"), stop(MEDINA, 9, "FLIGHT"), stop(CASA, 99, null)];
const omraDays = (medina: number, mecca: number, extra?: { place: string; nights: number }) => {
  const d: { title: string; description: string }[] = [];
  if (extra) d.push({ title: `${extra.place} (${extra.nights} nuits)`, description: `Vol depuis le Maroc, séjour de ${extra.nights} nuits à ${extra.place} selon le programme de l'agence.` });
  d.push({ title: `Médine (${medina} nuits)`, description: "Arrivée, installation à l'hôtel près du Haram, prière à la mosquée du Prophète, visites des lieux saints de Médine." });
  d.push({ title: "Transfert vers La Mecque et Omra", description: "Transfert vers La Mecque, accomplissement de l'Omra avec l'encadrement religieux de l'agence." });
  d.push({ title: `La Mecque (${mecca} nuits)`, description: "Séjour à l'hôtel indiqué, prières au Haram, visites des lieux saints." });
  d.push({ title: "Retour", description: "Transfert à l'aéroport et vol retour vers le Maroc." });
  return d;
};

// ───────────────────────────── programmes publiés (affiches) ─────────────────────────────
const SRC_ALMIARAJ = "Affiche transmise le 10/11/2026 (marque Almiaraj Voyages, tél. 06 61 60 69 10 / 06 66 89 32 62) — à confirmer";

export const published: Programme[] = [
  {
    slug: "omra-oct-dec-2026-vol-direct", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra octobre – décembre 2026, vol direct Casablanca – Djeddah", "Umrah October – December 2026, direct flight Casablanca – Jeddah", "عمرة أكتوبر – دجنبر 2026، رحلة مباشرة من الدار البيضاء إلى جدة"),
    summary: l("15 jours : 4 nuits à Médine et 10 nuits à La Mecque, hôtels proches du Haram, 5 dates de départ. À partir de 12 000 MAD par personne.", "15 days: 4 nights in Madinah and 10 in Makkah, hotels near the Haram, 5 departure dates. From 12,000 MAD per person."),
    days: 15, nights: 14, start: "Casablanca", end: "Casablanca", priceFrom: 12000, deposit: 30,
    grid: {
      columns: [C.q5, C.q4, C.t3, C.d2],
      rows: [
        row("Multazam Al Hayat – Jarwal", "Multazam Al Hayat – Jarwal", { q5: 12000, q4: 13500, t3: 14500, d2: 16000 }, det("La Mecque, à 900 m · Médine : zone du Haram", "Makkah, 900 m · Madinah: Haram area")),
        row("Iskan Taysir", "Iskan Taysir", { q5: 15000, q4: 16500, t3: 18000, d2: 19000 }, det("La Mecque, à 850 m · Médine : zone du Haram", "Makkah, 850 m · Madinah: Haram area")),
        row("Amjad Al Diyafa", "Amjad Al Diyafa", { q5: null, q4: 19000, t3: 20000, d2: 21000 }, det("La Mecque, à 700 m · Médine : zone du Haram", "Makkah, 700 m · Madinah: Haram area")),
        row("Taj Park", "Taj Park", { q5: null, q4: 20000, t3: 21000, d2: 22000 }, det("La Mecque, à 600 m · Médine : zone du Haram", "Makkah, 600 m · Madinah: Haram area")),
      ],
    },
    transport: l("Vol direct Casablanca – Djeddah, transferts en Arabie saoudite", "Direct flight Casablanca – Jeddah, transfers in Saudi Arabia"),
    accommodation: l("Médine 4 nuits (zone du Haram), La Mecque 10 nuits (hôtel au choix). Hôtels 5 étoiles sur demande.", "Madinah 4 nights (Haram area), Makkah 10 nights (hotel of your choice). 5-star hotels on request."),
    meals: l("Repas quotidien assuré par l'agence", "Daily meal provided by the agency"),
    included: ["Billet d'avion sur vol direct", "Visa", "Hébergement dans les hôtels mentionnés", "Transferts en Arabie saoudite", "Accompagnement touristique et guide religieux", "Repas quotidien et assistance de l'agence", "Visite de la Rawdah selon possibilité"],
    excluded: omraExcl, cancellation: omraCancel, itinerary: omraDays(4, 10), stops: omraStops(),
    departures: { dates: ["2026-10-27", "2026-11-10", "2026-11-24", "2026-12-08", "2026-12-22"] }, capacity: 45, source: SRC_ALMIARAJ,
  },
  {
    slug: "omra-janvier-2027-vol-direct", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra janvier 2027, vol direct Casablanca – Djeddah", "Umrah January 2027, direct flight Casablanca – Jeddah", "برنامج العمرة يناير 2027، رحلة مباشرة من الدار البيضاء إلى جدة"),
    summary: l("2 départs en janvier 2027 : 4 nuits à Médine, 8 nuits à La Mecque. À partir de 12 500 MAD par personne.", "2 departures in January 2027: 4 nights in Madinah, 8 in Makkah. From 12,500 MAD per person."),
    days: 15, nights: 14, start: "Casablanca", end: "Casablanca", priceFrom: 12500, deposit: 30,
    grid: {
      columns: [C.q5, C.q4, C.t3, C.d2],
      rows: [
        row("Multazam Al Hayat – Jarwal", "Multazam Al Hayat – Jarwal", { q5: 12500, q4: 14000, t3: 15000, d2: 16500 }, det("La Mecque, à 900 m", "Makkah, 900 m")),
        row("Iskan Taysir", "Iskan Taysir", { q5: 15500, q4: 17000, t3: 18500, d2: 19500 }, det("La Mecque, à 850 m", "Makkah, 850 m")),
        row("Amjad Al Diyafa", "Amjad Al Diyafa", { q5: null, q4: 18500, t3: 19500, d2: 20500 }, det("La Mecque, à 700 m", "Makkah, 700 m")),
        row("Taj Park", "Taj Park", { q5: null, q4: 19500, t3: 20500, d2: 21500 }, det("La Mecque, à 600 m", "Makkah, 600 m")),
      ],
    },
    transport: l("Vol direct Casablanca – Djeddah, transferts internes", "Direct flight Casablanca – Jeddah, internal transfers"),
    accommodation: l("Médine 4 nuits (zone du Haram), La Mecque 8 nuits", "Madinah 4 nights (Haram area), Makkah 8 nights"),
    meals: l("Petit-déjeuner quotidien", "Daily breakfast"),
    included: ["Billet d'avion aller-retour", "Hébergement dans les hôtels mentionnés", "Petit-déjeuner quotidien", "Encadrement religieux et accompagnement de l'agence", "Transferts internes", "Assistance pendant tout le voyage"],
    excluded: omraExcl, cancellation: omraCancel, itinerary: omraDays(4, 8), stops: omraStops(),
    warnings: ["Le programme annonce 4 nuits à Médine et 8 nuits à La Mecque pour des dates de 14 jours : durée exacte à confirmer avec l'agence."],
    departures: { dates: ["2027-01-03", "2027-01-17"] }, capacity: 45, source: SRC_ALMIARAJ,
  },
  {
    slug: "omra-ramadan-2027", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra Ramadan 1448 / 2027", "Ramadan Umrah 1448 / 2027", "عمرة رمضان 1448 / 2027"),
    summary: l("Un voyage de foi pendant le mois de Ramadan, avec vols indirects (vol direct depuis Fès ou Casablanca en option). À partir de 21 000 MAD.", "A journey of faith during Ramadan, with indirect flights (direct flight from Fez or Casablanca optional). From 21,000 MAD."),
    days: 15, nights: 14, start: "Casablanca", end: "Casablanca", priceFrom: 21000, deposit: 30,
    grid: {
      columns: [C.s6, C.q5, C.q4, C.t3, C.d2],
      rows: [
        row("Al Marasem", "Al Marasem", { s6: 21000, q5: 22500, q4: 24500, t3: 28000, d2: 30000 }, det("La Mecque, à 1 700 m", "Makkah, 1,700 m")),
        row("Al Hadaek Al Raqia", "Al Hadaek Al Raqia", { s6: 22000, q5: 23500, q4: 25500, t3: 29000, d2: 31000 }, det("La Mecque, à 1 600 m", "Makkah, 1,600 m")),
        row("Luxury Intercontinental", "Luxury Intercontinental", { s6: 25500, q5: 26500, q4: 27000, t3: 30000, d2: 34000 }, det("La Mecque, à 1 600 m", "Makkah, 1,600 m")),
        row("Miraj Jarwal", "Miraj Jarwal", { s6: null, q5: 27000, q4: 29000, t3: 32000, d2: 36000 }, det("La Mecque, à 900 m", "Makkah, 900 m")),
        row("Al Ard Al Mutamayiza", "Al Ard Al Mutamayiza", { s6: 27500, q5: 29000, q4: 31000, t3: 35000, d2: 38000 }, det("La Mecque, à 1 000 m (navette Haram)", "Makkah, 1,000 m (Haram shuttle)")),
        row("Amjad Al Diyafa", "Amjad Al Diyafa", { s6: null, q5: 31000, q4: 34000, t3: 36000, d2: 44000 }, det("La Mecque, à 700 m", "Makkah, 700 m")),
      ],
    },
    transport: l("Vols indirects ; vols directs depuis Fès ou Casablanca : + 2 000 MAD", "Indirect flights; direct flights from Fez or Casablanca: + 2,000 MAD"),
    accommodation: l("Médine : zone du Haram ; La Mecque : hôtel au choix", "Madinah: Haram area; Makkah: hotel of your choice"),
    meals: l("Selon programme", "As per programme"),
    included: ["Billet d'avion", "Visa", "Hébergement dans les hôtels mentionnés", "Transferts en Arabie saoudite", "Visites à La Mecque et Médine", "Encadrement religieux et technique de l'agence"],
    excluded: omraExcl, cancellation: omraCancel, itinerary: omraDays(4, 10), stops: omraStops(),
    warnings: ["Dates exactes et durée non indiquées sur l'affiche : à confirmer avec l'agence."],
    departures: {}, capacity: 45, source: SRC_ALMIARAJ,
    options: [{ code: "vol-direct-ramadan", label: l("Vol direct depuis Fès ou Casablanca", "Direct flight from Fez or Casablanca"), price: 2000 }],
  },
  {
    slug: "omra-chaabane-ramadan-2027", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra Chaabane et Ramadan 1448 / 2027", "Shaaban and Ramadan Umrah 1448 / 2027", "عمرة شعبان ورمضان 1448 / 2027"),
    summary: l("Du 9 Chaabane au 10 Ramadan (17 janvier – 17 février 2027). À partir de 18 500 MAD par personne.", "From 9 Shaaban to 10 Ramadan (17 January – 17 February 2027). From 18,500 MAD per person."),
    days: 32, nights: 31, start: "Casablanca", end: "Casablanca", priceFrom: 18500, deposit: 30,
    grid: {
      columns: [C.q5, C.q4, C.t3, C.d2],
      rows: [
        row("Riyad Al Diyafa", "Riyad Al Diyafa", { q5: 18500, q4: 19500, t3: 21500, d2: 24000 }, det("La Mecque, à 700 m · Médine : zone du Haram", "Makkah, 700 m · Madinah: Haram area")),
        row("Amjad Al Diyafa", "Amjad Al Diyafa", { q5: 21500, q4: 22500, t3: 24000, d2: 27500 }, det("La Mecque, à 700 m · Médine : zone du Haram", "Makkah, 700 m · Madinah: Haram area")),
      ],
    },
    transport: l("Vols directs, transferts en Arabie saoudite", "Direct flights, transfers in Saudi Arabia"),
    accommodation: l("Médine : hôtel de la zone du Haram ; La Mecque : hôtel au choix", "Madinah: Haram-area hotel; Makkah: hotel of your choice"),
    meals: l("Selon programme", "As per programme"),
    included: ["Visa", "Billets d'avion sur vols directs", "Hébergement dans les hôtels mentionnés", "Transferts en Arabie saoudite", "Visites à La Mecque et Médine", "Encadrement religieux et guides de l'agence"],
    excluded: omraExcl, cancellation: omraCancel, itinerary: omraDays(4, 26), stops: omraStops(),
    departures: { dates: ["2027-01-17"] }, capacity: 45, source: SRC_ALMIARAJ,
  },
  {
    slug: "omra-15-jours-novembre-2026", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra 15 jours, 18 novembre – 2 décembre 2026", "15-day Umrah, 18 November – 2 December 2026", "عمرة 15 يوماً من 18 نونبر إلى 02 دجنبر 2026"),
    summary: l("Programme de 15 jours avec 4 niveaux d'hôtels, avec ou sans petit-déjeuner. À partir de 14 500 MAD par personne.", "15-day programme with 4 hotel levels, with or without breakfast. From 14,500 MAD per person."),
    days: 15, nights: 14, start: "Casablanca", end: "Casablanca", priceFrom: 14500, deposit: 30,
    grid: {
      columns: [C.d2, C.t3, C.q4, C.q5],
      rows: [
        row("Amjad Al Diyafa 4* / Médine zone du Haram", "Amjad Al Diyafa 4* / Madinah Haram area", { d2: 18000, t3: 16500, q4: 15500, q5: 14500 }, det("Sans repas · La Mecque à 700 m", "No meals · Makkah 700 m")),
        row("Taj Park 4* / Jiwar Al Haram 4*", "Taj Park 4* / Jiwar Al Haram 4*", { d2: 21000, t3: 19500, q4: 19000, q5: null }, det("Petit-déjeuner · La Mecque à 600 m", "Breakfast · Makkah 600 m")),
        row("Anjum 5* / Crowne Plaza 5*", "Anjum 5* / Crowne Plaza 5*", { d2: 27900, t3: 24500, q4: 23500, q5: null }, det("Petit-déjeuner", "Breakfast")),
        row("Swissôtel 5* / Crowne Plaza 5*", "Swissôtel 5* / Crowne Plaza 5*", { d2: 32500, t3: 29500, q4: 27000, q5: null }, det("Petit-déjeuner", "Breakfast")),
      ],
    },
    transport: l("Billets d'avion, transferts", "Flights, transfers"), accommodation: l("Hôtels selon la formule choisie", "Hotels according to the chosen formula"), meals: l("Sans repas ou petit-déjeuner selon la formule", "No meals or breakfast depending on the formula"),
    included: ["Billets d'avion", "Hébergement", "Visa", "Transferts", "Visites", "Encadrement"], excluded: omraExcl, cancellation: omraCancel, itinerary: omraDays(4, 10), stops: omraStops(),
    departures: { dates: ["2026-11-18"] }, capacity: 45, source: "Affiche transmise le 10/11/2026 (sans marque d'agence) — à confirmer",
  },
  {
    slug: "omra-vacances-scolaires-decembre-2026", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra des vacances scolaires, 5 – 12 décembre 2026", "School-holiday Umrah, 5 – 12 December 2026", "عمرة العطلة المدرسية من 05 إلى 12 دجنبر 2026"),
    summary: l("Une semaine pendant les vacances scolaires, avec train des Haramain. À partir de 20 500 MAD par personne.", "One week during the school holidays, with the Haramain train. From 20,500 MAD per person."),
    days: 8, nights: 7, start: "Casablanca", end: "Casablanca", priceFrom: 20500, deposit: 30,
    grid: {
      columns: [C.d2, C.t3, C.q4],
      rows: [
        row("Taj Park 4* / Jiwar Al Haram 4*", "Taj Park 4* / Jiwar Al Haram 4*", { d2: 22500, t3: 21500, q4: 20500 }, det("Petit-déjeuner", "Breakfast")),
        row("Anjum 5* / Crowne Plaza 5*", "Anjum 5* / Crowne Plaza 5*", { d2: 24500, t3: 23000, q4: 22000 }, det("Petit-déjeuner", "Breakfast")),
      ],
    },
    transport: l("Billets d'avion, train des Haramain, transferts", "Flights, Haramain train, transfers"), accommodation: l("Hôtels 4* ou 5* selon la formule", "4* or 5* hotels depending on the formula"), meals: l("Petit-déjeuner", "Breakfast"),
    included: ["Billets d'avion", "Visa Omra", "Hébergement", "Train des Haramain", "Transferts", "Visites religieuses", "Encadrement et accompagnement"], excluded: omraExcl, cancellation: omraCancel, itinerary: omraDays(3, 4), stops: omraStops(),
    departures: { dates: ["2026-12-05"] }, capacity: 45, source: "Affiche transmise le 10/11/2026 (sans marque d'agence) — à confirmer",
  },
  {
    slug: "omra-15-jours-decembre-2026", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra 15 jours, 8 – 23 décembre 2026", "15-day Umrah, 8 – 23 December 2026", "عمرة 15 يوماً من 08 إلى 23 دجنبر"),
    summary: l("15 jours avec 3 niveaux d'hôtels. À partir de 15 900 MAD par personne.", "15 days with 3 hotel levels. From 15,900 MAD per person."),
    days: 16, nights: 15, start: "Casablanca", end: "Casablanca", priceFrom: 15900, deposit: 30,
    grid: {
      columns: [C.d2, C.t3, C.q4, C.q5],
      rows: [
        row("Amjad Al Diyafa 4* / Médine zone du Haram", "Amjad Al Diyafa 4* / Madinah Haram area", { d2: 19700, t3: 18700, q4: 17800, q5: 15900 }, det("Sans repas · La Mecque à 700 m", "No meals · Makkah 700 m")),
        row("Taj Park 4* / Jiwar Al Haram 4*", "Taj Park 4* / Jiwar Al Haram 4*", { d2: 22900, t3: 21900, q4: 20900, q5: null }, det("Petit-déjeuner · La Mecque à 600 m", "Breakfast · Makkah 600 m")),
        row("Anjum 5* / Crowne Plaza 5*", "Anjum 5* / Crowne Plaza 5*", { d2: 31000, t3: 28000, q4: 26000, q5: null }, det("Petit-déjeuner", "Breakfast")),
      ],
    },
    transport: l("Billets d'avion, transferts", "Flights, transfers"), accommodation: l("Hôtels selon la formule", "Hotels according to the formula"), meals: l("Sans repas ou petit-déjeuner selon la formule", "No meals or breakfast depending on the formula"),
    included: ["Billets d'avion", "Hébergement", "Transferts", "Visites", "Accompagnateur"], excluded: omraExcl, cancellation: omraCancel, itinerary: omraDays(4, 11), stops: omraStops(),
    warnings: ["L'année n'est pas indiquée sur l'affiche (décembre 2026 supposé) : à confirmer avec l'agence."],
    departures: { dates: ["2026-12-08"] }, capacity: 45, source: "Affiche transmise le 10/11/2026 (sans marque d'agence) — à confirmer",
  },
  {
    slug: "omra-chawal-2027", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra de Chawal, 19 mars – 1er avril 2027", "Shawwal Umrah, 19 March – 1 April 2027", "عمرة شوال من 19 مارس إلى 01 أبريل 2027"),
    summary: l("Après le Ramadan, 4 niveaux d'hôtels. À partir de 15 000 MAD par personne.", "After Ramadan, 4 hotel levels. From 15,000 MAD per person."),
    days: 14, nights: 13, start: "Casablanca", end: "Casablanca", priceFrom: 15000, deposit: 30,
    grid: {
      columns: [C.d2, C.t3, C.q4, C.q5],
      rows: [
        row("Amjad Al Diyafa 4* / Médine zone du Haram", "Amjad Al Diyafa 4* / Madinah Haram area", { d2: 18000, t3: 17000, q4: 16000, q5: 15000 }, det("Sans repas", "No meals")),
        row("Taj Park 4* / Jiwar Al Haram 4*", "Taj Park 4* / Jiwar Al Haram 4*", { d2: 21500, t3: 20000, q4: 19000, q5: null }, det("Petit-déjeuner", "Breakfast")),
        row("Anjum 5* / Crowne Plaza 5*", "Anjum 5* / Crowne Plaza 5*", { d2: 26000, t3: 23500, q4: 22000, q5: null }, det("Petit-déjeuner", "Breakfast")),
        row("Swissôtel 5* / Crowne Plaza 5*", "Swissôtel 5* / Crowne Plaza 5*", { d2: 33000, t3: 28000, q4: 26000, q5: null }, det("Petit-déjeuner", "Breakfast")),
      ],
    },
    transport: l("Billets d'avion, transferts", "Flights, transfers"), accommodation: l("Hôtels selon la formule", "Hotels according to the formula"), meals: l("Sans repas ou petit-déjeuner selon la formule", "No meals or breakfast depending on the formula"),
    included: ["Billets d'avion", "Hébergement", "Visa", "Transferts", "Visites", "Encadrement"], excluded: omraExcl, cancellation: omraCancel, itinerary: omraDays(4, 9), stops: omraStops(),
    departures: { dates: ["2027-03-19"] }, capacity: 45, source: "Affiche transmise le 10/11/2026 (sans marque d'agence) — à confirmer",
  },
  {
    slug: "omra-turquie-decembre-2026", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra et Turquie, 17 décembre 2026 – 3 janvier 2027", "Umrah and Turkey, 17 December 2026 – 3 January 2027", "عمرة مع تركيا من 17/12/2026 إلى 03/01/2027"),
    summary: l("Médine, La Mecque puis Istanbul avec Turkish Airlines, hôtel 3* avec petit-déjeuner à Istanbul. À partir de 16 500 MAD par personne.", "Madinah, Makkah then Istanbul with Turkish Airlines, 3* hotel with breakfast in Istanbul. From 16,500 MAD per person."),
    days: 18, nights: 17, start: "Casablanca", end: "Casablanca", priceFrom: 16500, deposit: 30,
    transport: l("Turkish Airlines aller-retour, transferts en Arabie saoudite et en Turquie", "Turkish Airlines return flights, transfers in Saudi Arabia and Turkey"),
    accommodation: l("Médine, La Mecque et Istanbul (hôtel 3* avec petit-déjeuner à Istanbul)", "Madinah, Makkah and Istanbul (3* hotel with breakfast in Istanbul)"),
    meals: l("Petit-déjeuner à Istanbul", "Breakfast in Istanbul"),
    included: ["Visa", "Hôtels à Médine, La Mecque et Istanbul", "Transferts en Arabie saoudite et en Turquie", "Billets d'avion aller-retour avec Turkish Airlines", "Encadrement religieux et accompagnement pendant tout le voyage"],
    excluded: omraExcl, cancellation: omraCancel,
    itinerary: [...omraDays(4, 8).slice(0, 3), { title: "Istanbul", description: "Vol vers Istanbul, séjour en hôtel 3* avec petit-déjeuner, découverte de la ville." }, { title: "Retour", description: "Vol retour vers le Maroc." }],
    stops: [stop(CASA, 1, "FLIGHT"), stop(MEDINA, 1, "DRIVE"), stop(MECCA, 5, "FLIGHT"), stop({ name: "Istanbul", lat: 41.0082, lng: 28.9784 }, 13, "FLIGHT"), stop(CASA, 18, null)],
    warnings: ["Prix « à partir de » : détail des hôtels et des types de chambre à demander à l'agence."],
    departures: { dates: ["2026-12-17"] }, capacity: 45, source: SRC_ALMIARAJ,
  },
  {
    slug: "omra-dubai-decembre-2026", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra et Dubaï, 6 – 22 décembre 2026", "Umrah and Dubai, 6 – 22 December 2026", "عمرة مع دبي من 06 إلى 22 دجنبر 2026"),
    summary: l("4 nuits à Dubaï, 4 à Médine, 7 à La Mecque, avec Emirates. À partir de 20 500 MAD par personne.", "4 nights in Dubai, 4 in Madinah, 7 in Makkah, with Emirates. From 20,500 MAD per person."),
    days: 17, nights: 15, start: "Casablanca", end: "Casablanca", priceFrom: 20500, deposit: 30,
    grid: {
      columns: [C.d2, C.t3, C.q4],
      rows: [
        row("Amjad Al Diyafa 4* · Dairat Al Haram 3*", "Amjad Al Diyafa 4* · Dairat Al Haram 3*", { d2: 23500, t3: 21500, q4: 20500 }, det("Dubaï : La Zona 4*", "Dubai: La Zona 4*")),
        row("Taj Park 4* · Jiwar Al Haram 4*", "Taj Park 4* · Jiwar Al Haram 4*", { d2: 28500, t3: 26000, q4: 25000 }, det("Dubaï : La Zona 4*", "Dubai: La Zona 4*")),
        row("Anjum Makkah 5* · Crowne Plaza 5*", "Anjum Makkah 5* · Crowne Plaza 5*", { d2: 32500, t3: 29000, q4: 27000 }, det("Dubaï : La Zona 4*", "Dubai: La Zona 4*")),
      ],
    },
    transport: l("Vols Emirates, transferts", "Emirates flights, transfers"), accommodation: l("Dubaï 4 nuits (La Zona 4*), Médine 4 nuits, La Mecque 7 nuits", "Dubai 4 nights (La Zona 4*), Madinah 4 nights, Makkah 7 nights"), meals: l("Selon programme", "As per programme"),
    included: ["Visa des Émirats", "Séjour confortable à Dubaï, Médine et La Mecque", "Vols Emirates", "Hôtels sélectionnés", "Transferts et accompagnement", "Visites à La Mecque et Médine"], excluded: omraExcl, cancellation: omraCancel,
    itinerary: omraDays(4, 7, { place: "Dubaï", nights: 4 }),
    stops: [stop(CASA, 1, "FLIGHT"), stop({ name: "Dubaï", lat: 25.2048, lng: 55.2708 }, 1, "FLIGHT"), stop(MEDINA, 5, "DRIVE"), stop(MECCA, 9, "FLIGHT"), stop(CASA, 17, null)],
    departures: { dates: ["2026-12-06"] }, capacity: 45, source: "Affiche transmise le 10/11/2026 (sans marque d'agence) — à confirmer",
  },
  {
    slug: "omra-egypte-decembre-2026", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra et Égypte, 6 – 21 décembre 2026", "Umrah and Egypt, 6 – 21 December 2026", "عمرة مع مصر من 06 إلى 21 دجنبر 2026"),
    summary: l("4 nuits en Égypte, 4 à Médine, 7 à La Mecque. À partir de 20 000 MAD par personne.", "4 nights in Egypt, 4 in Madinah, 7 in Makkah. From 20,000 MAD per person."),
    days: 16, nights: 15, start: "Casablanca", end: "Casablanca", priceFrom: 20000, deposit: 30,
    grid: {
      columns: [C.d2, C.t3, C.q4],
      rows: [
        row("Amjad Al Diyafa 4* · Dairat Al Haram", "Amjad Al Diyafa 4* · Dairat Al Haram", { d2: 22200, t3: 21500, q4: 20000 }, det("Sans repas · Égypte : hôtel 3* ou 4*", "No meals · Egypt: 3* or 4* hotel")),
        row("Taj Park 4* · Jiwar Al Haram 4*", "Taj Park 4* · Jiwar Al Haram 4*", { d2: 24900, t3: 23700, q4: 23000 }, det("Petit-déjeuner · Égypte : hôtel 3* ou 4*", "Breakfast · Egypt: 3* or 4* hotel")),
        row("Anjum 5* · Crowne Plaza 5*", "Anjum 5* · Crowne Plaza 5*", { d2: 31000, t3: 28000, q4: 27500 }, det("Petit-déjeuner · Égypte : hôtel 3* ou 4*", "Breakfast · Egypt: 3* or 4* hotel")),
      ],
    },
    transport: l("Billets d'avion, transferts", "Flights, transfers"), accommodation: l("Égypte 4 nuits (hôtel 3* ou 4*), Médine 4 nuits, La Mecque 7 nuits", "Egypt 4 nights (3* or 4* hotel), Madinah 4 nights, Makkah 7 nights"), meals: l("Selon la formule", "Depending on the formula"),
    included: ["Billets d'avion", "Hébergement", "Encadrement par le personnel de l'agence", "Visites"], excluded: omraExcl, cancellation: omraCancel,
    itinerary: omraDays(4, 7, { place: "Le Caire", nights: 4 }),
    stops: [stop(CASA, 1, "FLIGHT"), stop({ name: "Le Caire", lat: 30.0444, lng: 31.2357 }, 1, "FLIGHT"), stop(MEDINA, 5, "DRIVE"), stop(MECCA, 9, "FLIGHT"), stop(CASA, 16, null)],
    departures: { dates: ["2026-12-06"] }, capacity: 45, source: "Affiche transmise le 10/11/2026 (sans marque d'agence) — à confirmer",
  },
  {
    slug: "omra-malaisie-janvier-2027", destination: "omra-la-mecque-medine", type: "OMRA", status: "INDICATIVE",
    title: l("Omra et Malaisie, 10 – 26 janvier 2027", "Umrah and Malaysia, 10 – 26 January 2027", "عمرة مع ماليزيا من 10 إلى 26 يناير 2027"),
    summary: l("4 nuits en Malaisie, 4 à Médine, 7 à La Mecque. À partir de 23 500 MAD par personne.", "4 nights in Malaysia, 4 in Madinah, 7 in Makkah. From 23,500 MAD per person."),
    days: 17, nights: 15, start: "Casablanca", end: "Casablanca", priceFrom: 23500, deposit: 30,
    grid: {
      columns: [C.d2, C.t3, C.q4],
      rows: [
        row("Amjad Al Diyafa 3* · Dairat Al Haram 3*", "Amjad Al Diyafa 3* · Dairat Al Haram 3*", { d2: 26000, t3: 24500, q4: 23500 }, det("La Mecque à 800 m · Malaisie : Ibis 3* petit-déjeuner", "Makkah 800 m · Malaysia: Ibis 3* breakfast")),
        row("Taj Park 4* · Jiwar Al Haram 4*", "Taj Park 4* · Jiwar Al Haram 4*", { d2: 29000, t3: 27000, q4: 25500 }, det("La Mecque à 600 m · Malaisie : Ibis 3* petit-déjeuner", "Makkah 600 m · Malaysia: Ibis 3* breakfast")),
        row("Anjum Makkah 5* · Crowne Plaza 5*", "Anjum Makkah 5* · Crowne Plaza 5*", { d2: 33500, t3: 30500, q4: 28500 }, det("Petit-déjeuner · Malaisie : Ibis 4*", "Breakfast · Malaysia: Ibis 4*")),
      ],
    },
    transport: l("Vols (Saudia selon l'affiche), transferts", "Flights (Saudia according to the flyer), transfers"), accommodation: l("Malaisie 4 nuits, Médine 4 nuits, La Mecque 7 nuits", "Malaysia 4 nights, Madinah 4 nights, Makkah 7 nights"), meals: l("Selon la formule", "Depending on the formula"),
    included: ["Billets d'avion", "Hébergement dans les hôtels indiqués", "Transferts"], excluded: omraExcl, cancellation: omraCancel,
    itinerary: omraDays(4, 7, { place: "Kuala Lumpur", nights: 4 }),
    stops: [stop(CASA, 1, "FLIGHT"), stop({ name: "Kuala Lumpur", lat: 3.139, lng: 101.6869 }, 1, "FLIGHT"), stop(MEDINA, 5, "DRIVE"), stop(MECCA, 9, "FLIGHT"), stop(CASA, 17, null)],
    warnings: ["Prestations incluses non détaillées sur l'affiche : à confirmer avec l'agence."],
    departures: { dates: ["2027-01-10"] }, capacity: 45, source: "Affiche transmise le 10/11/2026 (sans marque d'agence) — à confirmer",
  },
  {
    slug: "croisiere-aroya-istanbul-novembre-2026", destination: "turquie-istanbul", type: "CROISIERE", status: "INDICATIVE",
    title: l("Croisière à bord de l'Aroya au départ d'Istanbul — 8 jours / 7 nuits", "Cruise aboard Aroya from Istanbul — 8 days / 7 nights", "رحلة بحرية على متن أرويا انطلاقاً من إسطنبول — 8 أيام / 7 ليال"),
    summary: l("Istanbul, Alexandrie, Marmaris et Kuşadası, départ le 28 novembre 2026 ; croisière annoncée avec la chanteuse Nancy Ajram. 5 500 MAD par personne en cabine double, vol non inclus.", "Istanbul, Alexandria, Marmaris and Kuşadası, departing 28 November 2026; cruise announced with singer Nancy Ajram. 5,500 MAD per person in a double cabin, flight not included."),
    days: 8, nights: 7, start: "Istanbul", end: "Istanbul", priceFrom: 5500, deposit: 30,
    transport: l("Croisière à bord de l'Aroya — vol vers Istanbul non inclus", "Cruise aboard Aroya — flight to Istanbul not included"),
    accommodation: l("Cabine double à bord", "Double cabin on board"), meals: l("Selon les conditions de la croisière", "According to the cruise terms"),
    included: ["7 nuits en cabine double", "Escales selon l'itinéraire", "Accompagnement professionnel"],
    excluded: ["Vol aller-retour vers Istanbul", "Dépenses personnelles", "Excursions aux escales non mentionnées"],
    warnings: ["Tarif soumis à évolution et selon disponibilité (mention de l'affiche).", "L'affiche indique « sans visa » : formalités d'entrée en Turquie et en Égypte à vérifier selon votre nationalité.", "Présence de Nancy Ajram à bord : annonce de l'affiche, à confirmer par l'agence."],
    cancellation: l("Conditions de la compagnie de croisière, communiquées par l'agence à la réservation.", "Cruise line terms, provided by the agency when booking."),
    itinerary: [
      { title: "Jour 1 — Istanbul (Turquie)", description: "Embarquement à Istanbul." },
      { title: "Jour 2 — En mer", description: "Journée de navigation." },
      { title: "Jours 3 et 4 — Alexandrie (Égypte)", description: "Escale de deux jours à Alexandrie." },
      { title: "Jour 5 — Marmaris (Turquie)", description: "Escale à Marmaris." },
      { title: "Jour 6 — Kuşadası (Turquie)", description: "Escale à Kuşadası." },
      { title: "Jour 7 — En mer", description: "Journée de navigation." },
      { title: "Jour 8 — Istanbul", description: "Débarquement à Istanbul." },
    ],
    stops: [
      { name: "Istanbul", lat: 41.0082, lng: 28.9784, day: 1, mode: "SEA" },
      { name: "Alexandrie", lat: 31.2001, lng: 29.9187, day: 3, mode: "SEA" },
      { name: "Marmaris", lat: 36.855, lng: 28.2742, day: 5, mode: "SEA" },
      { name: "Kuşadası", lat: 37.8579, lng: 27.2611, day: 6, mode: "SEA" },
      { name: "Istanbul", lat: 41.0082, lng: 28.9784, day: 8, mode: null },
    ],
    departures: { dates: ["2026-11-28"] }, capacity: 40, source: SRC_ALMIARAJ,
  },
  // ─── offres Benani Travel publiées sur Instagram (relevées le 10/11/2026) ───
  {
    slug: "merzouga-tout-compris-week-end", destination: "merzouga", type: "CIRCUIT", status: "INDICATIVE",
    title: l("Merzouga tout compris : week-end de 3 jours au départ de Casablanca, Rabat ou Meknès", "All-inclusive Merzouga: 3-day weekend from Casablanca, Rabat or Meknes", "مرزوكة شاملة المصاريف: عطلة نهاية أسبوع من 3 أيام انطلاقاً من الدار البيضاء والرباط ومكناس"),
    summary: l("Le voyage en groupe de Benani Travel vers les dunes de Merzouga : autocar climatisé, hôtel avec piscine, dromadaire, 4x4 et soirée artistique.", "Benani Travel's group trip to the Merzouga dunes: air-conditioned coach, hotel with pool, camel ride, 4x4 and an evening show."),
    days: 3, nights: 1, start: "Casablanca", end: "Casablanca", priceFrom: 999, deposit: 40,
    transport: l("Autocar de tourisme climatisé depuis Casablanca, Rabat ou Meknès (El Jadida + 80 MAD)", "Air-conditioned coach from Casablanca, Rabat or Meknes (El Jadida + 80 MAD)"),
    accommodation: l("1 nuit en hôtel classé avec piscine à Merzouga (nuit du vendredi en route)", "1 night in a rated hotel with pool in Merzouga (Friday night on the road)"),
    meals: l("Petits-déjeuners samedi et dimanche, déjeuner et dîner du samedi", "Saturday and Sunday breakfasts, Saturday lunch and dinner"),
    included: ["Transport en autocar climatisé", "1 nuit en hôtel classé avec piscine", "Soirée artistique", "Petits-déjeuners, déjeuner et dîner du samedi", "Balade à dromadaire", "Excursion en 4x4", "Accompagnateur et animation"],
    excluded: ["Repas non mentionnés", "Dépenses personnelles", "Départ d'El Jadida (+ 80 MAD / pers.)"],
    cancellation: l("Acompte de 400 MAD à la réservation par virement. En cas d'annulation, prévenir l'agence suffisamment tôt pour permettre le remplacement ; aucune réclamation en cas d'absence au départ.", "400 MAD deposit when booking, by transfer. If you cancel, inform the agency early enough for the place to be filled; no claim for a no-show."),
    itinerary: [
      { title: "Vendredi soir — Départ", description: "Départ en autocar climatisé de Casablanca, Rabat ou Meknès, route de nuit vers le Tafilalet." },
      { title: "Samedi — Tafilalet et Merzouga", description: "Erfoud et Rissani, installation à l'hôtel avec piscine, dromadaire et 4x4 dans l'Erg Chebbi, dîner et soirée artistique." },
      { title: "Dimanche — Retour", description: "Petit-déjeuner puis retour vers Meknès, Rabat et Casablanca." },
    ],
    stops: [stop(CASA, 1, "DRIVE"), stop({ name: "Rabat", lat: 34.0209, lng: -6.8416 }, 1, "DRIVE"), stop({ name: "Meknès", lat: 33.8935, lng: -5.5473 }, 1, "DRIVE"), stop({ name: "Erfoud", lat: 31.4333, lng: -4.2333 }, 2, "DRIVE"), stop({ name: "Merzouga", lat: 31.0994, lng: -4.0119 }, 2, null)],
    departures: { weekly: { weekday: 5, weeks: 10 } }, capacity: 40,
    options: [{ code: "depart-el-jadida", label: l("Départ d'El Jadida", "Departure from El Jadida"), price: 80 }],
    source: "Instagram @benani_travel, reel DWhQ2R3jKEQ (relevé le 10/11/2026) — à confirmer",
  },
  {
    slug: "imlil-agafay-marrakech-week-end", destination: "atlas", type: "CIRCUIT", status: "INDICATIVE",
    title: l("Week-end Imlil, Agafay et Marrakech : 3 jours / 2 nuits", "Imlil, Agafay and Marrakesh weekend: 3 days / 2 nights", "عطلة نهاية الأسبوع إمليل وأكفاي ومراكش: 3 أيام وليلتان"),
    summary: l("Des montagnes et cascades d'Imlil au désert d'Agafay, jusqu'à Marrakech : un week-end au départ de Rabat, Casablanca ou El Jadida.", "From the mountains and waterfalls of Imlil to the Agafay desert and Marrakesh: a weekend from Rabat, Casablanca or El Jadida."),
    days: 3, nights: 2, start: "Rabat", end: "Rabat", priceFrom: 900, deposit: 30,
    transport: l("Transport depuis Rabat, Casablanca ou El Jadida", "Transport from Rabat, Casablanca or El Jadida"),
    accommodation: l("1 nuit à Imlil, 1 nuit en hôtel à Marrakech", "1 night in Imlil, 1 hotel night in Marrakesh"), meals: l("À confirmer auprès de l'agence", "To be confirmed with the agency"),
    included: ["Transport", "Balade nature à Imlil", "1 nuit à Imlil", "1 nuit à Marrakech"],
    excluded: ["Soirée à Agafay (option)", "Montgolfière (option)", "Quad dans la palmeraie (option)", "Repas : à confirmer"],
    cancellation: l("Conditions d'annulation à confirmer auprès de l'agence.", "Cancellation terms to be confirmed with the agency."),
    itinerary: [
      { title: "Jour 1 — Imlil", description: "Route vers le Haut Atlas, balade vers les cascades, nuit à Imlil." },
      { title: "Jour 2 — Agafay et Marrakech", description: "Route vers Marrakech, soirée à Agafay en option, nuit à Marrakech." },
      { title: "Jour 3 — Marrakech et retour", description: "Montgolfière ou quad en option, temps libre, retour." },
    ],
    stops: [stop({ name: "Rabat", lat: 34.0209, lng: -6.8416 }, 1, "DRIVE"), stop(CASA, 1, "DRIVE"), stop({ name: "Imlil", lat: 31.1369, lng: -7.9197 }, 1, "DRIVE"), stop({ name: "Agafay", lat: 31.45, lng: -8.2 }, 2, "DRIVE"), stop({ name: "Marrakech", lat: 31.6295, lng: -7.9811 }, 2, null)],
    departures: { weekly: { weekday: 5, weeks: 10 } }, capacity: 40,
    source: "Instagram @benani_travel, reel DfD_WB7MXcV (relevé le 10/11/2026) — à confirmer",
  },
];

// ───────────────────────────── programmes SIMULÉS (exemples, prix fictifs) ─────────────────────────────
const demoCancel = l("Exemple : annulation gratuite jusqu'à 15 jours avant le départ, puis acompte conservé.", "Example: free cancellation up to 15 days before departure, then deposit retained.");
const sim = (p: Omit<Programme, "status" | "cancellation" | "source" | "deposit"> & { deposit?: number }): Programme => ({
  deposit: 30,
  ...p,
  status: "DEMO",
  cancellation: demoCancel,
  source: "Programme SIMULÉ (exemple) à la demande de l'utilisateur — prix, dates et places fictifs",
});
const P = (name: string, lat: number, lng: number) => ({ name, lat, lng });

export const simulated: Programme[] = [
  sim({
    slug: "marrakech-ville-imperiale-2j", destination: "marrakech", type: "CIRCUIT", title: l("Marrakech, la ville rouge — 2 jours / 1 nuit", "Marrakesh, the red city — 2 days / 1 night", "مراكش الحمراء — يومان وليلة"),
    summary: l("Médina, jardins Majorelle, place Jemaa el-Fna et nuit en riad.", "Medina, Majorelle gardens, Jemaa el-Fna square and a night in a riad."),
    days: 2, nights: 1, start: "Marrakech", end: "Marrakech", priceFrom: 1450,
    transport: l("Minibus avec chauffeur", "Minibus with driver"), accommodation: l("Riad dans la médina", "Riad in the medina"), meals: l("Petit-déjeuner et dîner", "Breakfast and dinner"),
    included: ["Guide officiel en médina", "Nuit en riad", "Petit-déjeuner et dîner", "Entrée des jardins Majorelle"], excluded: ["Déjeuners", "Dépenses personnelles"],
    itinerary: [{ title: "Jour 1 — Médina", description: "Koutoubia, palais de la Bahia, souks, soirée sur Jemaa el-Fna." }, { title: "Jour 2 — Jardins", description: "Jardins Majorelle, Ménara, retour." }],
    stops: [stop(P("Marrakech", 31.6295, -7.9811), 1, "DRIVE"), stop(P("Jardin Majorelle", 31.6417, -8.0033), 2, null)],
    departures: { weekly: { weekday: 6, weeks: 8 } }, capacity: 16,
  }),
  sim({
    slug: "fes-medina-millenaire-2j", destination: "fes", type: "CIRCUIT", title: l("Fès, la médina millénaire — 2 jours / 1 nuit", "Fez, the thousand-year-old medina — 2 days / 1 night", "فاس العتيقة — يومان وليلة"),
    summary: l("Médina classée, tanneries, Qaraouiyine et artisanat.", "Listed medina, tanneries, Qarawiyyin and crafts."),
    days: 2, nights: 1, start: "Fès", end: "Fès", priceFrom: 1300,
    transport: l("À pied dans la médina, minibus", "On foot in the medina, minibus"), accommodation: l("Riad", "Riad"), meals: l("Petit-déjeuner", "Breakfast"),
    included: ["Guide officiel", "Nuit en riad", "Petit-déjeuner"], excluded: ["Repas", "Dépenses personnelles"],
    itinerary: [{ title: "Jour 1 — Fès el-Bali", description: "Bab Boujloud, médersa Bou Inania, tanneries Chouara." }, { title: "Jour 2 — Fès Jdid", description: "Palais royal (extérieur), mellah, borj Nord." }],
    stops: [stop(P("Fès", 34.0181, -5.0078), 1, null)], departures: { weekly: { weekday: 6, weeks: 8 } }, capacity: 16,
  }),
  sim({
    slug: "chefchaouen-akchour-2j", destination: "chefchaouen", type: "CIRCUIT", title: l("Chefchaouen et cascades d'Akchour — 2 jours / 1 nuit", "Chefchaouen and Akchour falls — 2 days / 1 night", "شفشاون وشلالات أقشور — يومان وليلة"),
    summary: l("La ville bleue et la randonnée vers le pont de Dieu.", "The blue city and the hike to God's Bridge."),
    days: 2, nights: 1, start: "Tanger", end: "Tanger", priceFrom: 1200,
    transport: l("Minibus depuis Tanger", "Minibus from Tangier"), accommodation: l("Maison d'hôtes à Chefchaouen", "Guesthouse in Chefchaouen"), meals: l("Petit-déjeuner", "Breakfast"),
    included: ["Transport", "Nuit en maison d'hôtes", "Petit-déjeuner", "Guide de randonnée"], excluded: ["Repas", "Dépenses personnelles"],
    itinerary: [{ title: "Jour 1 — Chefchaouen", description: "Route depuis Tanger, médina bleue, coucher de soleil à la mosquée espagnole." }, { title: "Jour 2 — Akchour", description: "Randonnée aux cascades et au pont de Dieu, retour." }],
    stops: [stop(P("Tanger", 35.7595, -5.834), 1, "DRIVE"), stop(P("Chefchaouen", 35.1688, -5.2636), 1, "DRIVE"), stop(P("Akchour", 35.2386, -5.1747), 2, null)],
    departures: { weekly: { weekday: 6, weeks: 8 } }, capacity: 16,
  }),
  sim({
    slug: "essaouira-journee", destination: "essaouira", type: "CIRCUIT", title: l("Essaouira en une journée depuis Marrakech", "Essaouira day trip from Marrakesh", "الصويرة في يوم واحد انطلاقاً من مراكش"),
    summary: l("Port de pêche, remparts et médina face à l'Atlantique.", "Fishing port, ramparts and medina facing the Atlantic."),
    days: 1, nights: 0, start: "Marrakech", end: "Marrakech", priceFrom: 450,
    transport: l("Minibus climatisé", "Air-conditioned minibus"), accommodation: l("—", "—"), meals: l("Non inclus", "Not included"),
    included: ["Transport aller-retour", "Arrêt dans une coopérative d'argan"], excluded: ["Repas", "Guide en médina (option)"],
    itinerary: [{ title: "Journée", description: "Route d'Essaouira (environ 3 h), coopérative d'argan, médina et port, retour le soir." }],
    stops: [stop(P("Marrakech", 31.6295, -7.9811), 1, "DRIVE"), stop(P("Essaouira", 31.5085, -9.7595), 1, null)], departures: { weekly: { weekday: 0, weeks: 8 } }, capacity: 16,
  }),
  sim({
    slug: "agadir-soleil-4j", destination: "agadir", type: "SEJOUR", title: l("Agadir, séjour soleil — 4 jours / 3 nuits", "Agadir sun break — 4 days / 3 nights", "أكادير عطلة شمس — 4 أيام / 3 ليال"),
    summary: l("Plage, kasbah d'Agadir Oufella et excursion à Paradise Valley.", "Beach, Agadir Oufella kasbah and a trip to Paradise Valley."),
    days: 4, nights: 3, start: "Agadir", end: "Agadir", priceFrom: 2900,
    transport: l("Transferts aéroport et excursion", "Airport transfers and excursion"), accommodation: l("Hôtel 4* en bord de mer", "4* seafront hotel"), meals: l("Demi-pension", "Half board"),
    included: ["3 nuits en hôtel 4*", "Demi-pension", "Transferts", "Excursion Paradise Valley"], excluded: ["Vols", "Dépenses personnelles"],
    itinerary: [{ title: "Jour 1", description: "Arrivée, installation." }, { title: "Jour 2", description: "Kasbah et souk El Had." }, { title: "Jour 3", description: "Paradise Valley." }, { title: "Jour 4", description: "Départ." }],
    stops: [stop(P("Agadir", 30.4278, -9.5981), 1, "DRIVE"), stop(P("Paradise Valley", 30.5683, -9.4983), 3, null)], departures: { weekly: { weekday: 4, weeks: 8 } }, capacity: 20,
  }),
  sim({
    slug: "dakhla-lagune-4j", destination: "dakhla", type: "SEJOUR", title: l("Dakhla, la lagune — 4 jours / 3 nuits", "Dakhla, the lagoon — 4 days / 3 nights", "الداخلة البحيرة — 4 أيام / 3 ليال"),
    summary: l("Lagune, dune blanche et sports de glisse.", "Lagoon, white dune and board sports."),
    days: 4, nights: 3, start: "Dakhla", end: "Dakhla", priceFrom: 4900,
    transport: l("Transferts et 4x4", "Transfers and 4x4"), accommodation: l("Écolodge en bord de lagune", "Lagoon-side ecolodge"), meals: l("Pension complète", "Full board"),
    included: ["3 nuits en écolodge", "Pension complète", "Excursion à la dune blanche", "Initiation au kitesurf"], excluded: ["Vols", "Dépenses personnelles"],
    itinerary: [{ title: "Jour 1", description: "Arrivée, installation." }, { title: "Jour 2", description: "Dune blanche et île du Dragon." }, { title: "Jour 3", description: "Initiation au kitesurf." }, { title: "Jour 4", description: "Départ." }],
    stops: [stop(P("Dakhla", 23.6848, -15.958), 1, null)], departures: { weekly: { weekday: 4, weeks: 8 } }, capacity: 12,
  }),
  sim({
    slug: "ouzoud-cascades-journee", destination: "ouzoud", type: "CIRCUIT", title: l("Cascades d'Ouzoud en une journée", "Ouzoud Falls day trip", "شلالات أوزود في يوم واحد"),
    summary: l("Les plus hautes cascades du Maroc, au départ de Marrakech.", "Morocco's highest waterfalls, from Marrakesh."),
    days: 1, nights: 0, start: "Marrakech", end: "Marrakech", priceFrom: 350,
    transport: l("Minibus climatisé", "Air-conditioned minibus"), accommodation: l("—", "—"), meals: l("Non inclus", "Not included"),
    included: ["Transport aller-retour", "Guide local"], excluded: ["Repas", "Barque (option)"],
    itinerary: [{ title: "Journée", description: "Route (environ 2 h 30), descente aux cascades, déjeuner libre, retour." }],
    stops: [stop(P("Marrakech", 31.6295, -7.9811), 1, "DRIVE"), stop(P("Ouzoud", 32.0153, -6.7189), 1, null)], departures: { weekly: { weekday: 0, weeks: 8 } }, capacity: 16,
  }),
  sim({
    slug: "ifrane-azrou-journee", destination: "ifrane-azrou", type: "CIRCUIT", title: l("Ifrane et Azrou en une journée depuis Fès", "Ifrane and Azrou day trip from Fez", "إفران وأزرو في يوم واحد انطلاقاً من فاس"),
    summary: l("La « petite Suisse » du Maroc et la cédraie aux singes magots.", "Morocco's 'little Switzerland' and the cedar forest with Barbary macaques."),
    days: 1, nights: 0, start: "Fès", end: "Fès", priceFrom: 400,
    transport: l("Minibus", "Minibus"), accommodation: l("—", "—"), meals: l("Non inclus", "Not included"),
    included: ["Transport", "Guide"], excluded: ["Repas"],
    itinerary: [{ title: "Journée", description: "Ifrane, lac Dayet Aoua, forêt de cèdres d'Azrou, retour à Fès." }],
    stops: [stop(P("Fès", 34.0181, -5.0078), 1, "DRIVE"), stop(P("Ifrane", 33.5228, -5.1106), 1, "DRIVE"), stop(P("Azrou", 33.4342, -5.2215), 1, null)], departures: { weekly: { weekday: 0, weeks: 8 } }, capacity: 16,
  }),
  sim({
    slug: "istanbul-decouverte-5j", destination: "turquie-istanbul", type: "SEJOUR", title: l("Istanbul découverte — 5 jours / 4 nuits", "Discover Istanbul — 5 days / 4 nights", "اكتشاف إسطنبول — 5 أيام / 4 ليال"),
    summary: l("Sainte-Sophie, Mosquée bleue, Grand Bazar et croisière sur le Bosphore.", "Hagia Sophia, Blue Mosque, Grand Bazaar and a Bosphorus cruise."),
    days: 5, nights: 4, start: "Casablanca", end: "Casablanca", priceFrom: 7900,
    transport: l("Vol aller-retour, transferts", "Return flight, transfers"), accommodation: l("Hôtel 4* à Sultanahmet", "4* hotel in Sultanahmet"), meals: l("Petit-déjeuner", "Breakfast"),
    included: ["Vol aller-retour", "4 nuits en hôtel 4*", "Petit-déjeuner", "Transferts", "Croisière sur le Bosphore", "Visite guidée de la vieille ville"], excluded: ["Visa électronique si nécessaire", "Repas", "Dépenses personnelles"],
    itinerary: [{ title: "Jour 1", description: "Vol, arrivée et installation." }, { title: "Jour 2", description: "Sainte-Sophie, Mosquée bleue, palais de Topkapi." }, { title: "Jour 3", description: "Grand Bazar, croisière sur le Bosphore." }, { title: "Jour 4", description: "Journée libre ou îles des Princes." }, { title: "Jour 5", description: "Vol retour." }],
    stops: [stop(CASA, 1, "FLIGHT"), stop(P("Istanbul", 41.0082, 28.9784), 1, null)], departures: { weekly: { weekday: 4, weeks: 8 } }, capacity: 20,
  }),
  sim({
    slug: "dubai-sejour-5j", destination: "emirats-dubai", type: "SEJOUR", title: l("Dubaï, séjour découverte — 5 jours / 4 nuits", "Dubai discovery break — 5 days / 4 nights", "دبي عطلة استكشاف — 5 أيام / 4 ليال"),
    summary: l("Burj Khalifa, souks, safari dans le désert et dhow cruise.", "Burj Khalifa, souks, desert safari and dhow cruise."),
    days: 5, nights: 4, start: "Casablanca", end: "Casablanca", priceFrom: 9900,
    transport: l("Vol aller-retour, transferts", "Return flight, transfers"), accommodation: l("Hôtel 4*", "4* hotel"), meals: l("Petit-déjeuner", "Breakfast"),
    included: ["Vol aller-retour", "4 nuits en hôtel 4*", "Petit-déjeuner", "Visa des Émirats", "Safari désert avec dîner", "Dîner-croisière en dhow"], excluded: ["Entrée Burj Khalifa", "Dépenses personnelles"],
    itinerary: [{ title: "Jour 1", description: "Vol, arrivée." }, { title: "Jour 2", description: "Tour de ville, souks." }, { title: "Jour 3", description: "Safari dans le désert." }, { title: "Jour 4", description: "Journée libre, dîner-croisière." }, { title: "Jour 5", description: "Vol retour." }],
    stops: [stop(CASA, 1, "FLIGHT"), stop(P("Dubaï", 25.2048, 55.2708), 1, null)], departures: { weekly: { weekday: 4, weeks: 8 } }, capacity: 20,
  }),
  sim({
    slug: "egypte-caire-louxor-8j", destination: "egypte", type: "CIRCUIT", title: l("Égypte : Le Caire et croisière sur le Nil — 8 jours / 7 nuits", "Egypt: Cairo and Nile cruise — 8 days / 7 nights", "مصر: القاهرة ورحلة النيل — 8 أيام / 7 ليال"),
    summary: l("Pyramides de Gizeh, musée, puis croisière de Louxor à Assouan.", "Giza pyramids, museum, then a cruise from Luxor to Aswan."),
    days: 8, nights: 7, start: "Casablanca", end: "Casablanca", priceFrom: 12900,
    transport: l("Vols, croisière, transferts", "Flights, cruise, transfers"), accommodation: l("Hôtel 4* au Caire, bateau de croisière 5*", "4* hotel in Cairo, 5* cruise boat"), meals: l("Pension complète pendant la croisière", "Full board during the cruise"),
    included: ["Vols", "3 nuits au Caire", "4 nuits de croisière", "Visites guidées", "Transferts"], excluded: ["Visa", "Pourboires", "Dépenses personnelles"],
    itinerary: [{ title: "Jours 1 à 3 — Le Caire", description: "Pyramides, Sphinx, musée, Khan el-Khalili." }, { title: "Jours 4 à 7 — Croisière", description: "Louxor (Karnak, vallée des Rois), Edfou, Kom Ombo, Assouan." }, { title: "Jour 8", description: "Vol retour." }],
    stops: [stop(CASA, 1, "FLIGHT"), stop(P("Le Caire", 30.0444, 31.2357), 1, "FLIGHT"), stop(P("Louxor", 25.6872, 32.6396), 4, "SEA"), stop(P("Assouan", 24.0889, 32.8998), 7, null)], departures: { weekly: { weekday: 6, weeks: 8 } }, capacity: 20,
  }),
  sim({
    slug: "andalousie-7j", destination: "espagne-andalousie", type: "CIRCUIT", title: l("Andalousie, sur les traces d'Al-Andalus — 7 jours / 6 nuits", "Andalusia, in the footsteps of Al-Andalus — 7 days / 6 nights", "الأندلس على خطى التاريخ — 7 أيام / 6 ليال"),
    summary: l("Séville, Cordoue et Grenade avec l'Alhambra.", "Seville, Cordoba and Granada with the Alhambra."),
    days: 7, nights: 6, start: "Tanger", end: "Tanger", priceFrom: 9500,
    transport: l("Ferry depuis Tanger, autocar", "Ferry from Tangier, coach"), accommodation: l("Hôtels 3* et 4*", "3* and 4* hotels"), meals: l("Petit-déjeuner", "Breakfast"),
    included: ["Traversée en ferry", "6 nuits d'hôtel", "Petit-déjeuner", "Entrées Alhambra et mosquée-cathédrale", "Guide"], excluded: ["Visa Schengen", "Repas", "Dépenses personnelles"],
    warnings: ["Visa Schengen obligatoire pour les ressortissants marocains (non inclus)."],
    itinerary: [{ title: "Jour 1", description: "Ferry Tanger – Tarifa, route vers Séville." }, { title: "Jour 2", description: "Séville : Alcazar, cathédrale." }, { title: "Jour 3", description: "Cordoue : mosquée-cathédrale." }, { title: "Jours 4 et 5", description: "Grenade : Alhambra, Albaicín." }, { title: "Jour 6", description: "Malaga." }, { title: "Jour 7", description: "Retour en ferry." }],
    stops: [stop(P("Tanger", 35.7595, -5.834), 1, "SEA"), stop(P("Tarifa", 36.0143, -5.6044), 1, "DRIVE"), stop(P("Séville", 37.3891, -5.9845), 1, "DRIVE"), stop(P("Cordoue", 37.8882, -4.7794), 3, "DRIVE"), stop(P("Grenade", 37.1773, -3.5986), 4, null)],
    departures: { weekly: { weekday: 6, weeks: 8 } }, capacity: 20,
  }),
];
