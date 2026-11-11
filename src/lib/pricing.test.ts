import { describe, expect, it } from "vitest";
import { computePrice, gridMin, resolveGrid, type PricingCircuit, type PricingOption, type PricingSettings, type ResolvedGrid } from "./pricing";

const circuit = (over: Partial<PricingCircuit> = {}): PricingCircuit => ({
  pricingMode: "PER_PERSON",
  priceAdultMad: 1000,
  childPricePercent: 50,
  childFreeUnderAge: 4,
  privateSupplementMad: 300,
  depositPercent: 30,
  nights: 5,
  desertNights: 1,
  priceStatus: "VALIDATED",
  ...over,
});

const settings = (over: Partial<PricingSettings> = {}): PricingSettings => ({
  taxRatePercent: 0,
  pricesIncludeTax: true,
  familyDiscountPercent: 10,
  groupDiscountPercent: 5,
  groupDiscountMinPeople: 10,
  ...over,
});

const opt = (over: Partial<PricingOption> = {}): PricingOption => ({
  code: "OPT",
  label: "Option",
  priceMad: 200,
  unit: "PER_PERSON",
  group: "ACTIVITE",
  priceStatus: "VALIDATED",
  ...over,
});

const input = (adults: number, childAges: number[] = [], over: Partial<Parameters<typeof computePrice>[1]> = {}) => ({
  adults,
  childAges,
  privateTour: false,
  options: [] as PricingOption[],
  promo: null,
  grid: null,
  ...over,
});

const line = (r: ReturnType<typeof computePrice>, key: string) => r.lines.find((l) => l.key === key);

describe("computePrice — prix par personne", () => {
  it("adultes seuls : prix × nombre d'adultes, acompte et solde", () => {
    const r = computePrice(circuit(), input(2), settings());
    expect(r.onRequest).toBe(false);
    expect(r.isDemo).toBe(false);
    expect(r.noteKind).toBeNull();
    expect(r.travelers).toBe(2);
    expect(line(r, "adults")?.amount).toBe(2000);
    expect(r.subtotal).toBe(2000);
    expect(r.total).toBe(2000);
    expect(r.deposit).toBe(600);
    expect(r.balance).toBe(1400);
    expect(r.discounts).toEqual([]);
  });

  it("enfants 4-11 ans au pourcentage du prix adulte", () => {
    const r = computePrice(circuit(), input(2, [8]), settings());
    expect(line(r, "children")?.amount).toBe(500);
    expect(line(r, "children")?.detail).toBe("1 × 500");
    expect(r.total).toBe(2500);
  });

  it("au-delà de 11 ans, l'enfant paie le tarif adulte", () => {
    const r = computePrice(circuit(), input(1, [14]), settings());
    expect(line(r, "adults")?.amount).toBe(2000);
    expect(line(r, "children")).toBeUndefined();
    expect(r.total).toBe(2000);
  });

  it("bébé sous l'âge limite gratuit ; à l'âge limite il paie le tarif enfant", () => {
    const baby = computePrice(circuit(), input(1, [2]), settings());
    expect(line(baby, "babies")?.amount).toBe(0);
    expect(line(baby, "children")).toBeUndefined();
    expect(baby.total).toBe(1000);
    expect(baby.travelers).toBe(2);

    const four = computePrice(circuit(), input(1, [4]), settings());
    expect(line(four, "babies")).toBeUndefined();
    expect(line(four, "children")?.amount).toBe(500);
  });

  it("forfait groupe (PER_GROUP) : prix unique quel que soit le nombre", () => {
    const r = computePrice(circuit({ pricingMode: "PER_GROUP", priceAdultMad: 5000 }), input(4, [6]), settings());
    expect(r.lines).toHaveLength(1);
    expect(line(r, "base")?.amount).toBe(5000);
    expect(r.total).toBe(5000);
  });

  it("sans prix adulte ni grille : sur demande", () => {
    const r = computePrice(circuit({ priceAdultMad: null }), input(2), settings());
    expect(r.onRequest).toBe(true);
    expect(r.total).toBe(0);
    expect(r.travelers).toBe(2);
  });
});

