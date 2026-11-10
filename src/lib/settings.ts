import "server-only";
import { db } from "./db";
import type { PricingSettings } from "./pricing";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const s = await getSettings();
  return {
    taxRatePercent: Number(s.taxRatePercent ?? 0),
    pricesIncludeTax: (s.pricesIncludeTax ?? "true") === "true",
    familyDiscountPercent: Number(s.familyDiscountPercent ?? 0),
    groupDiscountPercent: Number(s.groupDiscountPercent ?? 0),
    groupDiscountMinPeople: Number(s.groupDiscountMinPeople ?? 99),
  };
}
