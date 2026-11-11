import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Photo } from "@/lib/photos";
import Reveal from "./Reveal";
import Visual from "./Visual";
import { Icon } from "./Icon";

/** textes de l'encart d'aide (les questions et réponses viennent de l'administration → Contenus) */
const help = {
  fr: { title: "Vous ne trouvez pas votre réponse ?", text: "Écrivez-nous : un conseiller vous répond par WhatsApp ou par e-mail.", ticket: "N°" },
  en: { title: "Can't find your answer?", text: "Write to us: an advisor will reply on WhatsApp or by e-mail.", ticket: "No." },
  ar: { title: "لم تجدوا جوابكم؟", text: "راسلونا: يجيبكم مستشار عبر واتساب أو البريد الإلكتروني.", ticket: "رقم" },
};

/** icône thématique déduite de la question (FR, EN, AR) ; à défaut, pastille d'information */
const themes: [RegExp, string][] = [
  // « حج » seul aussi dans « حجز » (réservation) : on cherche le mot « الحج » ou « حج » isolé
  [/omra|umrah|hajj|عمرة|الحج(?!ز)|(^|\s)حج(?!ز)/i, "moon"],
  [/réserv|confirm|booking|book|حجز|تأكيد/i, "calendar"],
  [/personnalis|sur mesure|sur-mesure|custom|tailor|تخصيص|حسب الطلب/i, "sparkle"],
  [/visa|passeport|passport|تأشير|جواز/i, "file"],
  [/annul|cancel|rembours|refund|إلغاء|استرجاع/i, "shield"],
  [/pai|pay|prix|price|tarif|acompte|deposit|dirham|devise|currency|دفع|سعر|أسعار|عملة|أداء|عربون/i, "tag"],
  [/\bvols?\b|avion|flight|airport|aéroport|طيران|مطار/i, "route"],
  [/hôtel|hotel|héberg|accommodation|bivouac|camp|nuit|فندق|إقامة|مخيم/i, "tent"],
  [/enfant|child|famil|bébé|baby|أطفال|طفل|عائلة/i, "users"],
  [/météo|weather|saison|season|quand|when|chaud|froid|طقس|موسم|متى/i, "sun"],
  [/transport|navette|transfer|voiture|\bcar\b|4x4|نقل|سيارة/i, "car"],
  [/bagage|luggage|valise|emporter|pack|أمتعة|حقيبة/i, "camera"],
];
const themeIcon = (q: string) => themes.find(([re]) => re.test(q))?.[1] ?? "info";

