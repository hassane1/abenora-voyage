/**
 * Moteur de calcul des prix — fonction pure, utilisée à l'identique côté client (aperçu)
 * et côté serveur (calcul faisant foi lors de l'enregistrement de la réservation).
 */

export type PricingCircuit = {
  pricingMode: string; // PER_PERSON | PER_GROUP
  priceAdultMad: number | null;
  childPricePercent: number;
  childFreeUnderAge: number;
  privateSupplementMad: number;
  depositPercent: number;
  nights: number;
  desertNights: number;
  priceStatus: string;
  /** grille hébergement × chambre (libellés déjà traduits) — remplace le prix adulte quand elle existe */
  priceGrid?: ResolvedGrid | null;
};

export type ResolvedGrid = { columns: { key: string; label: string }[]; rows: { label: string; detail: string; prices: Record<string, number | null> }[] };

/** Traduit une grille stockée en base ({ fr, en, ar }) pour la langue demandée ; null si absente ou invalide */
export function resolveGrid(raw: unknown, pick: (v: unknown) => string): ResolvedGrid | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as { columns?: { key: string; label: unknown }[]; rows?: { label: unknown; detail?: unknown; prices?: Record<string, number | null> }[] };
  if (!Array.isArray(g.columns) || !Array.isArray(g.rows) || !g.columns.length || !g.rows.length) return null;
  return {
    columns: g.columns.map((c) => ({ key: String(c.key), label: pick(c.label) })),
    rows: g.rows.map((r) => ({ label: pick(r.label), detail: r.detail ? pick(r.detail) : "", prices: r.prices ?? {} })),
  };
}

/** Plus petit prix de la grille (affichage « à partir de ») */
export function gridMin(g: ResolvedGrid | null): number | null {
  if (!g) return null;
  const all = g.rows.flatMap((r) => Object.values(r.prices)).filter((v): v is number => typeof v === "number" && v > 0);
  return all.length ? Math.min(...all) : null;
}

export type PricingOption = {
  code: string;
  label: string;
  priceMad: number;
  unit: string; // PER_PERSON | PER_BOOKING | PER_PERSON_NIGHT
  group: string;
  priceStatus: string;
};

export type PricingSettings = {
  taxRatePercent: number;
  pricesIncludeTax: boolean;
  familyDiscountPercent: number;
  groupDiscountPercent: number;
  groupDiscountMinPeople: number;
};

export type PricingInput = {
  adults: number;
  childAges: number[];
  privateTour: boolean;
  options: PricingOption[];
  promo?: { code: string; percentOff: number } | null;
  /** choix dans la grille : index de ligne (hébergement) et clé de colonne (chambre) */
  grid?: { row: number; col: string } | null;
};

export type PriceLine = { key: string; label: string; detail: string; amount: number };

export type PriceResult = {
  onRequest: boolean; // aucun tarif circuit défini → devis
  isDemo: boolean; // au moins un tarif non validé par l'admin
  /** nature du tarif non validé : DEMO (fictif) ou INDICATIVE (tarif publié, à confirmer) */
  noteKind?: "DEMO" | "INDICATIVE" | null;
  lines: PriceLine[];
  discounts: PriceLine[];
  subtotal: number;
  total: number;
  taxIncluded: number;
  taxRatePercent: number;
  deposit: number;
  balance: number;
  travelers: number;
};

export const CHILD_MAX_AGE = 11; // au-delà : tarif adulte

/** Nuits concernées par une option « par personne et par nuit » */
function nightsFor(option: PricingOption, c: PricingCircuit) {
  if (option.group === "HEBERGEMENT") return c.desertNights;
  // repas / guide : par jour de circuit
  return c.nights + 1;
}

