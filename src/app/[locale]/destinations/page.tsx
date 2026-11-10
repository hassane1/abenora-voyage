import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPublishedDestinations, getUpcomingDestinations } from "@/lib/queries";
import { tr } from "@/lib/i18n-content";
import { getPhotos } from "@/lib/photos";
import { PageHero, hashSeed } from "@/components/Cards";
import Visual from "@/components/Visual";
import { Icon } from "@/components/Icon";

export async function generateMetadata({ params }: PageProps<"/[locale]/destinations">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).nav.destinations };
}

export default async function DestinationsPage({ params }: PageProps<"/[locale]/destinations">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [published, upcoming] = await Promise.all([getPublishedDestinations(), getUpcomingDestinations()]);
  const heroPhoto = (await getPhotos(locale))("merzouga");
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={t.brandTagline} title={t.nav.destinations} variant="noon" seed={8} />
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {published.map((d) => (
            <Link key={d.id} href={`/${locale}/destinations/${d.slug}`} className="group relative isolate block h-96 overflow-hidden rounded-[2rem] text-white">
              <Visual photo={heroPhoto} variant="sunset" seed={hashSeed(d.slug)} caravan className="absolute inset-0 -z-10 h-full w-full" imgClassName="transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/80 to-transparent" />
              <div className="absolute bottom-0 p-8">
                <p className="eyebrow !text-sand">{d.region}</p>
                <h2 className="font-display mt-2 text-5xl font-semibold">{tr(d.name, locale)}</h2>
                <p className="mt-2 max-w-md text-white/85">{tr(d.tagline, locale)}</p>
                <span className="mt-4 inline-flex items-center gap-2 font-semibold text-sand">
                  {t.common.discover} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <h2 className="font-display mt-20 text-4xl font-semibold text-night">{t.home.comingTitle}</h2>
        <p className="mt-2 text-muted">{t.home.comingText}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map((d) => (
            <div key={d.id} className="rounded-2xl bg-white p-5 ring-1 ring-night/5">
              <p className="font-display text-2xl text-night">{tr(d.name, locale)}</p>
              <p className="text-xs text-muted">{d.region}</p>
              <p className="mt-3 inline-block rounded-full bg-ivory px-3 py-1 text-xs font-medium text-terracotta">{t.home.comingTitle}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
