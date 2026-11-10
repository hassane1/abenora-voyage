import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getExtra } from "@/i18n/extra";
import { tr, trList } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import type { Photo } from "@/lib/photos";
import type { NextDeparture } from "@/lib/queries";
import DuneArt from "./DuneArt";
import Visual from "./Visual";
import { FavoriteButton } from "./TripButtons";
import { Icon } from "./Icon";

export function hashSeed(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h) % 1000;
}

const circuitVariants = ["sunset", "dawn", "dusk", "night", "noon"] as const;
export function circuitVariant(slug: string) {
  return circuitVariants[hashSeed(slug) % circuitVariants.length];
}
export const categoryVariant = { AVENTURE: "noon", CULTURE: "dusk", EXCEPTION: "night" } as const;

type CircuitCardData = {
  id?: string;
  slug: string;
  title: unknown;
  summary: unknown;
  days: number;
  nights: number;
  startPoint: string;
  priceAdultMad: number | null;
  priceStatus: string;
  pricingMode: string;
  included?: unknown;
};

export function CircuitCard({ c, locale, photo, next }: { c: CircuitCardData; locale: Locale; photo?: Photo; next?: NextDeparture }) {
  const t = getDictionary(locale);
  const x = getExtra(locale);
  const label = x.labels[c.slug];
  const highlights = trList(c.included, locale).slice(0, 3);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_40px_-24px_rgba(20,40,63,0.45)] ring-1 ring-night/5 transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-30px_rgba(20,40,63,0.55)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Visual photo={photo} variant={circuitVariant(c.slug)} seed={hashSeed(c.slug)} caravan className="h-full w-full" imgClassName="transition duration-[1.2s] group-hover:scale-110" title={tr(c.title, locale)} />
        <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-night/10" />
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-4">
          {label ? <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-terracotta shadow">{label}</span> : <span />}
          <FavoriteButton id={`circuit:${c.slug}`} locale={locale} />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4 text-xs font-semibold text-white">
          <span className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur">
            <Icon name="clock" className="h-3.5 w-3.5" /> {t.common.daysNights(c.days, c.nights)}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur">
            <Icon name="pin" className="h-3.5 w-3.5" /> {c.startPoint}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-[1.7rem] font-semibold leading-tight text-night">
          <Link href={`/${locale}/circuits/${c.slug}`} className="after:absolute after:inset-0 group-hover:text-terracotta">
            {tr(c.title, locale)}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{tr(c.summary, locale)}</p>
        {highlights.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-ink/80">
            {highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {h}
              </li>
            ))}
          </ul>
        )}
        {next && (
          <p className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${next.remaining <= 3 ? "bg-terracotta/10 text-terracotta" : "bg-emerald-50 text-emerald-800"}`}>
            <Icon name="calendar" className="h-4 w-4" />
            <span>
              {x.nextDeparture} : {formatDate(next.date, locale, { day: "numeric", month: "short" })} · {x.seatsLeft(next.remaining)}
            </span>
            {next.isDemo && (
              <span className="ms-auto shrink-0 font-normal opacity-70" title={t.common.demoAvailability}>
                ● {locale === "en" ? "demo" : locale === "ar" ? "تجريبي" : "démo"}
              </span>
            )}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-night/5 pt-5">
          <div className="min-w-0">
            {c.priceAdultMad === null ? (
              <span className="font-semibold text-night">{t.common.onRequest}</span>
            ) : (
              <p className="whitespace-nowrap text-sm text-muted">
                {x.from} <strong className="font-display text-2xl font-semibold text-night">{formatMad(c.priceAdultMad, locale)}</strong>{" "}
                {c.pricingMode === "PER_GROUP" ? t.common.perGroup : x.perPersonShort}
              </p>
            )}
            {c.priceStatus !== "VALIDATED" && <p className="text-[11px] text-terracotta" title={t.common.demoPriceLong}>● {t.common.demoPrice}</p>}
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-night text-white transition group-hover:bg-terracotta" aria-hidden>
            <Icon name="arrow" className="h-5 w-5 rtl:rotate-180" />
          </span>
        </div>
      </div>
    </article>
  );
}

type ActivityCardData = {
  slug: string;
  category: string;
  icon: string;
  title: unknown;
  summary: unknown;
  duration: unknown;
  difficulty: string;
  minAge: number | null;
  priceMad: number | null;
  priceUnit: string;
  priceStatus: string;
};

export function ActivityCard({ a, locale, photo, compact = false }: { a: ActivityCardData; locale: Locale; photo?: Photo; compact?: boolean }) {
  const t = getDictionary(locale);
  const x = getExtra(locale);
  const variant = categoryVariant[a.category as keyof typeof categoryVariant] ?? "sunset";
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-night/5 transition duration-500 hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative overflow-hidden ${compact ? "aspect-[4/3]" : "aspect-[16/11]"}`}>
        <Visual photo={photo} variant={variant} seed={hashSeed(a.slug)} className="h-full w-full" imgClassName="transition duration-[1.2s] group-hover:scale-110" title={tr(a.title, locale)} />
        {!photo && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/40 backdrop-blur">
              <Icon name={a.icon} className="h-8 w-8" />
            </span>
          </div>
        )}
        <span className="absolute start-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-night shadow">
          <Icon name={a.icon} className="h-3.5 w-3.5 text-terracotta" /> {t.categories[a.category]}
        </span>
        <div className="absolute end-3 top-3 z-10">
          <FavoriteButton id={`activity:${a.slug}`} locale={locale} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold leading-tight text-night">
          <Link href={`/${locale}/activites/${a.slug}`} className="after:absolute after:inset-0 group-hover:text-terracotta">
            {tr(a.title, locale)}
          </Link>
        </h3>
        {!compact && <p className="mt-2 line-clamp-2 text-sm text-muted">{tr(a.summary, locale)}</p>}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Icon name="clock" className="h-3.5 w-3.5" /> {tr(a.duration, locale)}
          </span>
          <span>· {t.difficulty[a.difficulty]}</span>
          <span>· {a.minAge ? t.common.minAge(a.minAge) : t.common.allAges}</span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-4">
          {a.priceMad === null || a.priceStatus === "ON_REQUEST" ? (
            <span className="text-sm font-semibold text-night">{t.common.onRequest}</span>
          ) : a.priceMad === 0 ? (
            <span className="text-sm font-semibold text-emerald-700">{t.common.free}</span>
          ) : (
            <span className="text-sm text-muted">
              {x.from} <strong className="font-display text-xl text-night">{formatMad(a.priceMad, locale)}</strong>
              {a.priceStatus !== "VALIDATED" && <span className="block text-[10px] text-terracotta">● {t.common.demoPrice}</span>}
            </span>
          )}
          <Icon name="arrow" className="h-5 w-5 text-terracotta transition group-hover:translate-x-1 rtl:rotate-180" />
        </div>
      </div>
    </article>
  );
}

