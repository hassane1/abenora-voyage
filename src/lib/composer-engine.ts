/**
 * Moteur du configurateur « Créez votre voyage sur mesure » (fonctions pures, utilisables côté client et serveur).
 * Les données (villes de départ, étapes, options, tarifs DÉMO) sont stockées en base (table Setting, clés
 * « composer:cities » et « composer:<slug> ») et modifiables dans Administration → Configurateur.
 * Le prix affiché est TOUJOURS recalculé côté serveur avec ces mêmes fonctions.
 */
import { z } from "zod";

export type Lang = "fr" | "en" | "ar";
const L = z.object({ fr: z.string().max(400), en: z.string().max(400), ar: z.string().max(400) });
const LL = z.object({ fr: z.array(z.string().max(300)).max(12), en: z.array(z.string().max(300)).max(12), ar: z.array(z.string().max(300)).max(12) });
export type Text = z.infer<typeof L>;
export type TextList = z.infer<typeof LL>;

export const citySchema = z.object({
  key: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: L,
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  airport: z.boolean().default(false),
});
export const citiesConfigSchema = z.object({
  cities: z.array(citySchema).min(1).max(80),
  roadKmh: z.number().min(30).max(120).default(65), // vitesse moyenne sur route (temps de trajet approximatif)
  roadFactor: z.number().min(1).max(2).default(1.3), // distance routière ≈ distance à vol d'oiseau × facteur
  transferThresholdH: z.number().min(1).max(12).default(5), // au-delà : journée de transfert dédiée
  transportBaseMad: z.number().min(0).max(100000).default(150), // DÉMO : forfait transport aller-retour par personne
  transportPerKmMad: z.number().min(0).max(100).default(0.6), // DÉMO : par km (aller simple) et par personne
});
export type City = z.infer<typeof citySchema>;
export type CitiesConfig = z.infer<typeof citiesConfigSchema>;

const daySchema = z.object({ title: L, items: LL, photo: z.string().max(80).optional() });
export const destConfigSchema = z.object({
  mode: z.enum(["ROAD", "FLIGHT"]),
  onSite: z.boolean().default(true), // propose « Sur place à <destination> »
  durations: z.object({ min: z.number().int().min(1).max(15), max: z.number().int().min(1).max(15), default: z.number().int().min(1).max(15) }),
  flight: z.object({ hours: z.number().min(0.5).max(20), baseMad: z.number().min(0).max(100000), extraNonCasaMad: z.number().min(0).max(100000), airports: z.array(z.string()).max(20), note: L }).optional(),
  lodging: z.array(z.object({ key: z.string().max(30), label: L, hint: L, nightMad: z.number().min(0).max(100000) })).min(1).max(4),
  days: z.array(daySchema).min(1).max(12),
  free: daySchema,
  options: z.array(z.object({ code: z.string().regex(/^[a-z0-9-]{2,40}$/), label: L, priceMad: z.number().min(0).max(100000), duration: L, level: z.enum(["FACILE", "MODERE", "SPORTIF"]), audience: L })).max(10),
  seasons: L,
  tips: LL,
  photos: z.object({ main: z.string().max(80).optional(), steps: z.array(z.string().max(80)).max(6) }),
});
export type DestConfig = z.infer<typeof destConfigSchema>;

export type ComposerChoice = { destination: string; city: string; days: number; travelers: number; lodging: string; options: string[] };
export const choiceSchema = z.object({
  destination: z.string().regex(/^[a-z0-9-]{2,80}$/),
  city: z.string().regex(/^[a-z0-9-]{2,40}$/),
  days: z.number().int().min(1).max(15),
  travelers: z.number().int().min(1).max(30),
  lodging: z.string().max(30),
  options: z.array(z.string().max(40)).max(10),
});

const ONSITE = "sur-place";
export const onSiteKey = ONSITE;

/** distance à vol d'oiseau en km */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** trajet approximatif depuis une ville (route) ou un aéroport (vol) */
export function travelFrom(cfg: CitiesConfig, dest: DestConfig, destPos: { lat: number; lon: number }, cityKey: string) {
  if (cityKey === ONSITE) return { kind: "NONE" as const, hours: 0, km: 0 };
  const city = cfg.cities.find((c) => c.key === cityKey);
  if (!city) return null;
  if (dest.mode === "FLIGHT") return { kind: "FLIGHT" as const, hours: dest.flight?.hours ?? 4, km: 0, city };
  const km = Math.round(haversineKm(city, destPos) * cfg.roadFactor);
  // en dessous de 25 km : même agglomération, assimilé à « sur place »
  if (km < 25) return { kind: "NONE" as const, hours: 0, km: 0, city };
  const hours = Math.max(0.5, Math.round((km / cfg.roadKmh) * 2) / 2);
  return { kind: "ROAD" as const, hours, km, city };
}

