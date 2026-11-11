import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getDestination, getNextDepartures, getPublishedReviews, getUpcomingDepartures } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { isFallback, tr, trList } from "@/lib/i18n-content";
import { site } from "@/lib/site";
import BrandArt from "@/components/BrandArt";
import Visual from "@/components/Visual";
import { getPhotos } from "@/lib/photos";
import Reveal from "@/components/Reveal";
import { ActivityCard, CircuitCard, SectionTitle } from "@/components/Cards";
import CircuitMapTabs from "@/components/CircuitMapTabs";
import TripComposer from "@/components/TripComposer";
import { getComposerData } from "@/lib/composer-data";
import { Icon } from "@/components/Icon";
import HourByHour from "@/components/HourByHour";
import { getExtra } from "@/i18n/extra";

export async function generateMetadata({ params }: PageProps<"/[locale]/destinations/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const d = await getDestination(slug);
  if (!d) return {};
  return {
    title: tr(d.tagline, locale) || tr(d.name, locale),
    description: tr<string>(d.description, locale).slice(0, 160),
    alternates: { canonical: `/${locale}/destinations/${slug}`, languages: Object.fromEntries(locales.map((l) => [l, `/${l}/destinations/${slug}`])) },
  };
}

export default async function DestinationPage({ params }: PageProps<"/[locale]/destinations/[slug]">) {
  const { locale: l, slug } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const d = await getDestination(slug);
  if (!d) notFound();
  const reviews = await getPublishedReviews(d.id);
  const [photo, nextDeps, allDeps] = await Promise.all([getPhotos(locale), getNextDepartures(), getUpcomingDepartures(60)]);
  const calendar = allDeps.filter((x) => d.circuits.some((c) => c.id === x.circuitId)).slice(0, 12);
  const composer = d.slug === "merzouga" ? await getComposerData(locale) : null;
  const sections = (d.sections ?? {}) as Record<string, unknown>;
  const faq = (Array.isArray(d.faq) ? d.faq : []) as { q: unknown; a: unknown }[];
  const tips = trList(d.tips, locale);
  const byCat = (cat: string) => d.activities.filter((a) => a.category === cat);
  // sections éditoriales propres à une destination (Merzouga : Erg Chebbi, bivouacs, Tafilalet) : affichées seulement si renseignées
  const has = (k: string) => !!tr<string>(sections[k], locale, "");
  const excursionActs = d.activities.filter((a) => ["rissani-souk", "4x4-chauffeur", "khamlia-gnawa", "oasis"].includes(a.slug));
  const heroPhoto = photo(`destination:${d.slug}`) ?? (d.slug === "merzouga" ? photo("merzouga") : undefined);

  const calTitle = locale === "en" ? "Departure calendar" : locale === "ar" ? "رزنامة الانطلاقات" : "Le calendrier des séjours";
  const toc = ([
    ["presentation", t.merzouga.intro],
    ["erg", t.merzouga.erg],
    ["experiences", t.merzouga.experiences],
    ["circuits", t.merzouga.circuits],
    ["composer", t.nav.tailorMade],
    ["hebergements", t.merzouga.accommodation],
    ["carte", t.merzouga.map],
    ["excursions", t.merzouga.excursions],
    ["avis", t.merzouga.reviews],
    ["galerie", t.merzouga.gallery],
    ["conseils", t.merzouga.tips],
    ["faq", t.merzouga.faq],
    ["calendrier", calTitle],
    ["reserver", t.merzouga.book],
  ] as [string, string][]).filter(([id]) => (id === "erg" ? has("erg") : id === "hebergements" ? has("accommodation") : id === "excursions" ? has("excursions") || excursionActs.length > 0 : id === "composer" ? !!composer?.circuits.length : id === "calendrier" ? calendar.length > 0 : true));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: tr(d.name, locale),
      description: tr(d.description, locale),
      geo: { "@type": "GeoCoordinates", latitude: d.latitude, longitude: d.longitude },
      url: `${site.url}/${locale}/destinations/${d.slug}`,
      containedInPlace: { "@type": "Country", name: "Maroc" },
    },
    faq.length > 0 && {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: tr(f.q, locale), acceptedAnswer: { "@type": "Answer", text: tr(f.a, locale) } })),
    },
  ].filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* HERO */}
      <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden pb-20 pt-32 text-white">
        <div className="absolute inset-0 -z-10">
          <Visual photo={heroPhoto} variant="sunset" seed={11} caravan={d.slug === "merzouga"} className="h-full w-full" priority title={tr(d.name, locale)} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/90 via-night/20 to-night/30" />
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <p className="eyebrow eyebrow-light">
            {d.region} · {t.nav.destinations}
          </p>
          <h1 className="font-display mt-4 max-w-4xl text-4xl leading-[1.08] md:text-6xl">{tr(d.tagline, locale)}</h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#circuits" className="btn btn-sand">
              {t.merzouga.circuits}
            </a>
            <a href={composer && composer.circuits.length > 0 ? "#composer" : `/${locale}/reservation?destination=${d.slug}`} className="btn btn-ghost text-white">
              {t.home.bookAdventure}
            </a>
          </div>
        </div>
      </section>

      {/* SOMMAIRE */}
      <nav className="no-print sticky top-[68px] z-20 border-b border-night/10 bg-ivory/95 backdrop-blur" aria-label="Sommaire">
        <ul className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 py-3 text-sm whitespace-nowrap lg:px-8">
          {toc.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-night/70 hover:text-terracotta">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* PRÉSENTATION */}
      <section id="presentation" className="mx-auto grid max-w-7xl scroll-mt-32 gap-12 px-4 py-24 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <Reveal>
          <SectionTitle eyebrow={t.merzouga.intro} title={tr(d.name, locale)} />
          <p className="mt-6 text-xl leading-relaxed text-ink/80">{tr(d.description, locale)}</p>
          {isFallback(d.description, locale) && <p className="mt-2 text-xs text-muted">{t.common.translationPending}</p>}
        </Reveal>
        <Reveal delay={150} className="overflow-hidden rounded-[2rem]">
          <Visual photo={photo("hero")} variant="dawn" seed={23} className="h-full min-h-80 w-full" showCredit />
        </Reveal>
      </section>

      {/* ERG CHEBBI */}
      {has("erg") && (
      <section id="erg" className="scroll-mt-32 bg-night py-24 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <Reveal className="overflow-hidden rounded-[2rem]">
            <Visual photo={photo("dunes")} variant="noon" seed={64} className="h-96 w-full" showCredit />
          </Reveal>
          <Reveal delay={120}>
            <SectionTitle eyebrow="Erg Chebbi" title={t.merzouga.erg} light />
            <p className="mt-6 text-lg leading-relaxed text-white/80">{tr(sections.erg, locale)}</p>
          </Reveal>
        </div>
      </section>
      )}

      {/* EXPÉRIENCES */}
      <section id="experiences" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-24 lg:px-8">
        <SectionTitle eyebrow={t.nav.activities} title={t.merzouga.experiences} />
        {(["AVENTURE", "CULTURE", "EXCEPTION"] as const).map((cat) => (
          <div key={cat} className="mt-14">
            <h3 className="font-display text-3xl text-terracotta">{t.categories[cat]}</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {byCat(cat).map((a, i) => (
                <Reveal key={a.id} delay={(i % 3) * 100}>
                  <ActivityCard a={a} locale={locale} photo={photo(`activity:${a.slug}`)} />
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* SIGNATURE DU DÉSERT : LE SAHARA HEURE PAR HEURE (Merzouga uniquement) */}
      {d.slug === "merzouga" && (
        <section className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
          <SectionTitle eyebrow="Merzouga" title={getExtra(locale).hourTitle} text={getExtra(locale).hourText} />
          <div className="mt-10">
            <HourByHour locale={locale} />
          </div>
        </section>
      )}

      {/* CIRCUITS */}
      <section id="circuits" className="scroll-mt-32 bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionTitle eyebrow={t.nav.circuits} title={t.merzouga.circuits} text={t.circuit.exampleProgram} />
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {d.circuits.map((c, i) => (
              <Reveal key={c.id} delay={i * 120}>
                <CircuitCard c={c} locale={locale} photo={photo(`circuit:${c.slug}`)} next={nextDeps.get(c.id)} />
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={`/${locale}/comparer`} className="font-semibold text-terracotta hover:underline">
              {t.nav.compare} →
            </Link>
          </div>
        </div>
      </section>

      {/* COMPOSER */}
      {composer && composer.circuits.length > 0 && (
        <section id="composer" className="scroll-mt-32 bg-ivory py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <SectionTitle eyebrow={t.nav.tailorMade} title={t.tailor.title} text={t.tailor.intro} />
            <div className="mt-10">
              <TripComposer locale={locale} {...composer} />
            </div>
          </div>
        </section>
      )}

      {/* HÉBERGEMENTS */}
      {has("accommodation") && (
      <section id="hebergements" className="mx-auto grid max-w-7xl scroll-mt-32 items-center gap-12 px-4 py-24 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <SectionTitle eyebrow={t.circuit.accommodation} title={t.merzouga.accommodation} />
          <p className="mt-6 text-lg leading-relaxed text-ink/80">{tr(sections.accommodation, locale)}</p>
        </Reveal>
        <Reveal delay={120} className="grid grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-3xl">
            <Visual photo={photo("camp")} variant="night" seed={3} className="h-64 w-full" showCredit />
          </div>
          <div className="mt-10 overflow-hidden rounded-3xl">
            <Visual photo={photo("campLuxe")} variant="dusk" seed={8} className="h-64 w-full" showCredit />
          </div>
        </Reveal>
      </section>
      )}

      {/* CARTE */}
      <section id="carte" className="scroll-mt-32 bg-sand-light/30 py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionTitle eyebrow={t.circuit.map} title={t.merzouga.map} />
          <div className="mt-10">
            <CircuitMapTabs
              locale={locale}
              circuits={d.circuits.map((c) => ({
                slug: c.slug,
                title: tr(c.title, locale),
                stops: c.stops.map((s) => ({ ...s, description: tr(s.description, locale) })),
              }))}
            />
          </div>
        </div>
      </section>

      {/* EXCURSIONS */}
      {(has("excursions") || excursionActs.length > 0) && (
      <section id="excursions" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-24 lg:px-8">
        <SectionTitle eyebrow={d.slug === "merzouga" ? "Tafilalet" : d.region} title={t.merzouga.excursions} text={tr(sections.excursions, locale)} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {excursionActs.map((a) => (
            <ActivityCard key={a.id} a={a} locale={locale} photo={photo(`activity:${a.slug}`)} />
          ))}
        </div>
      </section>
      )}

      {/* AVIS */}
      <section id="avis" className="scroll-mt-32 bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionTitle eyebrow={t.nav.reviews} title={t.merzouga.reviews} />
          {reviews.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-night/20 p-10 text-center">
              <Icon name="star" className="mx-auto h-8 w-8 text-sand" />
              <p className="mx-auto mt-4 max-w-xl text-muted">{t.reviews.none}</p>
              <Link href={`/${locale}/espace-client`} className="mt-6 inline-block font-semibold text-terracotta hover:underline">
                {t.reviews.leave} →
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="rounded-3xl bg-ivory p-6">
                  <div className="flex gap-0.5 text-sand">{Array.from({ length: r.rating }, (_, i) => <Icon key={i} name="star" filled className="h-4 w-4" />)}</div>
                  <p className="font-display mt-3 text-xl text-night">{r.title}</p>
                  <blockquote className="mt-2 text-sm leading-relaxed text-muted">{r.comment}</blockquote>
                  <figcaption className="mt-4 text-xs text-night/70">
                    {r.authorName} · <span className="text-terracotta">✓ {t.reviews.verified}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* GALERIE */}
      <section id="galerie" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-24 lg:px-8">
        <SectionTitle eyebrow={t.nav.gallery} title={t.merzouga.gallery} text={d.media.length ? undefined : t.gallery.intro} />
        <div className="mt-10 grid auto-rows-[180px] grid-cols-2 gap-4 md:grid-cols-4">
          {d.media.length > 0
            ? d.media.map((m) => (
                <figure key={m.id} className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={tr(m.alt, locale)} loading="lazy" className="h-full w-full object-cover" />
                  {m.credit && <figcaption className="absolute bottom-0 w-full bg-black/40 px-2 py-1 text-[10px] text-white">© {m.credit}</figcaption>}
                </figure>
              ))
            : (["sunset", "night", "dawn", "dusk", "noon", "sunset"] as const).map((v, i) => (
                <div key={i} className={`overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                  <BrandArt variant={v} seed={i * 17 + 4} caravan={i % 2 === 0} className="h-full w-full" />
                </div>
              ))}
        </div>
        {d.media.length === 0 && <p className="mt-3 text-xs text-muted">{t.common.photoPending}</p>}
      </section>

      {/* CONSEILS */}
      <section id="conseils" className="scroll-mt-32 bg-night py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionTitle eyebrow={t.nav.blog} title={t.merzouga.tips} light />
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-sand" />
                <span className="text-white/85">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl scroll-mt-32 px-4 py-24">
        <SectionTitle eyebrow="FAQ" title={t.merzouga.faq} center />
        <div className="mt-10 divide-y divide-night/10 rounded-3xl bg-white ring-1 ring-night/5">
          {faq.map((f, i) => (
            <details key={i} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-night">
                {tr(f.q, locale)}
                <Icon name="plus" className="h-5 w-5 shrink-0 transition group-open:rotate-45" />
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{tr(f.a, locale)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CALENDRIER DES SÉJOURS (départs réellement ouverts, avec places restantes) */}
      {calendar.length > 0 && (
        <section id="calendrier" className="mx-auto max-w-7xl scroll-mt-32 px-4 pb-24 lg:px-8">
          <SectionTitle eyebrow={t.booking.chooseDate} title={calTitle} />
          {calendar.some((x) => x.isDemo) && <p className="mt-2 text-xs text-terracotta">● {t.common.demoAvailability}</p>}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {calendar.map((x) => (
              <Link key={x.id} href={`/${locale}/reservation?circuit=${x.circuit.slug}`} className="rounded-2xl bg-white p-4 ring-1 ring-night/5 transition hover:ring-sand">
                <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">{formatDate(x.date, locale, { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="mt-1 line-clamp-1 font-semibold text-night">{tr(x.circuit.title, locale)}</p>
                <p className="mt-1 text-xs text-muted">{t.common.daysNights(x.circuit.days, x.circuit.nights)} · {x.capacity - x.seatsHeld} / {x.capacity}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* RÉSERVER */}
      <section id="reserver" className="scroll-mt-32 px-4 pb-24 lg:px-8">
        <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-8 py-20 text-center text-white">
          <Visual photo={photo("heroAlt")} variant="sunset" seed={90} caravan className="absolute inset-0 -z-10 h-full w-full" />
          <div className="absolute inset-0 -z-10 bg-night/45" />
          <h2 className="font-display text-5xl font-semibold">{t.merzouga.book}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">{t.merzouga.bookText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {d.circuits.map((c) => (
              <Link key={c.id} href={`/${locale}/reservation?circuit=${c.slug}`} className="btn btn-sand">
                {tr(c.title, locale)}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
