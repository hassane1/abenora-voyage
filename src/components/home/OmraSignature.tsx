import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getSignature } from "@/i18n/signature";
import { tr } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import { waLink } from "@/lib/site";
import { Icon } from "../Icon";
import Visual from "../Visual";
import type { Photo } from "@/lib/photos";

export type OmraDeparture = { id: string; date: Date; circuit: { slug: string; title: unknown; days: number; priceAdultMad: number | null; priceStatus: string } };
export type OmraHotel = { label: string; detail: string };

/** Bloc signature Omra & Hajj : prochains départs, hôtels proches du Haram, encadrement, WhatsApp dédié */
export default function OmraSignature({ locale, photo, departures, hotels, whatsapp }: { locale: Locale; photo?: Photo; departures: OmraDeparture[]; hotels: OmraHotel[]; whatsapp: string }) {
  const s = getSignature(locale).omra;
  const card = getSignature(locale).card;
  const wa = waLink(whatsapp, s.whatsappMessage);
  return (
    <section id="omra" className="relative isolate scroll-mt-24 overflow-hidden bg-emerald py-section text-white" aria-labelledby="omra-title">
      {/* photo d'ambiance (emplacement « omra » dans Médias), fondue dans le vert pour garder le texte lisible */}
      {photo && (
        <>
          <Visual photo={photo} className="absolute inset-0 -z-20 h-full w-full" sizes="100vw" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald via-emerald/90 to-emerald/60 rtl:bg-gradient-to-l" />
        </>
      )}
      <div className="relative mx-auto max-w-7xl overflow-hidden px-4 lg:px-8">
        <span aria-hidden className="pattern-arch pointer-events-none absolute -end-24 -top-24 h-96 w-96 opacity-20" />
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow eyebrow-light">{s.eyebrow}</p>
            <h2 id="omra-title" className="font-display mt-3 text-4xl leading-tight md:text-5xl">
              {s.title}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/85">{s.text}</p>

            <h3 className="mt-10 text-sm font-semibold tracking-wide text-gold-light uppercase">{s.framing}</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {s.framingItems.map((it) => (
                <li key={it} className="flex gap-3 text-sm leading-snug text-white/90">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" /> {it}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <Icon name="whatsapp" className="h-5 w-5" /> {s.whatsapp}
                </a>
              )}
              <Link href={`/${locale}/destinations/omra-la-mecque-medine`} className="btn btn-outline-light">
                {s.seeAll} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/75">{s.hajj}</p>
          </div>

          <div className="grid gap-5">
            <div className="rounded-card bg-night/35 p-6 ring-1 ring-white/10 backdrop-blur-sm">
              <h3 className="flex items-center gap-2 font-semibold text-gold-light">
                <Icon name="calendar" className="h-5 w-5" /> {s.nextDates}
              </h3>
              {departures.length === 0 ? (
                <p className="mt-4 text-sm text-white/80">{s.noDates}</p>
              ) : (
                <ul className="mt-4 divide-y divide-white/10">
                  {departures.map((d) => (
                    <li key={d.id}>
                      <Link href={`/${locale}/circuits/${d.circuit.slug}`} className="group flex items-center gap-4 py-3">
                        <span className="grid w-14 shrink-0 place-items-center rounded-xl bg-white/10 py-1.5 text-center leading-tight">
                          <span className="font-display text-2xl">{formatDate(d.date, locale, { day: "numeric" })}</span>
                          <span className="text-[11px] tracking-wide text-gold-light uppercase">{formatDate(d.date, locale, { month: "short" })}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium group-hover:underline">{tr(d.circuit.title, locale)}</span>
                          <span className="block text-xs text-white/70">{s.days(d.circuit.days)}</span>
                        </span>
                        <span className="shrink-0 text-end text-sm">
                          {d.circuit.priceAdultMad !== null && d.circuit.priceStatus !== "DEMO" ? (
                            <>
                              <span className="block text-[11px] text-white/70">{card.from}</span>
                              <span className="font-semibold text-gold-light">{formatMad(d.circuit.priceAdultMad, locale)}</span>
                            </>
                          ) : (
                            <span className="text-white/80">{card.onRequest}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {hotels.length > 0 && (
              <div className="rounded-card bg-ivory p-6 text-ink">
                <h3 className="flex items-center gap-2 font-semibold text-emerald">
                  <Icon name="pin" className="h-5 w-5" /> {s.hotels}
                </h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {hotels.map((h) => (
                    <li key={h.label} className="rounded-xl bg-white p-3 ring-1 ring-line">
                      <span className="block text-sm font-semibold text-night">{h.label}</span>
                      {h.detail && <span className="mt-0.5 block text-xs text-muted">{h.detail}</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">{s.hotelsNote}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