/** villes proposées pour une destination : « sur place » (si pertinent) puis villes ou aéroports */
export function startCities(cfg: CitiesConfig, dest: DestConfig) {
  if (dest.mode === "FLIGHT") {
    const allowed = dest.flight?.airports?.length ? dest.flight.airports : cfg.cities.filter((c) => c.airport).map((c) => c.key);
    return cfg.cities.filter((c) => allowed.includes(c.key));
  }
  return cfg.cities;
}

const fmtH = (h: number, lang: Lang) => {
  const v = Number.isInteger(h) ? String(h) : String(h).replace(".", lang === "en" ? "." : ",");
  return lang === "ar" ? `حوالي ${v} ساعة` : lang === "en" ? `about ${v} h` : `environ ${v} h`;
};

const W = {
  fr: {
    transferDay: (c: string) => `Transfert depuis ${c}`,
    transferItems: (c: string, h: string) => [`Départ de ${c} le matin (${h} de route, pauses comprises)`, "Arrêts photo en chemin", "Installation et dîner"],
    arrival: (c: string, h: string) => `Arrivée depuis ${c} (${h} de route)`,
    flightDay: (c: string) => `Vol au départ de ${c}`,
    flightItems: (h: string) => [`Vol (${h}, selon la compagnie et l'escale éventuelle)`, "Accueil et transfert à l'hébergement", "Installation et temps libre"],
    back: (c: string) => `Retour vers ${c}`,
    backOnSite: "Fin du séjour",
    backItems: ["Petit-déjeuner", "Derniers moments sur place"],
    backTravel: (h: string) => `Trajet retour (${h})`,
    option: "option",
  },
  en: {
    transferDay: (c: string) => `Transfer from ${c}`,
    transferItems: (c: string, h: string) => [`Morning departure from ${c} (${h} by road, stops included)`, "Photo stops along the way", "Check-in and dinner"],
    arrival: (c: string, h: string) => `Arrival from ${c} (${h} by road)`,
    flightDay: (c: string) => `Flight from ${c}`,
    flightItems: (h: string) => [`Flight (${h}, depending on airline and any stopover)`, "Welcome and transfer to your accommodation", "Check-in and free time"],
    back: (c: string) => `Return to ${c}`,
    backOnSite: "End of the stay",
    backItems: ["Breakfast", "Last moments on site"],
    backTravel: (h: string) => `Return journey (${h})`,
    option: "option",
  },
  ar: {
    transferDay: (c: string) => `الانتقال من ${c}`,
    transferItems: (c: string, h: string) => [`الانطلاق من ${c} صباحاً (${h} بالطريق، مع التوقفات)`, "توقفات للتصوير في الطريق", "الاستقرار والعشاء"],
    arrival: (c: string, h: string) => `الوصول من ${c} (${h} بالطريق)`,
    flightDay: (c: string) => `رحلة جوية من ${c}`,
    flightItems: (h: string) => [`الرحلة الجوية (${h} حسب الشركة والتوقف المحتمل)`, "الاستقبال والنقل إلى مكان الإقامة", "الاستقرار ووقت حر"],
    back: (c: string) => `العودة إلى ${c}`,
    backOnSite: "نهاية الإقامة",
    backItems: ["الفطور", "آخر اللحظات في عين المكان"],
    backTravel: (h: string) => `طريق العودة (${h})`,
    option: "خيار",
  },
};

export type ProgramDay = { day: number; title: string; items: { text: string; tag?: string }[]; photo?: string };

