import "server-only";
import { connection } from "next/server";
import { db } from "./db";
import { tr } from "./i18n-content";
import type { Locale } from "@/i18n/config";

/**
 * Attribution des photos aux emplacements du site.
 * Une photo n'est utilisée que si elle existe dans Médias avec rightsConfirmed = true
 * (l'administrateur peut donc la retirer à tout moment) ; sinon l'illustration vectorielle prend le relais.
 */
const SLOTS: Record<string, string> = {
  hero: "2024-03-Design-sans-titre-8-1.webp",
  heroAlt: "2024-03-Merzouga.png",
  merzouga: "2024-03-Merzouga.png",
  dunes: "2021-09-4-6.webp",
  camp: "2021-09-5-6.webp",
  campLuxe: "2021-09-5-6.webp",
  camel: "2021-09-5.png",
  tea: "2021-09-4.png",
  palm: "2021-09-5-5.webp",
  valley: "2021-09-6-4.webp",
  aitbenhaddou: "2024-03-Super-morocco-travels-10.jpg",
  aitReflection: "2021-09-2-5.webp",
  aitPalm: "2021-09-3-5.webp",
  aitGuide: "2021-09-4-5.webp",
  aitAerial: "2021-09-2-6.webp",
  // destinations (cartes « Destinations incontournables »)
  "destination:merzouga": "2024-03-Merzouga.png",
  "destination:ouarzazate": "2024-03-Super-morocco-travels-10.jpg",
  "destination:vallee-dades": "2021-09-6-4.webp",
  // circuits
  "circuit:escapade-saharienne-2j": "2021-09-5-6.webp",
  "circuit:immersion-desert-3j": "2024-03-Merzouga.png",
  "circuit:grand-sud-marocain-4j": "2024-03-Super-morocco-travels-10.jpg",
  // jours de programme
  "day:escapade-saharienne-2j:1": "2021-09-5.png",
  "day:escapade-saharienne-2j:2": "2021-09-4-6.webp",
  "day:immersion-desert-3j:1": "2024-03-Merzouga.png",
  "day:immersion-desert-3j:2": "2021-09-5-5.webp",
  "day:immersion-desert-3j:3": "2024-03-Design-sans-titre-8-1.webp",
  "day:grand-sud-marocain-4j:1": "2021-09-2-5.webp",
  "day:grand-sud-marocain-4j:2": "2021-09-6-4.webp",
  "day:grand-sud-marocain-4j:3": "2024-03-Merzouga.png",
  "day:grand-sud-marocain-4j:4": "2021-09-5-5.webp",
  // activités
  "activity:dromadaire-coucher-soleil": "2021-09-5.png",
  "activity:quad-desert": "2021-09-4-6.webp",
  "activity:sandboard": "2024-03-Design-sans-titre-8-1.webp",
  "activity:randonnee-guidee": "2021-09-4-6.webp",
  "activity:4x4-chauffeur": "2024-03-Merzouga.png",
  "activity:rissani-souk": "2021-09-6-4.webp",
  "activity:oasis": "2021-09-5-5.webp",
  "activity:degustation": "2021-09-4.png",
  "activity:bivouac-traditionnel": "2021-09-5-6.webp",
  "activity:campement-luxe": "2021-09-5-6.webp",
  "activity:diner-etoiles": "2021-09-4.png",
  "activity:lever-soleil": "2024-03-Design-sans-titre-8-1.webp",
  "activity:seance-photo": "2024-03-Design-sans-titre-8-1.webp",
};

export type Photo = { src: string; alt: string; credit: string | null };
export type PhotoPicker = (key: string) => Photo | undefined;

export async function getPhotos(locale: Locale): Promise<PhotoPicker> {
  await connection();
  const media = await db.media.findMany({ where: { rightsConfirmed: true, kind: "IMAGE" } });
  const byFile = new Map(media.map((m) => [m.url.split("/").pop()!, m]));
  // une photo étiquetée « slot:<clé> » dans Médias remplace l'attribution par défaut (ex. slot:destination:marrakech)
  const bySlot = new Map<string, (typeof media)[number]>();
  for (const m of media) for (const t of m.tags.split(",").map((x) => x.trim())) if (t.startsWith("slot:") && !bySlot.has(t.slice(5))) bySlot.set(t.slice(5), m);
  return (key) => {
    const file = SLOTS[key];
    const m = bySlot.get(key) ?? (file ? byFile.get(file) : undefined);
    return m ? { src: m.url, alt: tr(m.alt, locale), credit: m.credit } : undefined;
  };
}

/** Toutes les photos publiques (galeries, mosaïques) */
export async function getAllPhotos(locale: Locale, tag?: string): Promise<Photo[]> {
  await connection();
  const media = await db.media.findMany({
    // sans tag : photos du désert et du Grand Sud uniquement (on écarte les vues côtières)
    where: { rightsConfirmed: true, kind: "IMAGE", ...(tag ? { tags: { contains: tag } } : { NOT: { tags: { contains: "coast" } } }) },
    orderBy: { createdAt: "asc" },
  });
  return media.map((m) => ({ src: m.url, alt: tr(m.alt, locale), credit: m.credit }));
}
