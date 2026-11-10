import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMad } from "@/lib/format";

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
      {status !== "VALIDATED" && <DemoBadge locale={locale} />}
    </span>
  );
}

export function DemoBadge({ locale, long = false }: { locale: Locale; long?: boolean }) {
  const t = getDictionary(locale);
  return (
    <span
      className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-terracotta/30 bg-terracotta/5 px-2 py-0.5 text-[11px] font-medium text-terracotta ${long ? "rounded-xl text-xs" : ""}`}
      title={t.common.demoPriceLong}
    >
      ● {long ? t.common.demoPriceLong : t.common.demoPrice}
    </span>
  );
}
