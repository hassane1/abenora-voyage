import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAgency } from "@/i18n/agency";
import { getV2 } from "@/i18n/v2";
import { getCircuits, getNextDepartures, getPublishedDestinations, getUpcomingDestinations } from "@/lib/queries";
import { getPhotos } from "@/lib/photos";
import { tr } from "@/lib/i18n-content";
import { CircuitCard, PageHero } from "@/components/Cards";
import Visual from "@/components/Visual";
import { Icon } from "@/components/Icon";

export async function generateMetadata({ params }: PageProps<"/[locale]/voyages">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getAgency(locale).tripsPage.title };
}

/** Voyages organisés : deux typologies, nationaux (Maroc) et internationaux */
export default async function TripsPage({ params, searchParams }: PageProps<"/[locale]/voyages">) {
  const { locale: l } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const a = getAgency(locale);
  const v = getV2(locale);
  const sp = await searchParams;
  const type = sp.type === "international" ? "INTERNATIONAL" : "NATIONAL";
  const [circuits, open, soon, photo, nextDeps] = await Promise.all([
    getCircuits({ scope: type }),
    getPublishedDestinations(),
    getUpcomingDestinations(),
    getPhotos(locale),
    getNextDepartures(),
  ]);
  const dests = [...open, ...soon].filter((d) => d.scope === type);
  const tab = (key: "national" | "international", label: string) => {
    const on = (key === "international") === (type === "INTERNATIONAL");
    return (
      <Link
        href={`/${locale}/voyages?type=${key}`}
        aria-current={on ? "page" : undefined}
        className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${on ? "bg-night text-sand shadow-lg" : "bg-white text-night ring-1 ring-night/10 hover:ring-sand"}`}
      >
        <Icon name={key === "national" ? "pin" : "globe"} className="h-4 w-4" /> {label}
      </Link>
    );
  };

  return (
    <>
      <PageHero photo={type === "NATIONAL" ? photo("aitbenhaddou") : undefined} eyebrow={a.heroEyebrow} title={a.tripsPage.title} text={a.tripsPage.intro} variant="night" seed={23} />
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="flex flex-wrap gap-3" role="navigation" aria-label={a.tripsPage.title}>
          {tab("national", `${a.tripsPage.tabNational} · ${a.typologies.national.title}`)}
          {tab("international", `${a.tripsPage.tabInternational} · ${a.typologies.international.title}`)}
        </div>
        <p className="mt-4 max-w-3xl text-muted">{type === "NATIONAL" ? a.typologies.national.text : a.typologies.international.text}</p>

        <section className="mt-12">
          <h2 className="font-display text-3xl font-semibold text-night">{a.tripsPage.circuits}</h2>
          {circuits.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-night/20 bg-white p-10 text-center">
              <Icon name={type === "NATIONAL" ? "route" : "globe"} className="mx-auto h-10 w-10 text-terracotta" />
              <p className="mx-auto mt-4 max-w-xl text-night/80">{type === "NATIONAL" ? a.tripsPage.noCircuits : a.tripsPage.noInternational}</p>
              <Link href={`/${locale}/sur-mesure?service=${type === "NATIONAL" ? "surMesure" : "international"}#demande`} className="btn btn-primary mt-6">
                {type === "NATIONAL" ? v.sections.tailorCta : a.tripsPage.requestInternational}
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {circuits.map((c) => (
                <CircuitCard key={c.id} c={c} locale={locale} photo={photo(`circuit:${c.slug}`, `destination:${c.destination.slug}`)} next={nextDeps.get(c.id)} />
              ))}
            </div>
          )}
        </section>

        {dests.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-3xl font-semibold text-night">{a.tripsPage.destinations}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {dests.map((d) => {
                const p = photo(`destination:${d.slug}`);
                const inner = (
                  <>
                    {p ? <Visual photo={p} className="absolute inset-0 h-full w-full" imgClassName="transition duration-700 group-hover:scale-105" /> : <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#16304f_0%,#0B1A2E_70%)]" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-night/90 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${d.published ? "bg-sand text-night" : "bg-white/15"}`}>{d.published ? v.sections.open : v.sections.soon}</span>
                      <span className="font-display block text-xl font-semibold">{tr(d.name, locale)}</span>
                      <span className="block text-xs text-white/70">{d.scope === "INTERNATIONAL" ? d.country : d.region}</span>
                    </span>
                  </>
                );
                const cls = "group relative block h-48 overflow-hidden rounded-3xl";
                return d.published ? (
                  <Link key={d.id} href={`/${locale}/destinations/${d.slug}`} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <div key={d.id} className={cls}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-16 rounded-[2rem] bg-night p-8 text-white sm:p-12">
          <h2 className="font-display text-3xl font-semibold text-sand">{t.tailor.title}</h2>
          <p className="mt-2 max-w-2xl text-white/80">{a.onRequest}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${locale}/sur-mesure?service=${type === "NATIONAL" ? "surMesure" : "international"}#demande`} className="btn btn-primary">
              {a.serviceCta}
            </Link>
            <Link href={`/${locale}/services`} className="btn btn-ghost text-white">
              {a.ctaServices}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
