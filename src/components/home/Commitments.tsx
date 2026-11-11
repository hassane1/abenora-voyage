import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getSignature } from "@/i18n/signature";
import type { Photo } from "@/lib/photos";
import Reveal from "../Reveal";
import Visual from "../Visual";
import { Icon } from "../Icon";

/**
 * « Nos engagements » : affiché à la place des avis tant qu'aucun avis vérifié n'est publié.
 * Fond nuit avec motif zellige et halo doré ; chaque carte a une petite photo (emplacements « engagement-1 » à 6
 * dans Médias, visuel de marque à défaut) et une icône en médaillon.
 */
export default function Commitments({ locale, photos = [], whatsapp, contactLabel }: { locale: Locale; photos?: (Photo | undefined)[]; whatsapp?: string | null; contactLabel: string }) {
  const s = getSignature(locale).commitments;
  const variants = ["sunset", "dawn", "dusk", "night", "noon", "sunset"] as const;
  return (
    <section className="relative isolate overflow-hidden bg-night py-section text-white" aria-labelledby="engagements-title">
      {/* décor : zellige en filigrane et halos dorés */}
      <div aria-hidden className="pattern-zellige absolute inset-0 -z-10 opacity-[0.07]" />
      <div aria-hidden className="absolute -top-40 start-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gold/15 blur-3xl rtl:translate-x-1/2" />
      <div aria-hidden className="absolute -bottom-48 -end-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-emerald/40 blur-3xl" />
      <span aria-hidden className="band-star absolute inset-x-0 top-0" />

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-light">{s.eyebrow}</p>
            <h2 id="engagements-title" className="font-display mt-3 text-4xl leading-tight md:text-5xl">
              {s.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">{s.text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
              </a>
            )}
            <Link href={`/${locale}/contact`} className="btn btn-outline-light">
              {contactLabel} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {s.items.map((it, i) => (
            <Reveal as="li" key={it.title} delay={(i % 3) * 90}>
              <article className="group relative flex h-full overflow-hidden rounded-card bg-gradient-to-b from-white/[0.07] to-white/[0.02] ring-1 ring-gold/25 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_-18px_rgba(201,162,75,0.55)] hover:ring-gold/60 motion-reduce:hover:translate-y-0 sm:flex-col">
                {/* photo : vignette carrée sur mobile, bandeau 16:9 au-dessus du texte à partir de sm */}
                <div className="relative w-28 shrink-0 overflow-hidden sm:aspect-[16/9] sm:w-full">
                  <Visual photo={photos[i]} variant={variants[i % variants.length]} seed={i * 17 + 5} className="h-full w-full" imgClassName="transition duration-700 group-hover:scale-[1.05]" sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 400px" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/10 to-transparent" />
                  <span aria-hidden className="font-display absolute end-3 top-2 text-sm text-gold-light/90 sm:text-base">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="relative flex-1 p-4 sm:px-6 sm:pt-9 sm:pb-6">
                  {/* médaillon : à cheval sur la photo à partir de sm */}
                  <span aria-hidden className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold text-night shadow-[0_6px_20px_-6px_rgba(201,162,75,0.8)] ring-4 ring-night sm:absolute sm:-top-7 sm:start-6 sm:mb-0 sm:h-14 sm:w-14">
                    <Icon name={it.icon} className="h-4 w-4 sm:h-6 sm:w-6" />
                  </span>
                  <h3 className="font-display text-lg leading-snug text-white sm:text-xl">{it.title}</h3>
                  <span aria-hidden className="mt-2 block h-px w-10 bg-gold/70 transition-all duration-300 group-hover:w-16" />
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{it.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
