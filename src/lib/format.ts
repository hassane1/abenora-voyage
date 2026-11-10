import { localeMeta, type Locale } from "@/i18n/config";

export function formatMad(amount: number, locale: Locale) {
  const n = new Intl.NumberFormat(localeMeta[locale].intl, { maximumFractionDigits: 0 }).format(amount);
  return locale === "ar" ? `${n} درهم` : `${n} MAD`;
}

export function formatDate(date: Date | string, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(localeMeta[locale].intl, { timeZone: "UTC", ...opts }).format(new Date(date));
}

/** Date ISO « AAAA-MM-JJ » en UTC */
export function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 86400000);
}
