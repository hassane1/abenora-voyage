import "server-only";
import { connection } from "next/server";
import { db } from "./db";
import { cached } from "./cache";
import { tr } from "./i18n-content";
import type { Locale } from "@/i18n/config";

/**
 * Attribution des photos aux emplacements du site.
 * Une photo n'est utilisée que si elle existe dans Médias avec rightsConfirmed = true et un texte alternatif.
 * Emplacements : étiquette « slot:<clé> » posée dans Administration → Médias
 * (ex. slot:hero, slot:destination:marrakech, slot:circuit:<slug>).
 * À défaut, la première photo rattachée à une destination sert pour « destination:<slug> ».
 * Sinon le visuel de marque prend le relais.
 */

/** sources exclues de l'affichage public (photos d'une autre agence) */
const EXCLUDED_CREDITS = [/super\s*morocco/i];
export const isAllowedMedia = (m: { credit: string | null; alt: unknown }) => !EXCLUDED_CREDITS.some((r) => r.test(m.credit ?? "")) && !!tr<string>(m.alt, "fr", "");
const allowed = isAllowedMedia;

export type Photo = { src: string; alt: string; credit: string | null };
export type PhotoPicker = (key: string) => Photo | undefined;

export async function getPhotos(locale: Locale): Promise<PhotoPicker> {
  await connection();
  const media = (await cached("media:images", 60, () => db.media.findMany({ where: { rightsConfirmed: true, kind: "IMAGE" }, include: { destination: { select: { slug: true } } }, orderBy: { createdAt: "asc" } }))).filter(allowed);
  const byDestination = new Map<string, (typeof media)[number]>();
  for (const m of media) if (m.destination && !byDestination.has(m.destination.slug)) byDestination.set(m.destination.slug, m);
  // une photo étiquetée « slot:<clé> » dans Médias remplace l'attribution par défaut (ex. slot:destination:marrakech)
  const bySlot = new Map<string, (typeof media)[number]>();
  for (const m of media) for (const t of m.tags.split(",").map((x) => x.trim())) if (t.startsWith("slot:") && !bySlot.has(t.slice(5))) bySlot.set(t.slice(5), m);
  return (key) => {
    const m = bySlot.get(key) ?? (key.startsWith("destination:") ? byDestination.get(key.slice(12)) : undefined);
    return m ? { src: m.url, alt: tr(m.alt, locale), credit: m.credit } : undefined;
  };
}

/** Toutes les photos publiques (galeries, mosaïques) */
export async function getAllPhotos(locale: Locale, tag?: string): Promise<Photo[]> {
  await connection();
  const media = await cached(`media:all:${tag ?? ""}`, 60, () => db.media.findMany({
    where: { rightsConfirmed: true, kind: "IMAGE", ...(tag ? { tags: { contains: tag } } : {}) },
    orderBy: { createdAt: "asc" },
  }));
  return media.filter(allowed).map((m) => ({ src: m.url, alt: tr(m.alt, locale), credit: m.credit }));
}
