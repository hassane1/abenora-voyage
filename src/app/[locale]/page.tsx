import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getExtra } from "@/i18n/extra";
import { getV2 } from "@/i18n/v2";
import { getSignature } from "@/i18n/signature";
import { getAgency, SERVICE_KEYS } from "@/i18n/agency";
import { getCircuits, getNextDepartures, getPosts, getPublishedDestinations, getPublishedReviews, getUpcomingDepartures, getUpcomingDestinations } from "@/lib/queries";
import { getPhotos } from "@/lib/photos";
import { getGeneralFaq, getHomeOverrides } from "@/lib/content";
import { tr } from "@/lib/i18n-content";
import { formatDate } from "@/lib/format";
import { waLink } from "@/lib/site";
import { getBrand } from "@/lib/brand";
import Visual from "@/components/Visual";
import HeroSearch from "@/components/HeroSearch";
import NewsletterForm from "@/components/NewsletterForm";
import { CircuitCard, SectionTitle } from "@/components/Cards";
import { Icon } from "@/components/Icon";
import OmraSignature, { type OmraHotel } from "@/components/home/OmraSignature";
import VisaTimeline from "@/components/home/VisaTimeline";
import WorldDestinations from "@/components/home/WorldDestinations";
import Commitments from "@/components/home/Commitments";

type Grid = { rows?: { label?: unknown; detail?: unknown }[] } | null;

