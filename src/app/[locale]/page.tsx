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
import { getComposerData } from "@/lib/composer-data";
import { getGeneralFaq, getHomeOverrides } from "@/lib/content";
import { tr } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import { waLink } from "@/lib/site";
import { getBrand } from "@/lib/brand";
import Visual from "@/components/Visual";
import HeroSearch from "@/components/HeroSearch";
import HourByHour from "@/components/HourByHour";
import Reveal from "@/components/Reveal";
import TripComposer from "@/components/TripComposer";
import NewsletterForm from "@/components/NewsletterForm";
import { ActivityCard, CircuitCard, SectionTitle, ZelligeBand } from "@/components/Cards";
import { Icon } from "@/components/Icon";

export default async function HomePage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const sp = await searchParams;
  const t = getDictionary(locale);
  const x = getExtra(locale);
  const v = getV2(locale);
  const [destinations, upcoming, circuits, activities, composer, photo, gallery, nextDeps, departures, reviews, posts, faq, home, brand] = await Promise.all([
    getPublishedDestinations(),
    getUpcomingDestinations(),
    getCircuits(),
    getActivities(),
    getComposerData(locale),
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
  const heroPhoto = photo("hero");
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
      {/* ───────── HERO ───────── */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-10 pt-28 text-white md:items-center md:pb-16">
        <div className="absolute inset-0 -z-10 animate-slow-pan">
          <Visual photo={heroPhoto} variant="sunset" seed={42} caravan className="h-full w-full" priority title="Erg Chebbi, Merzouga" />
        </div>
        {home.heroVideo && (
          <video className="absolute inset-0 -z-10 h-full w-full object-cover motion-reduce:hidden" src={home.heroVideo} autoPlay muted loop playsInline preload="metadata" poster={heroPhoto?.src} aria-hidden />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/30 to-night/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night/60 to-transparent rtl:bg-gradient-to-l" />
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <p className="eyebrow inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 !text-sand backdrop-blur">
            <Icon name="pin" className="h-3.5 w-3.5" /> {brand.name} · {t.brandTagline}
          </p>
          <h1 className="font-display mt-5 max-w-4xl animate-fade-up text-5xl font-semibold leading-[0.98] [animation-delay:120ms] sm:text-6xl lg:text-[5.25rem]">
            {home.heroTitle || t.home.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl animate-fade-up text-lg text-white/85 [animation-delay:240ms] md:text-xl">{home.heroSubtitle || t.home.heroSubtitle}</p>
          <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:360ms]">
            <a href="#destinations" className="btn btn-sand">
              {v.hero.exploreDestinations} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
            </a>
            <Link href={`/${locale}/circuits`} className="btn btn-ghost text-white">
              {v.hero.discoverCircuits}
            </Link>
            <Link href={`/${locale}/sur-mesure`} className="btn btn-ghost text-white">
              {v.hero.planTrip}
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
          {heroPhoto?.credit && <p className="mt-4 text-[11px] text-white/50">© {heroPhoto.credit}</p>}
        </div>
      </section>

      {/* ───────── BARRE DE CONFIANCE ───────── */}
      <section className="border-b border-night/5 bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-7 lg:grid-cols-4 lg:px-8">
          {x.trust.map((it) => (
            <li key={it.title} className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sand/15 text-terracotta">
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

      {/* ───────── 1. DESTINATIONS INCONTOURNABLES ───────── */}
      <section id="destinations" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 lg:px-8">
        <SectionTitle eyebrow={v.sections.destinationsEyebrow} title={v.sections.destinationsTitle} text={v.sections.destinationsText} />
        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-4">
          {allDestinations.slice(0, 10).map((d, i) => {
            const open = d.published;
            const p = photo(`destination:${d.slug}`);
            const big = i === 0;
            const inner = (
              <>
                {p ? (
                  <Visual photo={p} className="absolute inset-0 h-full w-full" imgClassName="transition duration-700 group-hover:scale-105" />
                ) : (
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#23405f_0%,#14283f_70%)]">
                    <span className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,#d8a45d_0_1px,transparent_1px_14px)]" />
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
            <SectionTitle eyebrow={t.nav.circuits} title={v.sections.popularTitle} text={t.home.featuredText} />
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

      {/* ───────── SIGNATURE : HEURE PAR HEURE ───────── */}
      <section className="px-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Merzouga" title={x.hourTitle} text={x.hourText} />
          <div className="mt-10">
            <HourByHour locale={locale} />
          </div>
        </div>
      </section>

      {/* ───────── 4. VOYAGES SUR MESURE ───────── */}
      {composer.circuits.length > 0 && (
        <section id="composer" className="mt-24 scroll-mt-20 bg-[linear-gradient(180deg,#f3e6cf_0%,#faf7f1_100%)] py-24">
          <ZelligeBand className="-mt-24 mb-16" />
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionTitle eyebrow={t.nav.tailorMade} title={v.sections.tailorTitle} text={v.sections.tailorText} />
              <Link href={`/${locale}/sur-mesure`} className="btn btn-primary">
                {v.sections.tailorCta} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="mt-10">
              <TripComposer locale={locale} {...composer} />
            </div>
          </div>
        </section>
      )}

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
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-[linear-gradient(135deg,#14283f_0%,#23405f_100%)] p-8 text-white sm:p-12 lg:grid-cols-2">
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
