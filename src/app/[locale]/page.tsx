import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getExtra } from "@/i18n/extra";
import { getV2 } from "@/i18n/v2";
import {
  getActivities,
  getCircuits,
  getNextDepartures,
  getPosts,
  getPublishedDestinations,
  getPublishedReviews,
  getUpcomingDepartures,
  getUpcomingDestinations,
} from "@/lib/queries";
import { getAllPhotos, getPhotos } from "@/lib/photos";
import { getGeneralFaq, getHomeOverrides } from "@/lib/content";
import { tr } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import { waLink } from "@/lib/site";
import { getBrand } from "@/lib/brand";
import Visual from "@/components/Visual";
import HeroSearch from "@/components/HeroSearch";
import Reveal from "@/components/Reveal";
import NewsletterForm from "@/components/NewsletterForm";
import { ActivityCard, CircuitCard, SectionTitle } from "@/components/Cards";
import { getAgency, SERVICE_KEYS } from "@/i18n/agency";
import { Icon } from "@/components/Icon";

export default async function HomePage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const sp = await searchParams;
  const t = getDictionary(locale);
  const x = getExtra(locale);
  const v = getV2(locale);
  const [destinations, upcoming, circuits, activities, photo, gallery, nextDeps, departures, reviews, posts, faq, home, brand] = await Promise.all([
    getPublishedDestinations(),
    getUpcomingDestinations(),
    getCircuits(),
    getActivities(),
    getPhotos(locale),
    getAllPhotos(locale),
    getNextDepartures(),
    getUpcomingDepartures(8),
    getPublishedReviews(),
    getPosts(),
    getGeneralFaq(),
    getHomeOverrides(locale),
    getBrand(),
  ]);
  const a = getAgency(locale);
  // visuel d'accueil : plusieurs destinations en fondu (photos avec droits confirmés)
  const heroSlides = [photo("hero"), photo("aitbenhaddou"), photo("valley"), photo("palm")].filter((p) => !!p);
  if (heroSlides.length === 0) heroSlides.push(undefined as never);
  const categories = (["AVENTURE", "CULTURE", "EXCEPTION"] as const).map((k) => ({ key: k, label: t.categories[k] }));
  const featured = ["dromadaire-coucher-soleil", "campement-luxe", "quad-desert", "degustation", "4x4-chauffeur", "bivouac-traditionnel", "khamlia-gnawa", "oasis"]
    .map((s) => activities.find((a) => a.slug === s))
    .filter((a) => !!a);
  const wa = waLink(brand.whatsapp, x.askUs);
  // FAQ générale (Admin → Contenus) ; à défaut, celle de Merzouga
  const merzouga = destinations.find((d) => d.slug === "merzouga");
  const faqItems = (faq.length ? faq : ((merzouga?.faq ?? []) as { q: unknown; a: unknown }[])).slice(0, 6);
  const allDestinations = [...destinations, ...upcoming];
  const nlStatus = typeof sp.newsletter === "string" ? sp.newsletter : undefined;

  return (
    <>
      {/* ───────── HERO : agence, plusieurs destinations en fondu ───────── */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-night pb-10 pt-28 text-white md:items-center md:pb-16">
        <div className="absolute inset-0 -z-10">
          {heroSlides.map((p, i) => (
            <div key={i} className="hero-slide absolute inset-0" style={{ animationDelay: `${i * 6}s`, animationDuration: `${heroSlides.length * 6}s` }}>
              <Visual photo={p} variant="sunset" seed={42 + i} className="h-full w-full" priority={i === 0} />
            </div>
          ))}
        </div>
        {home.heroVideo && (
          <video className="absolute inset-0 -z-10 h-full w-full object-cover motion-reduce:hidden" src={home.heroVideo} autoPlay muted loop playsInline preload="metadata" poster={heroSlides[0]?.src} aria-hidden />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/40 to-night/50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night/80 to-transparent rtl:bg-gradient-to-l" />
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <div className="flex animate-fade-up items-center gap-4">
            {brand.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={brand.name} className="h-20 w-20 rounded-full shadow-[0_0_0_3px_rgba(212,168,69,0.6),0_20px_50px_rgba(0,0,0,0.5)] md:h-24 md:w-24" />
            )}
            <p className="eyebrow rounded-full bg-white/10 px-3 py-1.5 !text-sand backdrop-blur">{a.heroEyebrow}</p>
          </div>
          <h1 className="font-display mt-6 max-w-4xl animate-fade-up text-5xl font-semibold leading-[0.98] [animation-delay:120ms] sm:text-6xl lg:text-[5rem]">
            {home.heroTitle || a.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl animate-fade-up text-lg text-white/85 [animation-delay:240ms] md:text-xl">{home.heroSubtitle || a.heroSubtitle}</p>
          <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:360ms]">
            <Link href={`/${locale}/voyages`} className="btn btn-primary">
              {a.ctaTrips} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <a href="#services" className="btn btn-ghost text-white">
              {a.ctaServices}
            </a>
            <Link href={`/${locale}/sur-mesure`} className="btn btn-ghost text-white">
              {a.ctaTailor}
            </Link>
          </div>
          <div className="mt-10 animate-fade-up [animation-delay:480ms]">
            <HeroSearch
              locale={locale}
              categories={categories}
              destinations={destinations.map((d) => ({ slug: d.slug, name: tr(d.name, locale) }))}
              upcoming={upcoming.map((d) => ({ slug: d.slug, name: tr(d.name, locale) }))}
            />
          </div>
          {heroSlides.some((p) => p?.credit) && <p className="mt-4 text-[11px] text-white/50">© {Array.from(new Set(heroSlides.map((p) => p?.credit).filter(Boolean))).join(", ")}</p>}
        </div>
      </section>

      {/* ───────── BARRE DE CONFIANCE ───────── */}
      <section className="border-b border-night/5 bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-7 lg:grid-cols-4 lg:px-8">
          {a.trust.map((it) => (
            <li key={it.title} className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-night text-sand">
                <Icon name={it.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-night">{it.title}</span>
                <span className="block text-xs leading-snug text-muted">{it.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── NOS VOYAGES : NATIONAL / INTERNATIONAL ───────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 lg:px-8">
        <SectionTitle eyebrow={a.typologies.eyebrow} title={a.typologies.title} />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {(
            [
              ["national", a.typologies.national, photo("aitbenhaddou") ?? heroSlides[0]],
              ["international", a.typologies.international, undefined],
            ] as const
          ).map(([key, ty, p]) => (
            <Link key={key} href={`/${locale}/voyages?type=${key}`} className="group relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-[2rem] bg-night p-8 text-white ring-1 ring-sand/20">
              {p ? (
                <Visual photo={p} className="absolute inset-0 -z-10 h-full w-full" imgClassName="transition duration-700 group-hover:scale-105" />
              ) : (
                <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_10%,rgba(212,168,69,0.35),transparent_45%),linear-gradient(160deg,#16304f,#0B1A2E)]">
                  <Icon name="globe" className="absolute -end-10 -top-10 h-72 w-72 text-sand/10" />
                </span>
              )}
              <span className="absolute inset-0 -z-10 bg-gradient-to-t from-night/95 via-night/40 to-transparent" />
              <span className="eyebrow !text-sand">{key === "national" ? "Maroc" : "International"}</span>
              <span className="font-display mt-2 text-4xl font-semibold">{ty.title}</span>
              <span className="mt-2 max-w-md text-white/80">{ty.text}</span>
              <span className="mt-5 inline-flex items-center gap-2 font-semibold text-sand">
                {ty.cta} <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────── NOS SERVICES ───────── */}
      <section id="services" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow={brand.name} title={a.servicesTitle} text={a.servicesText} />
          <Link href={`/${locale}/services`} className="inline-flex items-center gap-2 font-semibold text-terracotta hover:underline">
            {t.common.seeAll} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_KEYS.map((k) => {
            const s = a.services[k];
            return (
              <li key={k}>
                <Link href={k === "national" ? `/${locale}/voyages?type=national` : `/${locale}/sur-mesure?service=${k}#demande`} className="group flex h-full flex-col rounded-3xl bg-white p-6 ring-1 ring-night/5 transition hover:-translate-y-1 hover:shadow-xl hover:ring-sand/50">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-night text-sand transition group-hover:bg-sand group-hover:text-night">
                    <Icon name={s.icon} className="h-6 w-6" />
                  </span>
                  <span className="font-display mt-4 text-2xl font-semibold text-night">{s.title}</span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.text}</span>
                  <span className="mt-4 text-sm font-semibold text-terracotta">{k === "national" ? a.typologies.national.cta : a.serviceCta} →</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link href={`/${locale}/contact`} className="flex h-full flex-col justify-center rounded-3xl bg-night p-6 text-white ring-1 ring-sand/30">
              <span className="font-display text-2xl font-semibold text-sand">{v.sections.contactTitle}</span>
              <span className="mt-2 text-sm text-white/75">{v.sections.contactText}</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* ───────── 1. DESTINATIONS INCONTOURNABLES ───────── */}
      <section id="destinations" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 lg:px-8">
        <SectionTitle eyebrow={v.sections.destinationsEyebrow} title={v.sections.destinationsTitle} text={a.destinationsText} />
        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-4">
          {allDestinations.slice(0, 10).map((d, i) => {
            const open = d.published;
            const p = photo(`destination:${d.slug}`);
            const big = false; // toutes les destinations au même niveau : le site présente l'agence, pas une seule destination
            void i;
            const inner = (
              <>
                {p ? (
                  <Visual photo={p} className="absolute inset-0 h-full w-full" imgClassName="transition duration-700 group-hover:scale-105" />
                ) : (
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#16304f_0%,#0B1A2E_70%)]">
                    <span className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,#D4A845_0_1px,transparent_1px_14px)]" />
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${open ? "bg-sand text-night" : "bg-white/15 text-white/80 backdrop-blur"}`}>
                    {open ? v.sections.open : v.sections.soon}
                  </span>
                  <span className={`font-display block font-semibold leading-tight ${big ? "text-4xl md:text-5xl" : "text-2xl"}`}>{tr(d.name, locale)}</span>
                  <span className="block text-xs text-white/70">{d.region}</span>
                  {big && open && <span className="mt-2 block max-w-md text-sm text-white/85">{tr(d.tagline, locale)}</span>}
                </span>
              </>
            );
            const cls = `group relative overflow-hidden rounded-3xl ${big ? "col-span-2 row-span-2" : ""}`;
            return open ? (
              <Link key={d.id} href={`/${locale}/destinations/${d.slug}`} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={d.id} className={`${cls} opacity-95`}>
                {inner}
              </div>
            );
          })}
        </div>
        <Link href={`/${locale}/destinations`} className="mt-6 inline-flex items-center gap-2 font-semibold text-terracotta hover:underline">
          {t.common.seeAll} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </section>

      {/* ───────── 2. CIRCUITS POPULAIRES ───────── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow={t.nav.circuits} title={v.sections.popularTitle} text={a.popularText} />
            <Link href={`/${locale}/comparer`} className="inline-flex items-center gap-2 font-semibold text-terracotta hover:underline">
              <Icon name="route" className="h-4 w-4" /> {t.nav.compare}
            </Link>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {circuits.slice(0, 6).map((c, i) => (
              <Reveal key={c.id} delay={i * 120}>
                <CircuitCard c={c} locale={locale} photo={photo(`circuit:${c.slug}`)} next={nextDeps.get(c.id)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── PROCHAINS DÉPARTS ───────── */}
      {departures.length > 0 && (
        <section className="bg-night py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow !text-sand">{x.nextDepartures}</p>
                <h2 className="font-display mt-1 text-3xl font-semibold md:text-4xl">{x.nextDeparturesText}</h2>
              </div>
              {departures.some((d) => d.isDemo) && <p className="text-xs text-sand-light">● {t.common.demoAvailability}</p>}
            </div>
            <div className="no-scrollbar -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
              {departures.map((d) => {
                const left = d.capacity - d.seatsHeld;
                return (
                  <Link
                    key={d.id}
                    href={`/${locale}/reservation?circuit=${d.circuit.slug}`}
                    className="group w-60 shrink-0 snap-start rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-sand/50"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-sand">{formatDate(d.date, locale, { weekday: "long" })}</p>
                    <p className="font-display text-4xl font-semibold">{formatDate(d.date, locale, { day: "numeric", month: "short" })}</p>
                    <p className="mt-2 line-clamp-1 text-sm text-white/80">{tr(d.circuit.title, locale)}</p>
                    <p className="mt-1 text-xs text-white/60">{t.common.daysNights(d.circuit.days, d.circuit.nights)}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className={`rounded-full px-2 py-1 font-semibold ${left <= 3 ? "bg-terracotta text-white" : "bg-emerald-400/20 text-emerald-200"}`}>{x.seatsLeft(left)}</span>
                      {d.circuit.priceAdultMad && (
                        <span className="font-semibold">
                          {x.from} {formatMad(d.circuit.priceAdultMad, locale)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ───────── 3. EXPÉRIENCES ET ACTIVITÉS ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow={t.nav.activities} title={v.sections.experiencesTitle} text={x.categoriesTitle} />
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.key} href={`/${locale}/activites#${c.key}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-night ring-1 ring-night/10 transition hover:bg-night hover:text-white">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="no-scrollbar -mx-4 mt-10 flex snap-x gap-5 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {featured.map((a) => (
            <div key={a.id} className="w-72 shrink-0 snap-start lg:w-auto">
              <ActivityCard a={a} locale={locale} photo={photo(`activity:${a.slug}`)} compact />
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 4. VOYAGES SUR MESURE ───────── */}
      <section className="px-4 lg:px-8">
        <div className="relative isolate mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#efe4c8_0%,#faf7f1_100%)] p-8 ring-1 ring-sand/30 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionTitle eyebrow={t.nav.tailorMade} title={v.sections.tailorTitle} text={v.sections.tailorText} />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/sur-mesure#demande`} className="btn btn-primary">
                {v.sections.tailorCta} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link href={`/${locale}/sur-mesure?service=omra#demande`} className="btn btn-sand">
                {a.services.omra.title}
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {(["surMesure", "hotels", "transport", "billetterie"] as const).map((k) => (
              <li key={k} className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-night/5">
                <Icon name={a.services[k].icon} className="h-5 w-5 shrink-0 text-terracotta" />
                <span className="font-semibold text-night">{a.services[k].title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── 5. POURQUOI VOYAGER AVEC NOUS ───────── */}
      <section className="px-4 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-night text-white lg:grid-cols-[0.9fr_1.1fr]">
          <Visual photo={photo("tea")} variant="dusk" seed={4} className="min-h-72 w-full" />
          <div className="p-8 sm:p-12">
            <SectionTitle eyebrow={brand.name} title={v.sections.whyTitle} light />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {v.sections.why.map((g) => (
                <li key={g.title}>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand/15 text-sand">
                    <Icon name={g.icon} className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-semibold">{g.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{g.text}</p>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={`/${locale}/reservation`} className="btn btn-sand">
                {t.home.bookAdventure}
              </Link>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white">
                  <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
                </a>
              ) : (
                <Link href={`/${locale}/contact`} className="btn btn-ghost text-white">
                  {x.askUs}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── 6. TÉMOIGNAGES VÉRIFIÉS ───────── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionTitle eyebrow={t.nav.reviews} title={v.sections.testimonialsTitle} text={v.sections.testimonialsText} />
          {reviews.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-night/20 p-10 text-center text-muted">
              <Icon name="star" className="mx-auto h-8 w-8 text-sand" />
              <p className="mx-auto mt-3 max-w-xl">{v.sections.testimonialsEmpty}</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="rounded-3xl bg-ivory p-7 ring-1 ring-night/5">
                  <p className="text-sand" aria-label={`${r.rating}/5`}>
                    {"★".repeat(r.rating)}
                    <span className="text-night/15">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  <blockquote className="mt-3">
                    <p className="font-semibold text-night">{r.title}</p>
                    <p className="mt-2 line-clamp-5 text-sm leading-relaxed text-night/75">{r.comment}</p>
                  </blockquote>
                  <figcaption className="mt-4 text-xs text-muted">
                    {r.authorName} · {tr(r.booking.circuit.title, locale)} · {formatDate(r.booking.startDate, locale, { month: "long", year: "numeric" })}
                    <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                      <Icon name="check" className="h-3 w-3" /> {v.sections.verifiedStay}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {reviews.length > 3 && (
            <Link href={`/${locale}/avis`} className="mt-6 inline-block font-semibold text-terracotta hover:underline">
              {t.common.seeAll} →
            </Link>
          )}
        </div>
      </section>

      {/* ───────── 7. GALERIE PHOTOGRAPHIQUE ───────── */}
      {gallery.length >= 5 && (
        <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow={t.nav.gallery} title={v.sections.galleryTitle} />
            <Link href={`/${locale}/galerie`} className="font-semibold text-terracotta hover:underline">
              {t.common.seeAll} →
            </Link>
          </div>
          <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4">
            {gallery.slice(0, 7).map((p, i) => (
              <Visual key={p.src} photo={p} className={`rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : i === 3 ? "md:row-span-2" : ""}`} imgClassName="transition duration-700 hover:scale-105" />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            {x.photoCredit} © {Array.from(new Set(gallery.map((g) => g.credit).filter(Boolean))).join(", ")}
          </p>
        </section>
      )}

      {/* ───────── 8. CONSEILS DE VOYAGE ───────── */}
      {posts.length > 0 && (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionTitle eyebrow={t.nav.blog} title={v.sections.adviceTitle} />
              <Link href={`/${locale}/blog`} className="font-semibold text-terracotta hover:underline">
                {t.common.seeAll} →
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {posts.slice(0, 3).map((p, i) => (
                <Link key={p.id} href={`/${locale}/blog/${p.slug}`} className="group overflow-hidden rounded-3xl bg-ivory ring-1 ring-night/5 transition hover:-translate-y-1 hover:shadow-xl">
                  <Visual variant={(["dawn", "dusk", "noon"] as const)[i % 3]} seed={i + 11} className="h-40 w-full" />
                  <div className="p-6">
                    <p className="text-xs text-muted">{formatDate(p.publishedAt, locale)}</p>
                    <h3 className="font-display mt-1 text-2xl font-semibold leading-tight text-night group-hover:text-terracotta">{tr(p.title, locale)}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{tr(p.excerpt, locale)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── 9. QUESTIONS FRÉQUENTES ───────── */}
      {faqItems.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-24">
          <SectionTitle eyebrow="FAQ" title={v.sections.faqTitle} center />
          <div className="mt-10 divide-y divide-night/10 rounded-3xl bg-white ring-1 ring-night/5">
            {faqItems.map((f, i) => (
              <details key={i} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-night">
                  {tr<string>(f.q, locale, "")}
                  <Icon name="plus" className="h-5 w-5 shrink-0 text-terracotta transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 leading-relaxed text-night/75">{tr<string>(f.a, locale, "")}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ───────── 10. NEWSLETTER ET CONTACT ───────── */}
      <section id="newsletter" className="scroll-mt-24 px-4 pb-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-[linear-gradient(135deg,#0B1A2E_0%,#16304f_100%)] p-8 text-white sm:p-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-sand">Newsletter</p>
            <h2 className="font-display mt-2 text-4xl font-semibold">{v.newsletter.title}</h2>
            <p className="mt-3 text-white/75">{v.newsletter.text}</p>
            <div className="mt-6">
              <NewsletterForm locale={locale} status={nlStatus} />
            </div>
          </div>
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-8">
            <h2 className="font-display text-3xl font-semibold">{v.sections.contactTitle}</h2>
            <p className="mt-2 text-white/75">{v.sections.contactText}</p>
            <div className="mt-6 flex flex-col gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white">
                  <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
                </a>
              )}
              <Link href={`/${locale}/contact`} className="btn btn-sand">
                <Icon name="mail" className="h-4 w-4" /> {t.nav.contact}
              </Link>
              {brand.phone && (
                <a href={`tel:${brand.phone.split(/[/|,;]/)[0].replace(/[^\d+]/g, "")}`} className="btn btn-ghost text-white" dir="ltr">
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
