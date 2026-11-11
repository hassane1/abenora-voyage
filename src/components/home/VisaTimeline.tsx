import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getSignature } from "@/i18n/signature";
import { Icon } from "../Icon";

/** Bloc signature Visas USA / UK / Canada : frise des étapes du dossier */
export default function VisaTimeline({ locale }: { locale: Locale }) {
  const s = getSignature(locale).visa;
  return (
    <section id="visas" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-section lg:px-8" aria-labelledby="visa-title">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id="visa-title" className="font-display mt-3 text-4xl leading-tight text-night md:text-5xl">
            {s.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">{s.text}</p>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label={s.eyebrow}>
          {s.countries.map((c) => (
            <li key={c} className="rounded-pill bg-white px-4 py-2 text-sm font-semibold text-night ring-1 ring-line">
              {c}
            </li>
          ))}
        </ul>
      </div>

      <ol className="visa-steps mt-12 grid gap-6 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {s.steps.map((st, i) => (
          <li key={st.title} className="relative ps-14 md:ps-0">
            <span className="absolute start-0 top-0 grid h-10 w-10 place-items-center rounded-full bg-night font-display text-lg text-gold-light ring-4 ring-ivory md:relative md:mb-4">
              {i + 1}
            </span>
            <p className="font-semibold text-night">{st.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{st.text}</p>
          </li>
        ))}
      </ol>

      <Link href={`/${locale}/sur-mesure?service=visa#demande`} className="btn btn-primary mt-12">
        <Icon name="file" className="h-4 w-4" /> {s.cta}
      </Link>
    </section>
  );
}