/** tampon circulaire décoratif (filigrane) */
function Stamp({ className = "", label, uid }: { className?: string; label: string; uid: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className={className}>
      <defs>
        <path id={uid} d="M60 60m-42 0a42 42 0 1 1 84 0a42 42 0 1 1 -84 0" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="55" strokeWidth="3" />
        <circle cx="60" cy="60" r="49" strokeWidth="1.2" strokeDasharray="3 4" />
        <circle cx="60" cy="60" r="30" strokeWidth="1.5" />
      </g>
      <text fontSize="11" fontWeight="700" letterSpacing="3" fill="currentColor" fontFamily="inherit">
        <textPath href={`#${uid}`}>{label}</textPath>
      </text>
      <path d="M45 61l10 10 20-22" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type FaqItem = { q: string; a: string };

/**
 * Questions fréquentes, façon carnet de voyage : photo en polaroïd, questions présentées comme des billets
 * (talon perforé avec numéro et icône), encart d'aide en carte postale.
 * Accordéon natif <details>/<summary> : clavier et lecteurs d'écran gérés par le navigateur, une seule réponse
 * ouverte à la fois (attribut name), ouverture animée là où le navigateur le permet (sinon instantanée).
 */
export default function FaqSection({
  locale,
  items,
  title,
  eyebrow = "FAQ",
  intro,
  photo,
  brandName,
  whatsapp,
  contactLabel,
  id = "faq",
}: {
  locale: Locale;
  items: FaqItem[];
  title: string;
  eyebrow?: string;
  intro?: string;
  photo?: Photo;
  brandName: string;
  whatsapp?: string | null;
  contactLabel: string;
  id?: string;
}) {
  if (items.length === 0) return null;
  const h = help[locale] ?? help.fr;
  const stampLabel = `${brandName.toUpperCase()} · FAQ · ${brandName.toUpperCase()} · FAQ ·`;
  return (
    <section id={id} className="faq-paper relative isolate scroll-mt-32 overflow-hidden py-section" aria-labelledby={`${id}-title`}>
      {/* tampons en filigrane */}
      <Stamp uid={`${id}-stamp-a`} label={stampLabel} className="absolute -end-10 top-16 -z-10 h-56 w-56 rotate-12 text-emerald/[0.09]" />
      <Stamp uid={`${id}-stamp-b`} label={stampLabel} className="absolute -bottom-12 start-[38%] -z-10 h-44 w-44 -rotate-12 text-gold-deep/[0.10]" />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
        {/* présentation : titre, polaroïd, carte postale */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`} className="font-display mt-3 text-4xl leading-tight text-night md:text-5xl">
            {title}
          </h2>
          {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}

          {photo && (
            <figure className="relative mx-auto mt-10 hidden max-w-sm -rotate-2 bg-white p-3 pb-4 shadow-[0_20px_40px_-18px_rgba(14,20,32,0.45)] ring-1 ring-black/5 sm:block rtl:rotate-2">
              <span aria-hidden className="absolute -top-3 start-1/2 h-7 w-28 -translate-x-1/2 rotate-[-4deg] bg-gold-light/70 shadow-sm rtl:translate-x-1/2" />
              <Visual photo={photo} className="aspect-[4/3] w-full" sizes="(max-width: 1024px) 384px, 384px" />
              <figcaption className="font-display mt-3 text-center text-lg text-night/80 italic">{brandName}</figcaption>
              <Stamp uid={`${id}-stamp-c`} label={stampLabel} className="absolute -end-8 -bottom-8 h-24 w-24 rotate-[-14deg] text-emerald/80" />
            </figure>
          )}

          {/* carte postale */}
          <div className="relative mt-10 rounded-sm bg-white p-6 shadow-card ring-1 ring-line">
            <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(135deg,var(--color-emerald)_0_10px,transparent_10px_20px,var(--color-gold)_20px_30px,transparent_30px_40px)]" />
            <div className="flex items-start gap-5">
              <div className="flex-1">
                <p className="font-display text-xl text-night">{h.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{h.text}</p>
              </div>
              {/* timbre */}
              <span aria-hidden className="grid h-16 w-14 shrink-0 rotate-3 place-items-center bg-emerald text-gold-light outline-2 outline-offset-[-5px] outline-white [outline-style:dashed]">
                <Icon name="mail" className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 border-t border-dashed border-line pt-5">
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp !py-2.5 text-sm">
                  <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
                </a>
              )}
              <Link href={`/${locale}/contact`} className="btn btn-primary !py-2.5 text-sm">
                {contactLabel} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        {/* billets */}
        <div className="faq-list space-y-4">
          {items.map((f, i) => (
            <Reveal key={i} delay={Math.min(i, 5) * 60}>
              <details name={`${id}-accordion`} className="faq-ticket group relative rounded-xl bg-white shadow-card ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0 open:ring-gold/60">
                <summary className="flex cursor-pointer list-none items-stretch rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-details-marker]:hidden">
                  {/* talon perforé : numéro et icône thématique */}
                  <span aria-hidden className="faq-stub relative flex w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-s-xl border-e-2 border-dashed border-line bg-ivory py-4 text-emerald transition group-open:bg-emerald group-open:text-gold-light sm:w-24">
                    <Icon name={themeIcon(f.q)} className="h-6 w-6" />
                    <span className="text-[11px] font-bold tracking-wider text-gold-deep group-open:text-gold-light">
                      {h.ticket} {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="flex flex-1 items-center gap-3 p-4 sm:p-5">
                    <span className="flex-1 font-semibold leading-snug text-night transition group-hover:text-gold-deep">{f.q}</span>
                    <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-gold-deep ring-1 ring-gold/40 transition duration-300 group-open:rotate-180 group-open:bg-gold group-open:text-night">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </span>
                </summary>
                <div className="relative border-t border-dashed border-line px-5 pt-4 pb-6 sm:ps-[7.25rem] sm:pe-14">
                  <p className="leading-relaxed text-ink/80">{f.a}</p>
                  {/* tampon « vu » qui apparaît à l'ouverture */}
                  <span aria-hidden className="faq-check absolute end-4 bottom-3 grid h-10 w-10 place-items-center rounded-full border-2 border-emerald/70 text-emerald/80">
                    <Icon name="check" className="h-5 w-5" />
                  </span>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
