import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getExtra } from "@/i18n/extra";
import { getActivities, getCircuits, getNextDepartures, getPublishedDestinations, getUpcomingDepartures, getUpcomingDestinations } from "@/lib/queries";
import { getAllPhotos, getPhotos } from "@/lib/photos";
import { getComposerData } from "@/lib/composer-data";
import { tr } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import Visual from "@/components/Visual";
import HeroSearch from "@/components/HeroSearch";
import HourByHour from "@/components/HourByHour";
import Reveal from "@/components/Reveal";
import TripComposer from "@/components/TripComposer";
import { ActivityCard, CircuitCard, SectionTitle, ZelligeBand } from "@/components/Cards";
import { Icon } from "@/components/Icon";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const x = getExtra(locale);
  const [destinations, upcoming, circuits, activities, composer, photo, gallery, nextDeps, departures] = await Promise.all([
    getPublishedDestinations(),
    getUpcomingDestinations(),
    getCircuits(),
    getActivities(),
    getComposerData(locale),
    getPhotos(locale),
    getAllPhotos(locale),
    getNextDepartures(),
    getUpcomingDepartures(8),
  ]);
  const heroPhoto = photo("hero");
  const categories = (["AVENTURE", "CULTURE", "EXCEPTION"] as const).map((k) => ({ key: k, label: t.categories[k] }));
  const featured = ["dromadaire-coucher-soleil", "campement-luxe", "quad-desert", "degustation", "4x4-chauffeur", "bivouac-traditionnel", "khamlia-gnawa", "oasis"]
    .map((s) => activities.find((a) => a.slug === s))
    .filter((a) => !!a);
  const wa = whatsappLink(x.askUs);

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-10 pt-28 text-white md:items-center md:pb-16">
        <div className="absolute inset-0 -z-10 animate-slow-pan">
          <Visual photo={heroPhoto} variant="sunset" seed={42} caravan className="h-full w-full" priority title="Erg Chebbi, Merzouga" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/30 to-night/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night/60 to-transparent rtl:bg-gradient-to-l" />
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <p className="eyebrow inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 !text-sand backdrop-blur">
            <Icon name="pin" className="h-3.5 w-3.5" /> Merzouga · Sahara · {t.brandTagline}
          </p>
          <h1 className="font-display mt-5 max-w-4xl animate-fade-up text-5xl font-semibold leading-[0.98] [animation-delay:120ms] sm:text-6xl lg:text-[5.25rem]">
            {t.home.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl animate-fade-up text-lg text-white/85 [animation-delay:240ms] md:text-xl">{t.home.heroSubtitle}</p>
          <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:360ms]">
            <Link href={`/${locale}/destinations/merzouga`} className="btn btn-sand">
              {t.home.exploreMerzouga} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <a href="#composer" className="btn btn-ghost text-white">
              {t.home.bookAdventure}
            </a>
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

      {/* ───────── CIRCUITS ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow={t.nav.circuits} title={t.home.circuitsTitle} text={t.home.featuredText} />
          <Link href={`/${locale}/comparer`} className="inline-flex items-center gap-2 font-semibold text-terracotta hover:underline">
            <Icon name="route" className="h-4 w-4" /> {t.nav.compare}
          </Link>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {circuits.map((c, i) => (
            <Reveal key={c.id} delay={i * 120}>
              <CircuitCard c={c} locale={locale} photo={photo(`circuit:${c.slug}`)} next={nextDeps.get(c.id)} />
            </Reveal>
          ))}
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

      {/* ───────── QUE VOULEZ-VOUS VIVRE ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow={t.nav.activities} title={x.categoriesTitle} />
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

      {/* ───────── COMPOSEZ VOTRE AVENTURE ───────── */}
      {composer.circuits.length > 0 && (
        <section id="composer" className="mt-24 scroll-mt-20 bg-[linear-gradient(180deg,#f3e6cf_0%,#faf7f1_100%)] py-24">
          <ZelligeBand className="-mt-24 mb-16" />
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <SectionTitle eyebrow={t.nav.tailorMade} title={t.tailor.title} text={t.tailor.intro} />
            <div className="mt-10">
              <TripComposer locale={locale} {...composer} />
            </div>
          </div>
        </section>
      )}

      {/* ───────── MERZOUGA EN IMAGES ───────── */}
      {gallery.length >= 5 && (
        <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow={t.nav.gallery} title={x.inPictures} />
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

      {/* ───────── GARANTIES ───────── */}
      <section className="px-4 pb-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-night text-white lg:grid-cols-2">
          <Visual photo={photo("tea")} variant="dusk" seed={4} className="min-h-72 w-full" />
          <div className="p-8 sm:p-12">
            <SectionTitle eyebrow={t.brandTagline} title={x.guaranteeTitle} light />
            <ul className="mt-8 space-y-4">
              {x.guarantees.map((g) => (
                <li key={g} className="flex gap-3 text-white/85">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand text-night">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  {g}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#composer" className="btn btn-sand">
                {t.home.bookAdventure}
              </a>
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

      {/* ───────── BIENTÔT ───────── */}
      <section className="border-t border-night/5 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="eyebrow">{t.home.comingTitle}</p>
          <p className="mt-2 text-muted">{t.home.comingText}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {upcoming.map((d) => (
              <li key={d.id} className="rounded-full border border-night/10 px-4 py-1.5 text-sm text-night/70">
                {tr(d.name, locale)}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
