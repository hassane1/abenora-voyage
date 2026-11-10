import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCircuit } from "@/lib/queries";
import { tr, trList } from "@/lib/i18n-content";
import { site, waLink } from "@/lib/site";
import { getBrand } from "@/lib/brand";
import { formatMad } from "@/lib/format";
import Visual from "@/components/Visual";
import { getPhotos } from "@/lib/photos";
import RouteMap from "@/components/RouteMap";
import { DemoBadge, Price } from "@/components/Price";
import { FavoriteButton } from "@/components/TripButtons";
import { circuitVariant, hashSeed } from "@/components/Cards";
import { Icon } from "@/components/Icon";
import PrintButton from "@/components/PrintButton";

export async function generateMetadata({ params }: PageProps<"/[locale]/circuits/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const c = await getCircuit(slug);
  if (!c) return {};
  return {
    title: `${tr(c.title, locale)} — ${tr(c.destination.name, locale)}`,
    description: tr(c.summary, locale),
    alternates: { canonical: `/${locale}/circuits/${slug}`, languages: Object.fromEntries(locales.map((l) => [l, `/${l}/circuits/${slug}`])) },
  };
}

export default async function CircuitPage({ params }: PageProps<"/[locale]/circuits/[slug]">) {
  const { locale: l, slug } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const c = await getCircuit(slug);
  if (!c) notFound();
  const photo = await getPhotos(locale);
  const title = tr(c.title, locale);
  const warnings = trList(c.warnings, locale);
  const brand = await getBrand();
  const wa = waLink(
    brand.whatsapp,
    `${locale === "en" ? "Hello, I'm interested in the tour" : locale === "ar" ? "مرحباً، أنا مهتم بجولة" : "Bonjour, je suis intéressé(e) par le circuit"} « ${title} » (${t.common.daysNights(c.days, c.nights)}${c.priceAdultMad ? `, ${t.common.from.toLowerCase()} ${formatMad(c.priceAdultMad, locale)}` : ""}) — ${site.url}/${locale}/circuits/${c.slug}`,
  );

  const facts: [string, string, string][] = [
    ["pin", t.circuit.start, c.startPoint],
    ["pin", t.circuit.end, c.endPoint],
    ["clock", t.common.daysNights(c.days, c.nights), ""],
    ["car", t.circuit.transport, tr(c.transport, locale)],
    ["tent", t.circuit.accommodation, tr(c.accommodation, locale)],
    ["food", t.circuit.meals, tr(c.meals, locale)],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: title,
    description: tr(c.summary, locale),
    touristType: "Leisure",
    itinerary: { "@type": "ItemList", itemListElement: c.stops.map((s, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "Place", name: s.name } })) },
    provider: { "@type": "TravelAgency", name: brand.name, url: site.url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative isolate overflow-hidden pt-32 pb-16 text-white">
        <Visual photo={photo(`circuit:${c.slug}`)} variant={circuitVariant(c.slug)} seed={hashSeed(c.slug)} caravan className="absolute inset-0 -z-10 h-full w-full" priority title={title} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/90 via-night/30 to-night/40" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <nav className="no-print text-sm text-white/70" aria-label="Fil d'Ariane">
            <Link href={`/${locale}/destinations/${c.destination.slug}`} className="hover:text-sand">
              {tr(c.destination.name, locale)}
            </Link>{" "}
            /{" "}
            <Link href={`/${locale}/circuits`} className="hover:text-sand">
              {t.nav.circuits}
            </Link>
          </nav>
          <p className="eyebrow mt-6 !text-sand">{t.common.daysNights(c.days, c.nights)}</p>
          <h1 className="font-display mt-3 max-w-4xl text-5xl font-semibold md:text-7xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">{tr(c.summary, locale)}</p>
          <div className="no-print mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/${locale}/reservation?circuit=${c.slug}`} className="btn btn-sand">
              {t.circuit.book}
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost text-white">
                <Icon name="whatsapp" className="h-4 w-4" /> {t.common.whatsapp}
              </a>
            )}
            <PrintButton label={t.common.print} />
            <FavoriteButton id={`circuit:${c.slug}`} locale={locale} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="min-w-0">
          {/* Infos clés */}
          <dl className="grid gap-4 sm:grid-cols-2">
            {facts.map(([icon, label, value]) => (
              <div key={label} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-night/5">
                <Icon name={icon} className="h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <dt className="text-sm font-semibold text-night">{label}</dt>
                  {value && <dd className="text-sm text-muted">{value}</dd>}
                </div>
              </div>
            ))}
          </dl>

          {warnings.length > 0 && (
            <div className="mt-8 rounded-3xl border border-terracotta/30 bg-terracotta/5 p-6">
              <p className="flex items-center gap-2 font-semibold text-terracotta">
                <Icon name="info" /> {t.circuit.warnings}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                {warnings.map((w) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Programme : chronologie */}
          <h2 className="font-display mt-14 text-4xl font-semibold text-night">{t.circuit.program}</h2>
          <p className="mt-2 text-sm text-muted">{t.circuit.exampleProgram}</p>
          <ol className="relative mt-10 space-y-10 border-s-2 border-sand/40 ps-8">
            {c.itinerary.map((day) => (
              <li key={day.id} className="relative">
                <span className="absolute -start-[45px] top-0 grid h-8 w-8 place-items-center rounded-full bg-terracotta text-sm font-bold text-white ring-4 ring-ivory">
                  {day.dayNumber}
                </span>
                <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-night/5">
                  <Visual photo={photo(`day:${c.slug}:${day.dayNumber}`)} variant={(["sunset", "dawn", "night", "noon"] as const)[day.dayNumber % 4]} seed={day.dayNumber * 13 + hashSeed(c.slug)} className="h-48 w-full" showCredit />
                  <div className="p-6">
                    <p className="eyebrow">{t.circuit.day(day.dayNumber)}</p>
                    <h3 className="font-display mt-1 text-2xl font-semibold text-night">{tr(day.title, locale)}</h3>
                    <p className="mt-2 text-muted">{tr(day.description, locale)}</p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {trList(day.items, locale).map((it) => (
                        <li key={it} className="flex gap-2 text-sm">
                          <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-sand-dark" /> {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Carte */}
          <h2 className="font-display mt-16 text-4xl font-semibold text-night print-break">{t.circuit.map}</h2>
          <div className="mt-8">
            <RouteMap stops={c.stops.map((s) => ({ ...s, description: tr(s.description, locale) }))} locale={locale} />
          </div>

          {/* Inclus / exclus */}
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <ListBox title={t.circuit.included} items={trList(c.included, locale)} icon="check" tone="ok" />
            <ListBox title={t.circuit.excluded} items={trList(c.excluded, locale)} icon="x" tone="no" />
            <ListBox title={t.circuit.optional} items={trList(c.optionalActivities, locale)} icon="plus" tone="neutral" />
            <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
              <p className="font-display text-xl font-semibold text-night">{t.circuit.cancellation}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{tr(c.cancellationPolicy, locale)}</p>
            </div>
          </div>
        </div>

        {/* Encadré prix */}
        <aside className="no-print lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-night/5">
            <Price amount={c.priceAdultMad} status={c.priceStatus} unit={c.pricingMode === "PER_GROUP" ? "PER_GROUP" : "PER_PERSON"} locale={locale} size="lg" />
            <ul className="mt-5 space-y-2 border-t border-night/10 pt-5 text-sm text-muted">
              <li>• {t.booking.children} : {c.childPricePercent} %</li>
              {c.privateSupplementMad > 0 && (
                <li>
                  • {t.booking.private} : +{formatMad(c.privateSupplementMad, locale)} {t.common.perPerson}
                </li>
              )}
              <li>• {t.booking.deposit(c.depositPercent)}</li>
            </ul>
            {c.priceStatus !== "VALIDATED" && (
              <div className="mt-4">
                <DemoBadge locale={locale} long />
              </div>
            )}
            <Link href={`/${locale}/reservation?circuit=${c.slug}`} className="btn btn-primary mt-6 w-full">
              {t.circuit.book}
            </Link>
            <Link href={`/${locale}/comparer?c=${c.slug}`} className="mt-3 block text-center text-sm font-semibold text-terracotta hover:underline">
              {t.circuit.compare}
            </Link>
          </div>
        </aside>
      </div>

      {/* barre de réservation mobile toujours accessible */}
      <div className="no-print fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-night/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <span className="text-sm">
          {c.priceAdultMad ? (
            <>
              <span className="text-muted">{t.common.from} </span>
              <strong className="text-night">{formatMad(c.priceAdultMad, locale)}</strong>
            </>
          ) : (
            t.common.onRequest
          )}
        </span>
        <Link href={`/${locale}/reservation?circuit=${c.slug}`} className="btn btn-primary !px-5 !py-2 text-sm me-16">
          {t.common.bookNow}
        </Link>
      </div>
    </>
  );
}

function ListBox({ title, items, icon, tone }: { title: string; items: string[]; icon: string; tone: "ok" | "no" | "neutral" }) {
  const color = tone === "ok" ? "text-emerald-700" : tone === "no" ? "text-terracotta" : "text-sand-dark";
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
      <p className="font-display text-xl font-semibold text-night">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-sm text-ink/80">
            <Icon name={icon} className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
