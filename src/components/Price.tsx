import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMad } from "@/lib/format";
import FxNote from "./FxNote";

/** Affichage d'un prix avec son statut (démonstration / validé / sur devis) */
export function Price({
  amount,
  status,
  unit = "PER_PERSON",
  locale,
  size = "md",
  showFrom = true,
}: {
  amount: number | null;
  status: string;
  unit?: string;
  locale: Locale;
  size?: "sm" | "md" | "lg";
  showFrom?: boolean;
}) {
  const t = getDictionary(locale);
  if (amount === null || status === "ON_REQUEST") {
    return <span className="font-semibold text-night">{t.common.onRequest}</span>;
  }
  if (amount === 0) return <span className="font-semibold text-night">{t.common.free}</span>;
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  return (
    <span className="inline-flex flex-col">
      {showFrom && <span className="text-xs text-muted">{t.common.from}</span>}
      <span className={`font-display font-semibold text-night ${sizes[size]}`}>
        {formatMad(amount, locale)}
        <span className="ms-1 font-sans text-xs font-normal text-muted">{unit === "PER_GROUP" ? t.common.perGroup : t.common.perPerson}</span>
      </span>
      {size === "lg" && <FxNote mad={amount} locale={locale} />}
      {status !== "VALIDATED" && <DemoBadge locale={locale} status={status} />}
    </span>
  );
}

/** Mention à afficher pour un tarif non validé : fictif (DEMO) ou publié mais à confirmer (INDICATIVE) */
export function priceNote(locale: Locale, kind: string | null | undefined, long = false) {
  const t = getDictionary(locale);
  if (kind === "INDICATIVE") {
    const short = locale === "ar" ? "سعر منشور، يُؤكَّد" : locale === "en" ? "Published price, to be confirmed" : "Tarif publié, à confirmer";
    const full =
      locale === "ar"
        ? "سعر منشور من طرف الوكالة، يُؤكَّد عند تأكيد الملف (حسب توفر الأماكن والفنادق)."
        : locale === "en"
          ? "Price published by the agency, confirmed when your booking is confirmed (subject to availability of seats and hotels)."
          : "Tarif publié par l'agence, confirmé lors de la validation de votre dossier (sous réserve de disponibilité des places et des hôtels).";
    return long ? full : short;
  }
  return long ? t.common.demoPriceLong : t.common.demoPrice;
}

export function DemoBadge({ locale, long = false, status }: { locale: Locale; long?: boolean; status?: string }) {
  return (
    <span
      className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-terracotta/30 bg-terracotta/5 px-2 py-0.5 text-[11px] font-medium text-terracotta ${long ? "rounded-xl text-xs" : ""}`}
      title={priceNote(locale, status, true)}
    >
      ● {priceNote(locale, status, long)}
    </span>
  );
}
