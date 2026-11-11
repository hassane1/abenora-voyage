import { describe, expect, it } from "vitest";
import { buildProgram, computePrice, lengthLabel, onSiteKey, tripLength, type CitiesConfig, type DestConfig } from "./composer-engine";

const L = (s: string) => ({ fr: s, en: s, ar: s });
const LL = (a: string[]) => ({ fr: a, en: a, ar: a });
const cities: CitiesConfig = {
  cities: [
    { key: "casablanca", name: L("Casablanca"), lat: 33.5731, lon: -7.5898, airport: true },
    { key: "marrakech", name: L("Marrakech"), lat: 31.6295, lon: -7.9811, airport: true },
  ],
  roadKmh: 65,
  roadFactor: 1.3,
  longTripH: 7,
  transportBaseMad: 150,
  transportPerKmMad: 0.6,
};
const base = (mode: "ROAD" | "FLIGHT"): DestConfig => ({
  mode,
  onSite: true,
  durations: { min: 1, max: 7, default: 2 },
  ...(mode === "FLIGHT" ? { flight: { hours: 2, baseMad: 1800, extraNonCasaMad: 400, airports: ["casablanca"], note: L("vol"), travelDay: false } } : {}),
  lodging: [{ key: "confort", label: L("Confort"), hint: L(""), nightMad: 500 }],
  days: [{ title: L("Étape 1"), items: LL(["a"]) }, { title: L("Étape 2"), items: LL(["b"]) }],
  free: { title: L("Libre"), items: LL(["c"]) },
  options: [{ code: "quad", label: L("Quad"), priceMad: 400, duration: L("1 h"), level: "MODERE", audience: L("tous") }],
  seasons: L(""),
  tips: LL([]),
  photos: { steps: [] },
});
const merzouga = { lat: 31.099, lon: -4.0127 }; // ≈ 9 h de route depuis Casablanca
const marrakech = { lat: 31.6295, lon: -7.9811 };

describe("règle de durée : jours = nuits d'hôtel + 1 (+ 1 journée de trajet si trajet long)", () => {
  it("sur place : 2 nuits → 3 jours, sans journée de trajet", () => {
    const r = tripLength(cities, base("ROAD"), marrakech, onSiteKey, 2);
    expect(r).toMatchObject({ nights: 2, days: 3, travelDay: false });
  });
  it("même ville que la destination (Marrakech depuis Marrakech) : pas de trajet", () => {
    expect(tripLength(cities, base("ROAD"), marrakech, "marrakech", 2)).toMatchObject({ days: 3, travelDay: false });
  });
  it("trajet court (Marrakech → Casablanca ~4 h) : 2 nuits → 3 jours", () => {
    const r = tripLength(cities, base("ROAD"), { lat: 33.5731, lon: -7.5898 }, "marrakech", 2);
    expect(r.travel?.kind).toBe("ROAD");
    expect(r).toMatchObject({ days: 3, travelDay: false });
  });
  it("trajet long (Casablanca → Merzouga) : 2 nuits → 4 jours dont 1 journée de trajet", () => {
    const r = tripLength(cities, base("ROAD"), merzouga, "casablanca", 2);
    expect(r.travel!.hours).toBeGreaterThan(7);
    expect(r).toMatchObject({ nights: 2, days: 4, travelDay: true });
    expect(lengthLabel("fr", r.days, r.nights, r.travelDay)).toBe("4 jours · 2 nuits d'hôtel + 1 journée de trajet");
  });
  it("vol : pas de journée de trajet par défaut", () => {
    expect(tripLength(cities, base("FLIGHT"), { lat: 23.68, lon: -15.95 }, "casablanca", 4)).toMatchObject({ days: 5, travelDay: false });
  });
  it("le programme compte exactement le nombre de jours calculé", () => {
    for (const [pos, city, nights] of [[merzouga, "casablanca", 2], [marrakech, onSiteKey, 1], [merzouga, "marrakech", 5]] as const) {
      const len = tripLength(cities, base("ROAD"), pos, city, nights);
      expect(buildProgram(cities, base("ROAD"), pos, { city, nights, options: ["quad"] }, "fr")).toHaveLength(len.days);
    }
  });
  it("prix DÉMO : hébergement = nuits d'hôtel × tarif ; nuits hors limites refusées", () => {
    const c = { destination: "x", city: onSiteKey, nights: 2, travelers: 2, lodging: "confort", options: ["quad"] };
    const p = computePrice(cities, base("ROAD"), marrakech, c, "fr")!;
    expect(p.lines.find((l) => l.key === "lodging")!.amount).toBe(1000);
    expect(p.perPerson).toBe(1400);
    expect(p.total).toBe(2800);
    expect(computePrice(cities, base("ROAD"), marrakech, { ...c, nights: 9 }, "fr")).toBeNull();
    expect(computePrice(cities, base("ROAD"), marrakech, { ...c, options: ["inconnue"] }, "fr")).toBeNull();
  });
});
