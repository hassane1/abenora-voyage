export const locales = ["fr", "en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const localeMeta: Record<Locale, { label: string; short: string; dir: "ltr" | "rtl"; intl: string }> = {
  fr: { label: "Français", short: "FR", dir: "ltr", intl: "fr-FR" },
  en: { label: "English", short: "EN", dir: "ltr", intl: "en-GB" },
  ar: { label: "العربية", short: "AR", dir: "rtl", intl: "ar-MA" },
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
