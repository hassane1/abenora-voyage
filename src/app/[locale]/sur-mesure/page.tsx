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
import { getAgency, SERVICE_KEYS, type ServiceKey } from "@/i18n/agency";

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

export default async function TailorMadePage({ params, searchParams }: PageProps<"/[locale]/sur-mesure">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const a = getAgency(locale);
  const sp = await searchParams;
  const service = typeof sp.service === "string" && (SERVICE_KEYS as string[]).includes(sp.service) ? (sp.service as ServiceKey) : null;
  const [circuits, composer, open, soon] = await Promise.all([getCircuits(), getComposerData(locale), getPublishedDestinations(), getUpcomingDestinations()]);
  const heroPhoto = (await getPhotos(locale))("camp");
  const otherProject = locale === "en" ? "Another project? Tell us more" : locale === "ar" ? "مشروع آخر؟ أخبرنا أكثر" : "Un autre projet ? Décrivez-le-nous";
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={t.nav.tailorMade} title={t.tailor.title} text={t.tailor.intro} variant="dawn" seed={19} />
      <section id="demande" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16">
        <div className="mb-6 flex flex-wrap gap-2">
          {SERVICE_KEYS.filter((k) => k !== "national").map((k) => (
            <a key={k} href={`/${locale}/sur-mesure?service=${k}#demande`} className={`rounded-full px-4 py-2 text-sm font-semibold ${service === k ? "bg-night text-sand" : "bg-white text-night ring-1 ring-night/10 hover:ring-sand"}`}>
              {a.services[k].title}
            </a>
          ))}
        </div>
        <h2 className="font-display mb-2 text-3xl font-semibold text-night">{service ? a.services[service].title : otherProject}</h2>
        {service && <p className="mb-6 text-muted">{a.services[service].text} {a.onRequest}</p>}
        <RequestForm
          key={service ?? "none"}
          locale={locale}
          kind="SUR_MESURE"
          initialMessage={service ? `${a.services[service].title} : ` : ""}
          defaultDestination={service === "omra" || service === "international" ? "international" : undefined}
          destinations={[
            ...[...open, ...soon].filter((d) => d.scope === "NATIONAL").map((d) => ({ slug: d.slug, name: tr(d.name, locale) })),
            { slug: "international", name: `${a.typologies.international.title} (${locale === "ar" ? "حدد في الرسالة" : locale === "en" ? "specify in your message" : "à préciser dans le message"})` },
          ]}
          circuits={circuits.map((c) => ({ slug: c.slug, title: tr(c.title, locale), days: c.days, priceAdultMad: c.priceAdultMad, tags: TAGS[c.slug] ?? [] }))}
        />
      </section>
      {composer.circuits.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
          <h2 className="font-display mb-6 text-3xl font-semibold text-night">{t.tailor.title} — Merzouga</h2>
          <TripComposer locale={locale} {...composer} />
        </section>
      )}
    </>
  );
}
