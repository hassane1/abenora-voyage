import type { Locale } from "@/i18n/config";

/** Champ traduisible stocké en base : { fr, en, ar } */
export type Localized<T = string> = Partial<Record<Locale, T>>;

/** Renvoie la traduction demandée, sinon le français, sinon la première disponible. */
export function tr<T = string>(value: unknown, locale: Locale, fallback?: T): T {
  if (value === null || value === undefined) return fallback as T;
  if (typeof value !== "object" || Array.isArray(value)) return value as T;
  const v = value as Localized<T>;
  const hit = v[locale];
  if (hit !== undefined && hit !== null && !(typeof hit === "string" && hit === "") && !(Array.isArray(hit) && hit.length === 0)) return hit;
  if (v.fr !== undefined) return v.fr;
  const first = Object.values(v)[0];
  return (first ?? fallback) as T;
}

export function trList(value: unknown, locale: Locale): string[] {
  return tr<string[]>(value, locale, []) ?? [];
}

/** true si le contenu n'existe pas dans la langue demandée (affiché en français) */
export function isFallback(value: unknown, locale: Locale): boolean {
  if (!value || typeof value !== "object") return false;
  const v = (value as Localized<unknown>)[locale];
  return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}