export function computePrice(c: PricingCircuit, input: PricingInput, s: PricingSettings, labels: PricingLabels = defaultLabels): PriceResult {
  const adults = Math.max(0, Math.floor(input.adults));
  const ages = input.childAges.map((a) => Math.max(0, Math.floor(a)));
  const travelers = adults + ages.length;
  const lines: PriceLine[] = [];
  const discounts: PriceLine[] = [];
  let isDemo = c.priceStatus !== "VALIDATED";

  // programme à grille (ex. Omra) : prix par personne selon l'hébergement et le type de chambre
  const grid = c.priceGrid ?? null;
  if (grid) {
    const row = input.grid ? grid.rows[input.grid.row] : undefined;
    const col = input.grid ? grid.columns.find((x) => x.key === input.grid!.col) : undefined;
    const per = row && col ? row.prices[col.key] : null;
    if (typeof per !== "number" || per <= 0) {
      return { onRequest: true, isDemo, noteKind: c.priceStatus === "INDICATIVE" ? "INDICATIVE" : isDemo ? "DEMO" : null, lines, discounts, subtotal: 0, total: 0, taxIncluded: 0, taxRatePercent: s.taxRatePercent, deposit: 0, balance: 0, travelers };
    }
    lines.push({ key: "grid", label: `${row!.label} — ${col!.label}`, detail: `${travelers} × ${per}`, amount: travelers * per });
  } else if (c.priceAdultMad === null) {
    return { onRequest: true, isDemo, noteKind: c.priceStatus === "INDICATIVE" ? "INDICATIVE" : isDemo ? "DEMO" : null, lines, discounts, subtotal: 0, total: 0, taxIncluded: 0, taxRatePercent: s.taxRatePercent, deposit: 0, balance: 0, travelers };
  }
  const base = c.priceAdultMad ?? 0;
  if (grid) {
    // déjà calculé ci-dessus
  } else if (c.pricingMode === "PER_GROUP") {
    lines.push({ key: "base", label: labels.groupPrice, detail: `1 × ${base}`, amount: base });
  } else {
    const teens = ages.filter((a) => a > CHILD_MAX_AGE).length;
    const payingAdults = adults + teens;
    lines.push({ key: "adults", label: labels.adults, detail: `${payingAdults} × ${base}`, amount: payingAdults * base });
    const kids = ages.filter((a) => a >= c.childFreeUnderAge && a <= CHILD_MAX_AGE).length;
    const kidPrice = Math.round((base * c.childPricePercent) / 100);
    if (kids > 0) lines.push({ key: "children", label: labels.children(c.childPricePercent), detail: `${kids} × ${kidPrice}`, amount: kids * kidPrice });
    const babies = ages.filter((a) => a < c.childFreeUnderAge).length;
    if (babies > 0) lines.push({ key: "babies", label: labels.babies(c.childFreeUnderAge), detail: `${babies} × 0`, amount: 0 });
  }

  if (input.privateTour && c.privateSupplementMad > 0) {
    lines.push({ key: "private", label: labels.privateTour, detail: `${travelers} × ${c.privateSupplementMad}`, amount: travelers * c.privateSupplementMad });
  }

  for (const o of input.options) {
    if (o.priceStatus !== "VALIDATED") isDemo = true;
    let qty = 1;
    let detail = "";
    if (o.unit === "PER_PERSON") {
      qty = travelers;
      detail = `${travelers} × ${o.priceMad}`;
    } else if (o.unit === "PER_PERSON_NIGHT") {
      const n = nightsFor(o, c);
      qty = travelers * n;
      detail = `${travelers} × ${n} × ${o.priceMad}`;
    } else {
      detail = `1 × ${o.priceMad}`;
    }
    lines.push({ key: `opt:${o.code}`, label: o.label, detail, amount: qty * o.priceMad });
  }

  const gross = lines.reduce((sum, l) => sum + l.amount, 0);

  // Réductions : la plus avantageuse entre famille et groupe (non cumulables)
  const childCount = ages.filter((a) => a <= CHILD_MAX_AGE).length;
  const family = adults >= 2 && childCount >= 2 ? s.familyDiscountPercent : 0;
  const group = travelers >= s.groupDiscountMinPeople ? s.groupDiscountPercent : 0;
  let afterDiscount = gross;
  if (family > 0 || group > 0) {
    const pct = Math.max(family, group);
    const amount = -Math.round((gross * pct) / 100);
    discounts.push({ key: family >= group ? "family" : "group", label: family >= group ? labels.family(pct) : labels.group(pct), detail: `-${pct} %`, amount });
    afterDiscount += amount;
  }
  if (input.promo && input.promo.percentOff > 0) {
    const amount = -Math.round((afterDiscount * input.promo.percentOff) / 100);
    discounts.push({ key: "promo", label: labels.promo(input.promo.code), detail: `-${input.promo.percentOff} %`, amount });
    afterDiscount += amount;
  }

  const subtotal = Math.max(0, afterDiscount);
  const rate = s.taxRatePercent / 100;
  const total = s.pricesIncludeTax ? subtotal : Math.round(subtotal * (1 + rate));
  const taxIncluded = rate > 0 ? Math.round(total - total / (1 + rate)) : 0;
  const deposit = Math.round((total * c.depositPercent) / 100);

  const statuses = [c.priceStatus, ...input.options.map((o) => o.priceStatus)];
  const noteKind = statuses.includes("DEMO") ? "DEMO" : statuses.includes("INDICATIVE") ? "INDICATIVE" : null;
  return { onRequest: false, isDemo, noteKind, lines, discounts, subtotal, total, taxIncluded, taxRatePercent: s.taxRatePercent, deposit, balance: total - deposit, travelers };
}

export type PricingLabels = {
  adults: string;
  groupPrice: string;
  children: (pct: number) => string;
  babies: (age: number) => string;
  privateTour: string;
  family: (pct: number) => string;
  group: (pct: number) => string;
  promo: (code: string) => string;
};

export const defaultLabels: PricingLabels = {
  adults: "Adultes (12 ans et +)",
  groupPrice: "Forfait groupe",
  children: (pct) => `Enfants 4-11 ans (${pct} %)`,
  babies: (age) => `Enfants de moins de ${age} ans (gratuit)`,
  privateTour: "Supplément voyage privé",
  family: (pct) => `Réduction famille (${pct} %)`,
  group: (pct) => `Réduction groupe (${pct} %)`,
  promo: (code) => `Code promo ${code}`,
};
