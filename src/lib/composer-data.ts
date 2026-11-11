import "server-only";
import { connection } from "next/server";
import { db } from "./db";
import { cached } from "./cache";
import { tr } from "./i18n-content";
import { getPhotos } from "./photos";
import type { Locale } from "@/i18n/config";
import { citiesConfigSchema, destConfigSchema, type CitiesConfig, type DestConfig } from "./composer-engine";

/**
 * Données du configurateur « Créez votre voyage sur mesure », lues en base (table Setting) :
 * - « composer:cities » : villes de départ et paramètres de trajet / transport (DÉMO) ;
 * - « composer:<slug> » : programme, options, hébergements et tarifs DÉMO de chaque destination.
 * Modifiables dans Administration → Configurateur ; chargement initial : npm run db:composer.
 */
export async function loadCitiesConfig(): Promise<CitiesConfig | null> {
  const row = await cached("composer:cities", 60, () => db.setting.findUnique({ where: { key: "composer:cities" } }));
  if (!row) return null;
  const parsed = citiesConfigSchema.safeParse(JSON.parse(row.value));
  return parsed.success ? parsed.data : null;
}

export async function loadDestConfig(slug: string): Promise<DestConfig | null> {
  const row = await cached(`composer:${slug}`, 60, () => db.setting.findUnique({ where: { key: `composer:${slug}` } }));
  if (!row) return null;
  const parsed = destConfigSchema.safeParse(JSON.parse(row.value));
  return parsed.success ? parsed.data : null;
}

export type ComposerDestination = { slug: string; name: string; scope: "NATIONAL" | "INTERNATIONAL" };

/** liste des destinations proposées (toutes celles qui ont un programme valide) et destination par défaut */
export async function getComposerData(locale: Locale, preferred?: string): Promise<{ destinations: ComposerDestination[]; initial: ComposerDestinationData | null }> {
  await connection();
  const [destinations, rows] = await Promise.all([
    db.destination.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
    cached("composer:keys", 60, () => db.setting.findMany({ where: { key: { startsWith: "composer:" } }, select: { key: true } })),
  ]);
  const keys = new Set(rows.map((r) => r.key));
  const list = destinations
    .filter((d) => keys.has(`composer:${d.slug}`))
    .map((d) => ({ slug: d.slug, name: tr<string>(d.name, locale, d.slug), scope: d.scope === "INTERNATIONAL" ? ("INTERNATIONAL" as const) : ("NATIONAL" as const) }));
  const initialSlug = list.find((d) => d.slug === preferred)?.slug ?? list.find((d) => d.slug === "merzouga")?.slug ?? list[0]?.slug ?? null;
  return { destinations: list, initial: initialSlug ? await getComposerDestination(initialSlug, locale) : null };
}

/** données complètes d'une destination pour le configurateur (programme, villes autorisées, photos) */
export async function getComposerDestination(slug: string, locale: Locale) {
  const [dest, cfg, cities, photo] = await Promise.all([
    db.destination.findFirst({ where: { slug, published: true } }),
    loadDestConfig(slug),
    loadCitiesConfig(),
    getPhotos(locale),
  ]);
  if (!dest || !cfg || !cities) return null;
  const pic = (key?: string) => (key ? photo(key) : undefined);
  const steps = cfg.photos.steps.map((k) => pic(k)).filter((p) => !!p);
  return {
    slug,
    name: tr<string>(dest.name, locale, slug),
    scope: dest.scope,
    pos: { lat: dest.latitude, lon: dest.longitude },
    config: cfg,
    cities,
    photos: { main: pic(cfg.photos.main) ?? photo(`destination:${slug}`) ?? null, steps, byKey: Object.fromEntries([...cfg.days.map((d) => d.photo), ...cfg.photos.steps].filter((k): k is string => !!k).map((k) => [k, pic(k) ?? null])) },
  };
}
export type ComposerDestinationData = NonNullable<Awaited<ReturnType<typeof getComposerDestination>>>;
