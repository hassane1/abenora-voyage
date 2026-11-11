import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getExtra } from "@/i18n/extra";
import { getSignature } from "@/i18n/signature";
import { tr, trList } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import type { Photo } from "@/lib/photos";
import type { NextDeparture } from "@/lib/queries";
import Visual from "./Visual";
import ProgramArt from "./ProgramArt";
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

/** Prix public d'une carte : un tarif de démonstration n'est jamais affiché comme un prix */
export function publicPrice(amount: number | null, status: string) {
  return amount === null || status === "DEMO" || status === "ON_REQUEST" ? null : amount;
}

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
  programType?: string;
  destination?: { scope?: string; name?: unknown };
};

export function CircuitCard({ c, locale, photo, next }: { c: CircuitCardData; locale: Locale; photo?: Photo; next?: NextDeparture }) {
  const t = getDictionary(locale);
  const x = getExtra(locale);
  const s = getSignature(locale).card;
  const label = x.labels[c.slug];
  const highlights = trList(c.included, locale).slice(0, 3);
  const price = publicPrice(c.priceAdultMad, c.priceStatus);
  const omra = c.programType === "OMRA";
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden">
        {!photo && ((c.programType && c.programType !== "CIRCUIT") || c.destination?.scope === "INTERNATIONAL") ? (
          <ProgramArt type={c.programType ?? "CIRCUIT"} label={c.destination?.name ? tr<string>(c.destination.name, locale, "") : undefined} className="h-full w-full" />
        ) : (
          <Visual photo={photo} variant={circuitVariant(c.slug)} seed={hashSeed(c.slug)} className="h-full w-full" imgClassName="transition duration-700 group-hover:scale-[1.03]" title={tr(c.title, locale)} />
        )}
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
          <span className="flex items-center gap-1.5 rounded-pill bg-white/95 px-3 py-1 text-xs font-semibold text-night shadow-card">
            <Icon name="clock" className="h-3.5 w-3.5 text-gold-deep" /> {t.common.daysNights(c.days, c.nights)}
          </span>
          <FavoriteButton id={`circuit:${c.slug}`} locale={locale} />
        </div>
        {(label || omra) && (
          <span className={`absolute bottom-3 start-3 rounded-pill px-3 py-1 text-xs font-semibold ${omra ? "bg-emerald text-white" : "bg-night text-gold-light"}`}>
            {label ?? getSignature(locale).search.tabs.omra}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <Icon name="pin" className="h-3.5 w-3.5" /> {c.startPoint}
        </p>
        <h3 className="font-display mt-1.5 text-xl leading-snug text-night">
          <Link href={`/${locale}/circuits/${c.slug}`} className="after:absolute after:inset-0 group-hover:text-gold-deep">
            {tr(c.title, locale)}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{tr(c.summary, locale)}</p>
        {highlights.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5 text-xs text-night">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-1 rounded-pill bg-ivory px-2.5 py-1 ring-1 ring-line">
                <Icon name="check" className="h-3 w-3 text-emerald" /> {h}
              </li>
            ))}
          </ul>
        )}
        {next && (
          <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald">
            <Icon name="calendar" className="h-4 w-4" />
            {x.nextDeparture} : {formatDate(next.date, locale, { day: "numeric", month: "short" })}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          {price === null ? (
            <span className="font-semibold text-night">{s.onRequest}</span>
          ) : (
            <p className="text-sm text-muted">
              {s.from} <strong className="font-display text-2xl font-medium text-night">{formatMad(price, locale)}</strong>{" "}
              <span className="text-xs">{c.pricingMode === "PER_GROUP" ? s.perGroup : s.perPerson}</span>
            </p>
          )}
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night text-gold-light transition group-hover:bg-gold group-hover:text-night" aria-hidden>
            <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
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
  const s = getSignature(locale).card;
  const variant = categoryVariant[a.category as keyof typeof categoryVariant] ?? "sunset";
  const price = publicPrice(a.priceMad, a.priceStatus);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Visual photo={photo} variant={variant} seed={hashSeed(a.slug)} className="h-full w-full" imgClassName="transition duration-700 group-hover:scale-[1.03]" title={tr(a.title, locale)} />
        {!photo && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/40">
              <Icon name={a.icon} className="h-7 w-7" />
            </span>
          </div>
        )}
        <span className="absolute start-3 top-3 flex items-center gap-1 rounded-pill bg-white/95 px-2.5 py-1 text-xs font-semibold text-night shadow-card">
          <Icon name={a.icon} className="h-3.5 w-3.5 text-gold-deep" /> {t.categories[a.category]}
        </span>
        <div className="absolute end-3 top-3 z-10">
          <FavoriteButton id={`activity:${a.slug}`} locale={locale} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg leading-snug text-night">
          <Link href={`/${locale}/activites/${a.slug}`} className="after:absolute after:inset-0 group-hover:text-gold-deep">
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
          {price === null ? (
            <span className="text-sm font-semibold text-night">{s.onRequest}</span>
          ) : price === 0 ? (
            <span className="text-sm font-semibold text-emerald">{t.common.free}</span>
          ) : (
            <span className="text-sm text-muted">
              {s.from} <strong className="font-display text-xl font-medium text-night">{formatMad(price, locale)}</strong>
            </span>
          )}
          <Icon name="arrow" className="h-5 w-5 text-gold-deep transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </div>
      </div>
    </article>
  );
}

export function SectionTitle({ eyebrow, title, text, center = false, light = false }: { eyebrow?: string; title: string; text?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow ${light ? "eyebrow-light" : ""}`}>{eyebrow}</p>}
      <h2 className={`font-display mt-3 text-4xl leading-[1.1] md:text-5xl ${light ? "text-white" : "text-night"}`}>{title}</h2>
      {text && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/80" : "text-muted"}`}>{text}</p>}
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
    <section className="relative isolate overflow-hidden bg-night pt-32 pb-16 text-white md:pt-40 md:pb-24">
      <div className="absolute inset-0 -z-10">
        <Visual photo={photo} variant={variant === "dawn" ? "sunset" : variant} seed={seed} className="h-full w-full" priority />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/90 via-night/55 to-night/40" />
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {eyebrow && <p className="eyebrow eyebrow-light">{eyebrow}</p>}
        <h1 className="font-display mt-3 max-w-3xl text-4xl leading-[1.08] md:text-6xl">{title}</h1>
        {text && <p className="mt-5 max-w-2xl text-lg text-white/85">{text}</p>}
      </div>
    </section>
  );
}

/** Frise d'étoiles à huit branches utilisée comme séparateur décoratif */
export function ZelligeBand({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`band-star h-6 w-full ${className}`} />;
}
