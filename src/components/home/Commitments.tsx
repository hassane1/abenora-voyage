import type { Locale } from "@/i18n/config";
import { getSignature } from "@/i18n/signature";
import { Icon } from "../Icon";

/** « Nos engagements » : affiché à la place des avis tant qu'aucun avis vérifié n'est publié */
export default function Commitments({ locale }: { locale: Locale }) {
  const s = getSignature(locale).commitments;
  return (
    <section className="bg-white py-section" aria-labelledby="engagements-title">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id="engagements-title" className="font-display mt-3 text-4xl leading-tight text-night md:text-5xl">
            {s.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">{s.text}</p>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-card bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((it) => (
            <li key={it.title} className="bg-white p-7">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald/10 text-emerald">
                <Icon name={it.icon} className="h-5 w-5" />
              </span>
              <p className="mt-4 font-semibold text-night">{it.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{it.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