describe("computePrice — supplément privé et options", () => {
  it("supplément privé par voyageur", () => {
    const r = computePrice(circuit(), input(2, [8], { privateTour: true }), settings());
    expect(line(r, "private")?.amount).toBe(900);
    expect(r.total).toBe(2500 + 900);
  });

  it("pas de ligne privée si le supplément est nul", () => {
    const r = computePrice(circuit({ privateSupplementMad: 0 }), input(2, [], { privateTour: true }), settings());
    expect(line(r, "private")).toBeUndefined();
    expect(r.total).toBe(2000);
  });

  it("option PER_PERSON multipliée par le nombre de voyageurs", () => {
    const r = computePrice(circuit(), input(2, [8], { options: [opt({ code: "QUAD", priceMad: 200, unit: "PER_PERSON" })] }), settings());
    expect(line(r, "opt:QUAD")?.amount).toBe(600);
    expect(r.total).toBe(2500 + 600);
  });

  it("option PER_BOOKING comptée une seule fois", () => {
    const r = computePrice(circuit(), input(3, [], { options: [opt({ code: "TRANSFERT", priceMad: 500, unit: "PER_BOOKING" })] }), settings());
    expect(line(r, "opt:TRANSFERT")?.amount).toBe(500);
    expect(line(r, "opt:TRANSFERT")?.detail).toBe("1 × 500");
    expect(r.total).toBe(3500);
  });

  it("option PER_PERSON_NIGHT : nuits désert pour l'hébergement, jours de circuit sinon", () => {
    const hotel = computePrice(circuit(), input(2, [], { options: [opt({ code: "LUXE", priceMad: 100, unit: "PER_PERSON_NIGHT", group: "HEBERGEMENT" })] }), settings());
    expect(line(hotel, "opt:LUXE")?.amount).toBe(2 * 1 * 100);
    const meal = computePrice(circuit(), input(2, [], { options: [opt({ code: "REPAS", priceMad: 100, unit: "PER_PERSON_NIGHT", group: "REPAS" })] }), settings());
    expect(line(meal, "opt:REPAS")?.amount).toBe(2 * 6 * 100);
  });

  it("une option non validée rend le prix indicatif", () => {
    const r = computePrice(circuit(), input(2, [], { options: [opt({ priceStatus: "INDICATIVE" })] }), settings());
    expect(r.isDemo).toBe(true);
    expect(r.noteKind).toBe("INDICATIVE");
  });

  it("circuit en tarif de démonstration", () => {
    const r = computePrice(circuit({ priceStatus: "DEMO" }), input(2), settings());
    expect(r.isDemo).toBe(true);
    expect(r.noteKind).toBe("DEMO");
  });
});

describe("computePrice — remises", () => {
  it("remise famille : 2 adultes et 2 enfants ou plus", () => {
    const r = computePrice(circuit(), input(2, [5, 8]), settings());
    expect(r.discounts).toHaveLength(1);
    expect(r.discounts[0].key).toBe("family");
    expect(r.discounts[0].amount).toBe(-300);
    expect(r.total).toBe(2700);
  });

  it("pas de remise famille avec un seul enfant", () => {
    const r = computePrice(circuit(), input(2, [8]), settings());
    expect(r.discounts).toEqual([]);
  });

  it("remise groupe à partir du seuil", () => {
    const r = computePrice(circuit(), input(10), settings());
    expect(r.discounts[0].key).toBe("group");
    expect(r.discounts[0].amount).toBe(-500);
    expect(r.total).toBe(9500);
    expect(computePrice(circuit(), input(9), settings()).discounts).toEqual([]);
  });

  it("famille et groupe non cumulables : la plus avantageuse s'applique", () => {
    const r = computePrice(circuit(), input(8, [5, 8]), settings());
    expect(r.discounts).toHaveLength(1);
    expect(r.discounts[0].key).toBe("family");
    expect(r.discounts[0].amount).toBe(-900);

    const g = computePrice(circuit(), input(8, [5, 8]), settings({ groupDiscountPercent: 15 }));
    expect(g.discounts[0].key).toBe("group");
    expect(g.discounts[0].amount).toBe(-1350);
  });

  it("code promo appliqué seul", () => {
    const r = computePrice(circuit(), input(2, [], { promo: { code: "ETE10", percentOff: 10 } }), settings());
    expect(r.discounts).toEqual([expect.objectContaining({ key: "promo", amount: -200 })]);
    expect(r.total).toBe(1800);
  });

  it("code promo appliqué après la remise famille", () => {
    const r = computePrice(circuit(), input(2, [5, 8], { promo: { code: "ETE10", percentOff: 10 } }), settings());
    expect(r.discounts.map((d) => [d.key, d.amount])).toEqual([
      ["family", -300],
      ["promo", -270],
    ]);
    expect(r.total).toBe(2430);
  });

  it("code promo à 0 % ignoré", () => {
    const r = computePrice(circuit(), input(2, [], { promo: { code: "ZERO", percentOff: 0 } }), settings());
    expect(r.discounts).toEqual([]);
  });
});

