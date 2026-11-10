import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCircuits, getPublishedDestinations, getUpcomingDestinations } from "@/lib/queries";
import { getComposerData } from "@/lib/composer-data";
import { tr } from "@/lib/i18n-content";
import { getPhotos } from "@/lib/photos";
import { PageHero } from "@/components/Cards";
import RequestForm from "@/components/RequestForm";
import TripComposer from "@/components/TripComposer";

const TAGS: Record<string, string[]> = {
  "escapade-saharienne-2j": ["0", "5"],
  "immersion-desert-3j": ["0", "1", "2"],
  "grand-sud-marocain-4j": ["0", "2", "4"],
};

export async function generateMetadata({ params }: PageProps<"/[locale]/sur-mesure">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).tailor.title };
}

export default async function TailorMadePage({ params }: PageProps<"/[locale]/sur-mesure">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [circuits, composer, open, soon] = await Promise.all([getCircuits(), getComposerData(locale), getPublishedDestinations(), getUpcomingDestinations()]);
  const heroPhoto = (await getPhotos(locale))("camp");
  const otherProject = locale === "en" ? "Another project? Tell us more" : locale === "ar" ? "مشروع آخر؟ أخبرنا أكثر" : "Un autre projet ? Décrivez-le-nous";
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={t.nav.tailorMade} title={t.tailor.title} text={t.tailor.intro} variant="dawn" seed={19} />
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <TripComposer locale={locale} {...composer} />
      </section>
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="font-display mb-6 text-3xl font-semibold text-night">{otherProject}</h2>
        <RequestForm
          locale={locale}
          kind="SUR_MESURE"
          destinations={[...open, ...soon].map((d) => ({ slug: d.slug, name: tr(d.name, locale) }))}
          circuits={circuits.map((c) => ({ slug: c.slug, title: tr(c.title, locale), days: c.days, priceAdultMad: c.priceAdultMad, tags: TAGS[c.slug] ?? [] }))}
        />
      </section>
    </>
  );
}