export function SectionTitle({ eyebrow, title, text, center = false, light = false }: { eyebrow?: string; title: string; text?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow ${light ? "!text-sand" : ""}`}>{eyebrow}</p>}
      <h2 className={`font-display mt-2 text-4xl font-semibold leading-[1.05] md:text-[3.4rem] ${light ? "text-white" : "text-night"}`}>{title}</h2>
      {text && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/75" : "text-muted"}`}>{text}</p>}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
  variant = "sunset",
  seed = 3,
  photo,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  variant?: "sunset" | "dawn" | "night" | "noon" | "dusk";
  seed?: number;
  photo?: Photo;
}) {
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 text-white md:pt-40 md:pb-28">
      <div className="absolute inset-0 -z-10">
        <Visual photo={photo} variant={variant} seed={seed} className="h-full w-full" priority />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/85 via-night/40 to-night/50" />
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {eyebrow && <p className="eyebrow !text-sand">{eyebrow}</p>}
        <h1 className="font-display mt-3 max-w-3xl text-5xl font-semibold leading-[1.02] md:text-7xl">{title}</h1>
        {text && <p className="mt-5 max-w-2xl text-lg text-white/85">{text}</p>}
      </div>
    </section>
  );
}

/** Motif zellige (étoile à 8 branches) utilisé comme séparateur décoratif */
export function ZelligeBand({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`h-6 w-full opacity-60 ${className}`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='24' viewBox='0 0 48 24'%3E%3Cpath d='M24 2l3 6 6-1.5L31.5 12 33 17.5 27 16l-3 6-3-6-6 1.5L16.5 12 15 6.5 21 8z' fill='none' stroke='%23D8A45D' stroke-width='1.2'/%3E%3C/svg%3E\")" }} />
  );
}

export { DuneArt };