/** programme jour par jour selon la ville de départ, la durée et les options choisies */
export function buildProgram(cfg: CitiesConfig, dest: DestConfig, destPos: { lat: number; lon: number }, c: Pick<ComposerChoice, "city" | "days" | "options">, lang: Lang): ProgramDay[] {
  const w = W[lang];
  const travel = travelFrom(cfg, dest, destPos, c.city);
  const cityName = travel && "city" in travel && travel.city ? travel.city.name[lang] : "";
  const n = Math.max(1, c.days);
  const out: ProgramDay[] = [];
  const stage = (i: number): ProgramDay => {
    const d = i < dest.days.length ? dest.days[i] : dest.free;
    return { day: 0, title: d.title[lang], items: d.items[lang].map((text) => ({ text })), photo: d.photo };
  };
  let stageIdx = 0;
  const separateTransfer = travel && travel.kind !== "NONE" && (travel.kind === "FLIGHT" || travel.hours > cfg.transferThresholdH) && n >= 3;
  if (travel && travel.kind !== "NONE") {
    const h = fmtH(travel.hours, lang);
    if (separateTransfer) {
      out.push(travel.kind === "FLIGHT" ? { day: 0, title: w.flightDay(cityName), items: w.flightItems(h).map((text) => ({ text })) } : { day: 0, title: w.transferDay(cityName), items: w.transferItems(cityName, h).map((text) => ({ text })) });
    } else {
      const first = stage(stageIdx++);
      first.items.unshift({ text: w.arrival(cityName, h) });
      out.push(first);
    }
  }
  // jours d'étapes, en gardant le dernier jour pour le retour (séjours de 2 jours et plus)
  const lastIsReturn = n >= 2;
  while (out.length < n - (lastIsReturn ? 1 : 0)) out.push(stage(stageIdx++));
  if (lastIsReturn) {
    const back: ProgramDay =
      travel && travel.kind !== "NONE"
        ? { day: 0, title: w.back(cityName), items: [...w.backItems.map((text) => ({ text })), { text: w.backTravel(fmtH(travel.hours, lang)) }] }
        : { day: 0, title: w.backOnSite, items: w.backItems.map((text) => ({ text })) };
    out.push(back);
  }
  if (out.length === 0) out.push(stage(0));
  // options réparties sur les jours d'étape (hors transfert et retour)
  const slots = out.filter((d, i) => !(separateTransfer && i === 0) && !(lastIsReturn && i === out.length - 1));
  const targets = slots.length ? slots : out;
  c.options.forEach((code, i) => {
    const o = dest.options.find((x) => x.code === code);
    if (o) targets[i % targets.length].items.push({ text: o.label[lang], tag: w.option });
  });
  out.forEach((d, i) => (d.day = i + 1));
  return out;
}

export type ComposerPrice = { isDemo: true; perPerson: number; total: number; lines: { key: string; label: string; amount: number }[] };

const P = {
  fr: { lodging: (l: string, n: number) => `Hébergement « ${l} » (${n} nuit${n > 1 ? "s" : ""}) et services de base`, transport: "Transport aller-retour (estimation)", flight: "Vol aller-retour (estimation)", option: (l: string) => l },
  en: { lodging: (l: string, n: number) => `“${l}” accommodation (${n} night${n > 1 ? "s" : ""}) and core services`, transport: "Return transport (estimate)", flight: "Return flight (estimate)", option: (l: string) => l },
  ar: { lodging: (l: string, n: number) => `الإقامة «${l}» (${n} ليالٍ) والخدمات الأساسية`, transport: "النقل ذهاباً وإياباً (تقدير)", flight: "الطيران ذهاباً وإياباً (تقدير)", option: (l: string) => l },
};
const round50 = (x: number) => Math.round(x / 50) * 50;

/** estimation DÉMO par personne puis pour le groupe ; renvoie null si un choix est invalide */
export function computePrice(cfg: CitiesConfig, dest: DestConfig, destPos: { lat: number; lon: number }, c: ComposerChoice, lang: Lang): ComposerPrice | null {
  const lodging = dest.lodging.find((l) => l.key === c.lodging);
  const travel = travelFrom(cfg, dest, destPos, c.city);
  if (!lodging || !travel) return null;
  if (c.days < dest.durations.min || c.days > dest.durations.max) return null;
  if (c.city === ONSITE && !dest.onSite) return null;
  if (travel.kind !== "NONE" && "city" in travel && travel.city && !startCities(cfg, dest).some((x) => x.key === travel.city!.key)) return null;
  const p = P[lang];
  const nights = Math.max(1, c.days - 1);
  const lines: ComposerPrice["lines"] = [{ key: "lodging", label: p.lodging(lodging.label[lang], nights), amount: round50(lodging.nightMad * nights) }];
  if (travel.kind === "ROAD") lines.push({ key: "transport", label: p.transport, amount: round50(cfg.transportBaseMad + travel.km * 2 * cfg.transportPerKmMad) });
  if (travel.kind === "FLIGHT" && dest.flight) lines.push({ key: "flight", label: p.flight, amount: round50(dest.flight.baseMad + (travel.city?.key === "casablanca" ? 0 : dest.flight.extraNonCasaMad)) });
  for (const code of new Set(c.options)) {
    const o = dest.options.find((x) => x.code === code);
    if (!o) return null;
    lines.push({ key: `option:${o.code}`, label: p.option(o.label[lang]), amount: round50(o.priceMad) });
  }
  const perPerson = lines.reduce((s, l) => s + l.amount, 0);
  return { isDemo: true, perPerson, total: perPerson * c.travelers, lines };
}