export default async function HomePage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const sp = await searchParams;
  const t = getDictionary(locale);
  const x = getExtra(locale);
  const v = getV2(locale);
  const sg = getSignature(locale);
  const a = getAgency(locale);
  const [destinations, upcoming, circuits, photo, nextDeps, departures, reviews, posts, faq, home, brand] = await Promise.all([
    getPublishedDestinations(),
    getUpcomingDestinations(),
    getCircuits(),
    getPhotos(locale),
    getNextDepartures(),
    getUpcomingDepartures(60),
    getPublishedReviews(),
    getPosts(),
    getGeneralFaq(),
    getHomeOverrides(locale),
    getBrand(),
  ]);

  // hero : diaporama lent des photos avec droits confirmés, sinon visuels de marque
  const heroPhotos = [photo("hero"), photo("heroAlt"), photo("destination:marrakech"), photo("destination:omra-la-mecque-medine")].filter((p) => !!p);
  const heroSlides = heroPhotos.length ? heroPhotos : [undefined];

  // circuits mis en avant : un mélange Maroc / international / Omra
  const featured = [
    ...circuits.filter((c) => c.destination.scope === "NATIONAL").slice(0, 3),
    ...circuits.filter((c) => c.destination.scope === "INTERNATIONAL" && c.programType !== "OMRA").slice(0, 2),
    ...circuits.filter((c) => c.programType === "OMRA").slice(0, 1),
  ];

  // bloc Omra : premiers départs (un par programme) et hôtels proches du Haram tirés des grilles tarifaires
  const seen = new Set<string>();
  const omraDeps = departures
    .filter((d) => d.circuit.programType === "OMRA" && !seen.has(d.circuitId) && seen.add(d.circuitId))
    .slice(0, 4);
  const hotels: OmraHotel[] = [];
  for (const c of circuits.filter((c) => c.programType === "OMRA")) {
    for (const r of (c.priceGrid as Grid)?.rows ?? []) {
      const label = tr<string>(r.label, locale, "");
      if (label && !hotels.some((h) => h.label === label)) hotels.push({ label, detail: tr<string>(r.detail, locale, "") });
    }
    if (hotels.length >= 4) break;
  }

  const world = [...destinations, ...upcoming]
    .filter((d) => d.slug !== "voyages-sur-mesure")
    .map((d) => ({
      slug: d.slug,
      name: tr<string>(d.name, locale, d.slug),
      region: d.region,
      country: d.country,
      scope: d.scope === "INTERNATIONAL" ? ("INTERNATIONAL" as const) : ("NATIONAL" as const),
      omra: d.slug.startsWith("omra"),
      open: d.published,
      latitude: d.latitude,
      longitude: d.longitude,
    }));

  const wa = waLink(brand.whatsapp, x.askUs);
  const merzouga = destinations.find((d) => d.slug === "merzouga");
  const faqItems = (faq.length ? faq : ((merzouga?.faq ?? []) as { q: unknown; a: unknown }[])).slice(0, 6);
  const nlStatus = typeof sp.newsletter === "string" ? sp.newsletter : undefined;
  const national = destinations.filter((d) => d.scope !== "INTERNATIONAL").map((d) => ({ slug: d.slug, name: tr<string>(d.name, locale, d.slug) }));
  const international = destinations.filter((d) => d.scope === "INTERNATIONAL" && !d.slug.startsWith("omra")).map((d) => ({ slug: d.slug, name: tr<string>(d.name, locale, d.slug) }));

  return (
    <>
      {/* ───────── HERO plein écran ───────── */}
      <section className="relative isolate flex min-h-[92svh] items-center overflow-hidden bg-night pt-24 pb-36 text-white md:min-h-[100svh] md:pb-44">
        <div className="absolute inset-0 -z-10" aria-hidden>
          {heroSlides.map((p, i) => (
            <div key={i} className="hero-slide absolute inset-0" style={{ animationDelay: `${i * 8}s`, animationDuration: `${heroSlides.length * 8}s` }}>
              <Visual photo={p} variant="sunset" seed={42 + i} className="h-full w-full" priority={i === 0} sizes="100vw" />
            </div>
          ))}
        </div>
        {home.heroVideo && (
          <video className="absolute inset-0 -z-10 h-full w-full object-cover motion-reduce:hidden" src={home.heroVideo} autoPlay muted loop playsInline preload="none" poster={heroPhotos[0]?.src} aria-hidden />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night/70 via-night/45 to-night/85" />
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <p className="eyebrow eyebrow-light">{home.heroTitle ? a.heroEyebrow : sg.hero.eyebrow}</p>
          <h1 className="font-display mt-5 max-w-4xl text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl">
            {home.heroTitle || sg.hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">{home.heroSubtitle || sg.hero.subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={`/${locale}/voyages`} className="btn btn-primary">
              {sg.hero.ctaTrips} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link href={`/${locale}/sur-mesure#demande`} className="btn btn-outline-light">
              {sg.hero.ctaQuote}
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── RECHERCHE : carte flottante sous le hero ───────── */}
      <div className="relative z-10 mx-auto -mt-28 max-w-5xl px-4 md:-mt-32 lg:px-8">
        <HeroSearch locale={locale} national={national} international={international} />
      </div>

      {/* ───────── BARRE DE CONFIANCE ───────── */}
      <section className="mx-auto max-w-7xl px-4 pt-14 lg:px-8">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {a.trust.map((it) => (
            <li key={it.title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-light/60 text-night">
                <Icon name={it.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-night">{it.title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">{it.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── VOYAGES À LA UNE ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-section lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow={a.nav.trips} title={v.sections.popularTitle} text={a.popularText} />
          <Link href={`/${locale}/voyages`} className="inline-flex items-center gap-2 font-semibold text-gold-deep hover:underline">
            {t.common.seeAll} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <CircuitCard key={c.id} c={c} locale={locale} photo={photo(`circuit:${c.slug}`)} next={nextDeps.get(c.id)} />
          ))}
        </div>
      </section>

      {/* ───────── SIGNATURE : OMRA & HAJJ ───────── */}
      <OmraSignature locale={locale} departures={omraDeps} hotels={hotels} whatsapp={brand.whatsapp} />

      {/* ───────── SIGNATURE : MAROC + MONDE ───────── */}
      <WorldDestinations locale={locale} destinations={world} />

      {/* ───────── SERVICES ───────── */}
      <section id="services" className="scroll-mt-24 bg-white py-section">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionTitle eyebrow={brand.name} title={a.servicesTitle} text={a.servicesText} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_KEYS.map((k) => {
              const s = a.services[k];
              const href =
                k === "national" ? `/${locale}/voyages?type=national` : k === "international" ? `/${locale}/voyages?type=international` : k === "omra" ? `/${locale}/destinations/omra-la-mecque-medine` : k === "visa" ? "#visas" : `/${locale}/sur-mesure?service=${k}#demande`;
              return (
                <li key={k}>
                  <Link href={href} className="group flex h-full flex-col rounded-card bg-ivory p-6 ring-1 ring-line transition hover:bg-white hover:shadow-lift">
                    <span className={`grid h-11 w-11 place-items-center rounded-full ${k === "omra" ? "bg-emerald text-white" : "bg-night text-gold-light"}`}>
                      <Icon name={s.icon} className="h-5 w-5" />
                    </span>
                    <span className="font-display mt-4 text-xl text-night">{s.title}</span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.text}</span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-deep">
                      {a.serviceCta} <Icon name="arrow" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:rotate-180" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───────── SIGNATURE : VISAS ───────── */}
      <VisaTimeline locale={locale} />

      {/* ───────── SUR MESURE ───────── */}
      <section className="px-4 lg:px-8">
        <div className="relative isolate mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-card bg-night p-8 text-white sm:p-12 lg:grid-cols-[1.3fr_1fr]">
          <span aria-hidden className="band-star absolute inset-x-0 top-0" />
          <div>
            <SectionTitle eyebrow={t.nav.tailorMade} title={v.sections.tailorTitle} text={v.sections.tailorText} light />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/sur-mesure#demande`} className="btn btn-primary">
                {sg.hero.ctaQuote} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
              </Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {(["surMesure", "hotels", "transport", "billetterie"] as const).map((k) => (
              <li key={k} className="flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <Icon name={a.services[k].icon} className="h-5 w-5 shrink-0 text-gold" />
                <span className="font-medium">{a.services[k].title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── AVIS VÉRIFIÉS, sinon NOS ENGAGEMENTS ───────── */}
      {reviews.length === 0 ? (
        <div className="pt-section">
          <Commitments locale={locale} />
        </div>
      ) : (
        <section className="mt-section bg-white py-section">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <SectionTitle eyebrow={t.nav.reviews} title={v.sections.testimonialsTitle} text={v.sections.testimonialsText} />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="rounded-card bg-ivory p-7 ring-1 ring-line">
                  <p className="text-gold-deep" aria-label={`${r.rating}/5`}>
                    {"★".repeat(r.rating)}
                    <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  <blockquote className="mt-3">
                    <p className="font-semibold text-night">{r.title}</p>
                    <p className="mt-2 line-clamp-5 text-sm leading-relaxed text-muted">{r.comment}</p>
                  </blockquote>
                  <figcaption className="mt-4 text-xs text-muted">
                    {r.authorName} · {tr(r.booking.circuit.title, locale)} · {formatDate(r.booking.startDate, locale, { month: "long", year: "numeric" })}
                    <span className="ms-2 inline-flex items-center gap-1 rounded-pill bg-emerald/10 px-2 py-0.5 font-semibold text-emerald">
                      <Icon name="check" className="h-3 w-3" /> {v.sections.verifiedStay}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            {reviews.length > 3 && (
              <Link href={`/${locale}/avis`} className="mt-6 inline-block font-semibold text-gold-deep hover:underline">
                {t.common.seeAll} →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ───────── CONSEILS DE VOYAGE ───────── */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-section lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow={t.nav.blog} title={v.sections.adviceTitle} />
            <Link href={`/${locale}/blog`} className="font-semibold text-gold-deep hover:underline">
              {t.common.seeAll} →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {posts.slice(0, 3).map((p, i) => (
              <Link key={p.id} href={`/${locale}/blog/${p.slug}`} className="group overflow-hidden rounded-card bg-white shadow-card ring-1 ring-line transition hover:shadow-lift">
                <Visual variant={(["dusk", "noon", "sunset"] as const)[i % 3]} seed={i + 11} className="aspect-[16/9] w-full" />
                <div className="p-6">
                  <p className="text-xs text-muted">{formatDate(p.publishedAt, locale)}</p>
                  <h3 className="font-display mt-1 text-xl leading-snug text-night group-hover:text-gold-deep">{tr(p.title, locale)}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{tr(p.excerpt, locale)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───────── QUESTIONS FRÉQUENTES ───────── */}
      {faqItems.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-section">
          <SectionTitle eyebrow="FAQ" title={v.sections.faqTitle} center />
          <div className="mt-10 divide-y divide-line rounded-card bg-white ring-1 ring-line">
            {faqItems.map((f, i) => (
              <details key={i} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-night">
                  {tr<string>(f.q, locale, "")}
                  <Icon name="plus" className="h-5 w-5 shrink-0 text-gold-deep transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{tr<string>(f.a, locale, "")}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ───────── NEWSLETTER ET CONTACT ───────── */}
      <section id="newsletter" className="scroll-mt-24 px-4 pb-section lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-card bg-emerald p-8 text-white sm:p-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow eyebrow-light">Newsletter</p>
            <h2 className="font-display mt-3 text-3xl md:text-4xl">{v.newsletter.title}</h2>
            <p className="mt-3 text-white/85">{v.newsletter.text}</p>
            <div className="mt-6">
              <NewsletterForm locale={locale} status={nlStatus} />
            </div>
          </div>
          <div className="rounded-card bg-night/30 p-6 ring-1 ring-white/10 sm:p-8">
            <h2 className="font-display text-2xl md:text-3xl">{v.sections.contactTitle}</h2>
            <p className="mt-2 text-white/85">{v.sections.contactText}</p>
            <div className="mt-6 flex flex-col gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
                </a>
              )}
              <Link href={`/${locale}/contact`} className="btn btn-primary">
                <Icon name="mail" className="h-4 w-4" /> {t.nav.contact}
              </Link>
              {brand.phone && (
                <a href={`tel:${brand.phone.split(/[/|,;]/)[0].replace(/[^\d+]/g, "")}`} className="btn btn-outline-light" dir="ltr">
                  <Icon name="phone" className="h-4 w-4" /> {brand.phone.split(/[/|,;]/)[0].trim()}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
