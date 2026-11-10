import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCircuits } from "@/lib/queries";
import { tr, trList } from "@/lib/i18n-content";
import { getPhotos } from "@/lib/photos";
import { PageHero } from "@/components/Cards";
import Comparator from "@/components/Comparator";

export async function generateMetadata({ params }: PageProps<"/[locale]/comparer">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).compare.title };
}

export default async function ComparePage({ params, searchParams }: PageProps<"/[locale]/comparer">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const sp = await searchParams;
  const circuits = await getCircuits();
  const heroPhoto = (await getPhotos(locale))("valley");
  const initial = typeof sp.c === "string" ? sp.c.split(",") : [];
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={t.nav.circuits} title={t.compare.title} variant="sunset" seed={66} />
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <Comparator
          locale={locale}
          initial={initial.length === 1 ? circuits.map((c) => c.slug) : initial}
          circuits={circuits.map((c) => ({
            slug: c.slug,
            title: tr(c.title, locale),
            days: c.days,
            nights: c.nights,
            price: c.priceAdultMad,
            priceStatus: c.priceStatus,
            start: `${c.startPoint} → ${c.endPoint}`,
            accommodation: tr(c.accommodation, locale),
            transport: tr(c.transport, locale),
            meals: tr(c.meals, locale),
            included: trList(c.included, locale),
            optional: trList(c.optionalActivities, locale),
          }))}
        />
      </div>
    </>
  );
}
