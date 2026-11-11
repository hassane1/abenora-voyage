import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getActivity } from "@/lib/queries";
import { isFallback, tr, trList } from "@/lib/i18n-content";
import Visual from "@/components/Visual";
import { getPhotos } from "@/lib/photos";
import { Price } from "@/components/Price";
import { AddToTripButton, FavoriteButton } from "@/components/TripButtons";
import { categoryVariant, hashSeed } from "@/components/Cards";
import { Icon } from "@/components/Icon";

export async function generateMetadata({ params }: PageProps<"/[locale]/activites/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const a = await getActivity(slug);
  if (!a) return {};
  return { title: tr(a.title, locale), description: tr(a.summary, locale) };
}

export default async function ActivityPage({ params }: PageProps<"/[locale]/activites/[slug]">) {
  const { locale: l, slug } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const a = await getActivity(slug);
  if (!a) notFound();
  const photo = await getPhotos(locale);

  const facts: [string, string, string][] = [
    ["clock", t.activity.duration, tr(a.duration, locale)],
    ["hike", t.activity.difficulty, t.difficulty[a.difficulty]],
    ["users", t.activity.age, a.minAge ? t.common.minAge(a.minAge) : t.common.allAges],
    ["calendar", t.activity.availability, tr(a.availability, locale)],
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 pb-16 text-white">
        <Visual photo={photo(`activity:${a.slug}`)} priority variant={categoryVariant[a.category as keyof typeof categoryVariant] ?? "sunset"} seed={hashSeed(a.slug)} caravan={a.icon === "camel"} className="absolute inset-0 -z-10 h-full w-full" sizes="100vw" title={tr(a.title, locale)} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/90 via-night/30 to-night/40" />
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <Link href={`/${locale}/activites`} className="text-sm text-white/70 hover:text-sand">
            ← {t.nav.activities}
          </Link>
          <p className="eyebrow mt-6 !text-sand">{t.categories[a.category]}</p>
          <div className="mt-3 flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/30">
              <Icon name={a.icon} className="h-7 w-7" />
            </span>
            <h1 className="font-display text-4xl font-semibold md:text-6xl">{tr(a.title, locale)}</h1>
          </div>
          <p className="mt-5 max-w-2xl text-lg text-white/85">{tr(a.summary, locale)}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 lg:grid-cols-[1fr_320px] lg:px-8">
        <div>
          <p className="text-lg leading-relaxed text-ink/85">{tr(a.description, locale)}</p>
          {isFallback(a.description, locale) && <p className="mt-2 text-xs text-muted">{t.common.translationPending}</p>}
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {facts.map(([icon, label, value]) => (
              <div key={label} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-night/5">
                <Icon name={icon} className="h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <dt className="text-sm font-semibold text-night">{label}</dt>
                  <dd className="text-sm text-muted">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Box title={t.activity.included} items={trList(a.included, locale)} icon="check" />
            <Box title={t.activity.excluded} items={trList(a.excluded, locale)} icon="x" />
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
              <p className="flex items-center gap-2 font-semibold text-night">
                <Icon name="info" className="h-5 w-5 text-sand-dark" /> {t.activity.restrictions}
              </p>
              <p className="mt-2 text-sm text-muted">{tr(a.restrictions, locale)}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
              <p className="flex items-center gap-2 font-semibold text-night">
                <Icon name="shield" className="h-5 w-5 text-sand-dark" /> {t.activity.safety}
              </p>
              <p className="mt-2 text-sm text-muted">{tr(a.safety, locale)}</p>
            </div>
          </div>
        </div>
        <aside className="h-fit rounded-3xl bg-white p-6 shadow-xl ring-1 ring-night/5 lg:sticky lg:top-24">
          <div className="flex items-start justify-between">
            <Price amount={a.priceMad} status={a.priceStatus} unit={a.priceUnit} locale={locale} size="lg" />
            <FavoriteButton id={`activity:${a.slug}`} locale={locale} className="!shadow-none ring-1 ring-night/10" />
          </div>
          <AddToTripButton code={a.bookingOptionCode} locale={locale} className="mt-6 w-full" />
          <Link href={`/${locale}/reservation`} className="mt-3 block text-center text-sm font-semibold text-terracotta hover:underline">
            {t.home.bookAdventure} →
          </Link>
        </aside>
      </div>
    </>
  );
}

function Box({ title, items, icon }: { title: string; items: string[]; icon: string }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
      <p className="font-semibold text-night">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-sm text-ink/80">
            <Icon name={icon} className={`mt-0.5 h-4 w-4 shrink-0 ${icon === "check" ? "text-emerald-700" : "text-terracotta"}`} /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
