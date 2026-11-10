import "server-only";
import { db } from "./db";
import { tr, trList } from "./i18n-content";
import type { Locale } from "@/i18n/config";
import type { ComposerActivity, ComposerCircuit, ComposerDestination } from "@/components/TripComposer";

const COMPOSER_CODES = ["camel", "quad", "4x4", "sandboard", "dinner", "gnawa", "stars"];

/** Données du module « Composez votre aventure » (circuits publiés de Merzouga + activités réservables) */
export async function getComposerData(locale: Locale): Promise<{
  circuits: ComposerCircuit[];
  activities: ComposerActivity[];
  destinations: ComposerDestination[];
  luxePrice: number | null;
  previewImage: string | null;
}> {
  const [circuits, activities, destinations, luxe, preview] = await Promise.all([
    db.circuit.findMany({
      where: { published: true, destination: { slug: "merzouga", published: true } },
      include: { itinerary: { orderBy: { dayNumber: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.activity.findMany({ where: { published: true, bookingOptionCode: { in: COMPOSER_CODES } } }),
    db.destination.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { circuits: { where: { published: true } } } } } }),
    db.bookingOption.findFirst({ where: { code: "camp-luxe", published: true } }),
    db.media.findFirst({ where: { rightsConfirmed: true, kind: "IMAGE", tags: { contains: "hero" } } }),
  ]);
  return {
    circuits: circuits.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: tr(c.title, locale),
      days: c.days,
      nights: c.nights,
      itinerary: c.itinerary.map((d) => ({ day: d.dayNumber, title: tr(d.title, locale), items: trList(d.items, locale) })),
    })),
    activities: COMPOSER_CODES.map((code) => activities.find((a) => a.bookingOptionCode === code))
      .filter((a) => !!a)
      .map((a) => ({ code: a.bookingOptionCode!, label: tr(a.title, locale), icon: a.icon })),
    // le module ne compose aujourd'hui que des séjours à Merzouga ; les autres destinations apparaissent « bientôt »
    destinations: destinations.map((d) => ({ slug: d.slug, name: tr(d.name, locale), available: d.slug === "merzouga" && d.published && d._count.circuits > 0 })),
    luxePrice: luxe?.priceMad ?? null,
    previewImage: preview?.url ?? null,
  };
}
