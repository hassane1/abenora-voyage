import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getActivities } from "@/lib/queries";
import { getPhotos } from "@/lib/photos";
import { ActivityCard, PageHero } from "@/components/Cards";
import Reveal from "@/components/Reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/activites">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).nav.activities };
}

export default async function ActivitiesPage({ params }: PageProps<"/[locale]/activites">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const activities = await getActivities();
  const photo = await getPhotos(locale);
  const heroPhoto = photo("camel");
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow="Merzouga" title={t.nav.activities} text={t.home.experiencesTitle} variant="noon" seed={21} />
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        {(["AVENTURE", "CULTURE", "EXCEPTION"] as const).map((cat) => (
          <section key={cat} id={cat} className="mb-16 scroll-mt-24">
            <h2 className="font-display text-4xl font-semibold text-night">{t.categories[cat]}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activities
                .filter((a) => a.category === cat)
                .map((a, i) => (
                  <Reveal key={a.id} delay={(i % 3) * 100}>
                    <ActivityCard a={a} locale={locale} photo={photo(`activity:${a.slug}`)} />
                  </Reveal>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
