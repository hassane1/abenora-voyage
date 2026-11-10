"use client";

import type { Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { useBrand } from "./BrandProvider";

/** Conversion INFORMATIVE en EUR / USD (taux saisis par l'agence) — n'apparaît que si un taux est renseigné */
export default function FxNote({ mad, locale }: { mad: number; locale: Locale }) {
  const { rates } = useBrand();
  if (!rates.eur && !rates.usd) return null;
  const fmt = (v: number, cur: string) => new Intl.NumberFormat(locale === "ar" ? "ar-MA" : locale === "en" ? "en-GB" : "fr-FR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v);
  const parts = [rates.eur && `≈ ${fmt(mad / rates.eur, "EUR")}`, rates.usd && `≈ ${fmt(mad / rates.usd, "USD")}`].filter(Boolean);
  return (
    <span className="mt-1 block text-xs text-muted" title={getV2(locale).currency.note(rates.date)}>
      {parts.join(" · ")} <span className="opacity-70">— {getV2(locale).currency.note(rates.date)}</span>
    </span>
  );
}
