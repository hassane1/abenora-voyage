import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { db } from "./db";
import { cached } from "./cache";
import { tr } from "./i18n-content";
import type { Locale } from "@/i18n/config";

/** Contenus éditables depuis Administration → Contenus (bannières, pages légales, FAQ générale, textes d'accueil) */

export type ActiveBanner = { text: string; linkUrl: string | null; linkLabel: string | null };

export async function getActiveBanner(locale: Locale): Promise<ActiveBanner | null> {
  await connection();
  const now = new Date();
  const b = await cached("banner", 60, () => db.banner.findFirst({
    where: { active: true, OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
    orderBy: { createdAt: "desc" },
  }));
  if (!b) return null;
  const text = tr<string>(b.text, locale, "");
  if (!text) return null;
  return { text, linkUrl: b.linkUrl, linkLabel: b.linkLabel ? tr<string>(b.linkLabel, locale, "") || null : null };
}

export async function getPage(slug: string) {
  await connection();
  return db.page.findFirst({ where: { slug, published: true } });
}

export const LEGAL_SLUGS = ["mentions-legales", "cgv", "confidentialite", "cookies", "annulation"] as const;

export type FaqItem = { q: Partial<Record<Locale, string>>; a: Partial<Record<Locale, string>> };

const getSettingsMap = cache(async () => {
  await connection();
  const rows = await cached("settings:content", 60, () => db.setting.findMany({ where: { key: { startsWith: "content." } } }));
  return Object.fromEntries(rows.map((r) => [r.key.slice(8), r.value])) as Record<string, string>;
});

export async function getGeneralFaq(): Promise<FaqItem[]> {
  const s = await getSettingsMap();
  try {
    const v = JSON.parse(s.faq ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Textes d'accueil surchargés par l'admin (sinon les textes par défaut des dictionnaires) */
export async function getHomeOverrides(locale: Locale) {
  const s = await getSettingsMap();
  return {
    heroTitle: s[`home.heroTitle.${locale}`] || null,
    heroSubtitle: s[`home.heroSubtitle.${locale}`] || null,
    heroVideo: s["home.heroVideo"] || null, // URL d'une vidéo réelle (MP4) téléversée dans Médias
  };
}