describe("computePrice — acompte et TVA", () => {
  it("acompte arrondi et solde complémentaire", () => {
    const r = computePrice(circuit({ depositPercent: 33 }), input(1, [8]), settings());
    expect(r.total).toBe(1500);
    expect(r.deposit).toBe(495);
    expect(r.balance).toBe(1005);
    expect(r.deposit + r.balance).toBe(r.total);
  });

  it("prix hors taxe : la TVA s'ajoute au total", () => {
    const r = computePrice(circuit(), input(1), settings({ taxRatePercent: 20, pricesIncludeTax: false }));
    expect(r.subtotal).toBe(1000);
    expect(r.total).toBe(1200);
    expect(r.taxIncluded).toBe(200);
    expect(r.deposit).toBe(360);
  });

  it("prix TTC : la TVA est incluse dans le total", () => {
    const r = computePrice(circuit(), input(1, [], {}), settings({ taxRatePercent: 20, pricesIncludeTax: true }));
    expect(r.total).toBe(1000);
    expect(r.taxIncluded).toBe(167);
  });
});

describe("computePrice — grille hôtel × chambre", () => {
  const grid: ResolvedGrid = {
    columns: [
      { key: "double", label: "Double" },
      { key: "triple", label: "Triple" },
    ],
    rows: [
      { label: "Hôtel A", detail: "", prices: { double: 15000, triple: null } },
      { label: "Hôtel B", detail: "", prices: { double: 12000, triple: 10000 } },
    ],
  };

  it("cellule valide : prix par voyageur, enfants compris", () => {
    const r = computePrice(circuit({ priceAdultMad: null, priceGrid: grid }), input(2, [8], { grid: { row: 1, col: "triple" } }), settings());
    expect(r.onRequest).toBe(false);
    expect(r.lines).toHaveLength(1);
    expect(line(r, "grid")?.label).toBe("Hôtel B — Triple");
    expect(line(r, "grid")?.amount).toBe(30000);
    expect(r.total).toBe(30000);
  });

  it("cellule vide, ligne absente, colonne inconnue ou aucun choix → sur demande", () => {
    const c = circuit({ priceAdultMad: null, priceGrid: grid });
    expect(computePrice(c, input(2, [], { grid: { row: 0, col: "triple" } }), settings()).onRequest).toBe(true);
    expect(computePrice(c, input(2, [], { grid: { row: 5, col: "double" } }), settings()).onRequest).toBe(true);
    expect(computePrice(c, input(2, [], { grid: { row: 0, col: "quad" } }), settings()).onRequest).toBe(true);
    const none = computePrice(c, input(2), settings());
    expect(none.onRequest).toBe(true);
    expect(none.total).toBe(0);
  });

  it("resolveGrid et gridMin", () => {
    const g = resolveGrid(
      { columns: [{ key: "double", label: { fr: "Double" } }], rows: [{ label: { fr: "Hôtel" }, prices: { double: 9000 } }] },
      (v) => (v as { fr: string }).fr,
    );
    expect(g).toEqual({ columns: [{ key: "double", label: "Double" }], rows: [{ label: "Hôtel", detail: "", prices: { double: 9000 } }] });
    expect(resolveGrid(null, String)).toBeNull();
    expect(resolveGrid({ columns: [], rows: [] }, String)).toBeNull();
    expect(gridMin(grid)).toBe(10000);
    expect(gridMin(null)).toBeNull();
  });
});
