"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMad } from "@/lib/format";
import { useWhatsApp } from "./BrandProvider";
import type { PriceResult } from "@/lib/pricing";
import { TRIP_KEY } from "./useLocalList";
import { Icon } from "./Icon";
import QuickRequest from "./QuickRequest";

export type ComposerCircuit = {
  id: string;
  slug: string;
  title: string;
  days: number;
  nights: number;
  itinerary: { day: number; title: string; items: string[] }[];
};
export type ComposerActivity = { code: string; label: string; icon: string };
export type ComposerDestination = { slug: string; name: string; available: boolean };

type Start = "MARRAKECH" | "FES" | "MERZOUGA";

const T = {
  fr: {
    title: "Composez votre aventure à Merzouga",
    titleFor: (d: string) => `Composez votre aventure à ${d}`,
    standardHint: "Tentes nomades, ambiance authentique",
    luxeHint: "Tente privée, vrai lit, salle de bain",
    noCommitment: "Gratuit et sans engagement · aucun paiement en ligne",
    previewTitle: "Votre séjour sur mesure, en un clic",
    previewPoints: ["Programme jour par jour adapté à vos choix", "Estimation du prix immédiate", "Demande envoyée à notre équipe en 30 secondes"],
    start: "Ville de départ",
    starts: { MARRAKECH: "Marrakech", FES: "Fès", MERZOUGA: "Sur place à Merzouga" },
    duration: "Durée du séjour",
    travelers: "Voyageurs",
    persons: (n: number) => `${n} personne${n > 1 ? "s" : ""}`,
    lodging: "Type d'hébergement",
    standard: "Bivouac traditionnel",
    luxe: "Campement de luxe",
    activities: "Activités souhaitées",
    create: "Créer mon programme",
    yourProgram: "Votre programme",
    basedOn: "Basé sur le circuit",
    freeDay: "Journée libre dans le désert",
    freeDayItems: ["Petit-déjeuner au campement", "Activités au choix", "Dîner et nuit au bivouac"],
    included: "inclus",
    option: "option",
    minDaysMarrakech: "Depuis Marrakech, la route jusqu'à Merzouga est très longue (plus de 550 km) : le programme commence à 4 jours.",
    fesNote: "Départ de Fès : le transfert aller-retour Fès ↔ Merzouga n'est pas encore au catalogue. Il sera chiffré sur devis.",
    extraNights: (n: number) => `${n} nuit(s) supplémentaire(s) au désert : tarif sur devis, non inclus dans l'estimation.`,
    estimate: "Estimation",
    perPerson: "soit par personne",
    book: "Réserver ce programme",
    sendNow: "Envoyer ma demande",
    detailed: "Préciser l'âge des enfants, un voyage privé ou un code promo →",
    quote: "Demander un devis sur mesure",
    modify: "Modifier",
    stay: "Dromadaire et coucher de soleil",
  },
  en: {
    title: "Build your Merzouga adventure",
    titleFor: (d: string) => `Build your ${d} adventure`,
    standardHint: "Nomad tents, authentic atmosphere",
    luxeHint: "Private tent, real bed, bathroom",
    noCommitment: "Free, no obligation · no online payment",
    previewTitle: "Your tailor-made stay, in one click",
    previewPoints: ["Day-by-day programme matching your choices", "Instant price estimate", "Request sent to our team in 30 seconds"],
    start: "Departure city",
    starts: { MARRAKECH: "Marrakesh", FES: "Fez", MERZOUGA: "Already in Merzouga" },
    duration: "Length of stay",
    travelers: "Travellers",
    persons: (n: number) => `${n} traveller${n > 1 ? "s" : ""}`,
    lodging: "Accommodation",
    standard: "Traditional camp",
    luxe: "Luxury camp",
    activities: "Activities",
    create: "Create my programme",
    yourProgram: "Your programme",
    basedOn: "Based on the tour",
    freeDay: "Free day in the desert",
    freeDayItems: ["Breakfast at camp", "Activities of your choice", "Dinner and night in camp"],
    included: "included",
    option: "option",
    minDaysMarrakech: "From Marrakesh the drive to Merzouga is very long (over 550 km): the programme starts at 4 days.",
    fesNote: "Departure from Fez: the Fez ↔ Merzouga return transfer is not in the catalogue yet. It will be quoted on request.",
    extraNights: (n: number) => `${n} extra desert night(s): price on request, not included in the estimate.`,
    estimate: "Estimate",
    perPerson: "i.e. per person",
    book: "Book this programme",
    sendNow: "Send my request",
    detailed: "Add children's ages, a private trip or a promo code →",
    quote: "Request a tailor-made quote",
    modify: "Edit",
    stay: "Camel ride and sunset",
  },
  ar: {
    title: "صمّم مغامرتك في مرزوكة",
    titleFor: (d: string) => `صمّم مغامرتك في ${d}`,
    standardHint: "خيام بدوية وأجواء أصيلة",
    luxeHint: "خيمة خاصة وسرير وحمام",
    noCommitment: "مجاني ودون التزام · لا دفع عبر الإنترنت",
    previewTitle: "إقامتك حسب الطلب بنقرة واحدة",
    previewPoints: ["برنامج يوماً بيوم حسب اختياراتك", "تقدير فوري للسعر", "يصل طلبك إلى فريقنا في 30 ثانية"],
    start: "مدينة الانطلاق",
    starts: { MARRAKECH: "مراكش", FES: "فاس", MERZOUGA: "في عين المكان بمرزوكة" },
    duration: "مدة الإقامة",
    travelers: "المسافرون",
    persons: (n: number) => `${n} أشخاص`,
    lodging: "نوع الإقامة",
    standard: "مخيم تقليدي",
    luxe: "مخيم فاخر",
    activities: "الأنشطة المرغوبة",
    create: "أنشئ برنامجي",
    yourProgram: "برنامجك",
    basedOn: "مبني على جولة",
    freeDay: "يوم حر في الصحراء",
    freeDayItems: ["فطور في المخيم", "أنشطة حسب اختيارك", "عشاء ومبيت في المخيم"],
    included: "مشمول",
    option: "خيار",
    minDaysMarrakech: "الطريق من مراكش إلى مرزوكة طويلة جداً (أكثر من 550 كلم): يبدأ البرنامج من 4 أيام.",
    fesNote: "الانطلاق من فاس: النقل ذهاباً وإياباً سيُحدد سعره عند الطلب.",
    extraNights: (n: number) => `${n} ليالٍ إضافية في الصحراء: السعر عند الطلب.`,
    estimate: "تقدير",
    perPerson: "أي للفرد",
    book: "احجز هذا البرنامج",
    sendNow: "أرسل طلبي",
    detailed: "أضف أعمار الأطفال أو رحلة خاصة أو رمزاً ترويجياً ←",
    quote: "اطلب عرض سعر حسب الطلب",
    modify: "تعديل",
    stay: "جولة على الجمل والغروب",
  },
};

const DURATIONS = [2, 3, 4, 5];

function StepNum({ n }: { n: number }) {
  return <span className="grid h-6 w-6 place-items-center rounded-full bg-sand/25 text-xs font-bold text-terracotta">{n}</span>;
}

export default function TripComposer({
  locale,
  circuits,
  activities,
  destinations = [],
  luxePrice = null,
  previewImage = null,
}: {
  previewImage?: string | null;
  locale: Locale;
  circuits: ComposerCircuit[];
  activities: ComposerActivity[];
  destinations?: ComposerDestination[];
  luxePrice?: number | null;
}) {
  const t = T[locale];
  const whatsappLink = useWhatsApp();
  const d = getDictionary(locale);
  const router = useRouter();
  const resultRef = useRef<HTMLDivElement>(null);
  const [destination, setDestination] = useState(destinations.find((x) => x.slug === "merzouga")?.slug ?? destinations[0]?.slug ?? "merzouga");
  const destName = destinations.find((x) => x.slug === destination)?.name ?? "Merzouga";
  const [start, setStart] = useState<Start>("MARRAKECH");
  const [days, setDays] = useState(4);
  const [travelers, setTravelers] = useState(2);
  const [luxe, setLuxe] = useState(true);
  const [picked, setPicked] = useState<string[]>(["camel"]);
  const [result, setResult] = useState<null | {
    circuit: ComposerCircuit;
    program: { day: number; title: string; items: { text: string; tag?: string }[] }[];
    notes: string[];
    price: PriceResult | null;
    optionCodes: string[];
    summary: string;
    travelers: number;
    departureCity: string;
  }>(null);
  const [loading, setLoading] = useState(false);

  const bySlug = (s: string) => circuits.find((c) => c.slug === s);
  const effectiveDays = start === "MARRAKECH" ? Math.max(4, days) : days;

  const create = async () => {
    setLoading(true);
    const notes: string[] = [];
    if (start === "MARRAKECH" && days < 4) notes.push(t.minDaysMarrakech);
    if (start === "FES") notes.push(t.fesNote);

    // circuit de base selon le départ et la durée
    const base =
      start === "MARRAKECH"
        ? bySlug("grand-sud-marocain-4j")
        : effectiveDays <= 2
          ? bySlug("escapade-saharienne-2j")
          : bySlug("immersion-desert-3j");
    if (!base) return setLoading(false);

    type Item = { text: string; tag?: string };
    const program: { day: number; title: string; items: Item[] }[] = base.itinerary.map((day) => ({ day: day.day, title: day.title, items: day.items.map((text) => ({ text })) }));
    const extra = Math.max(0, effectiveDays - base.days);
    // jours libres insérés avant le dernier jour (retour)
    for (let i = 0; i < extra; i++) {
      program.splice(program.length - 1, 0, { day: 0, title: t.freeDay, items: t.freeDayItems.map((text) => ({ text })) });
    }
    program.forEach((p, i) => (p.day = i + 1));
    if (extra > 0) notes.push(t.extraNights(extra));

    // répartition des activités sur les jours passés au désert
    const desertDays = start === "MARRAKECH" ? program.filter((p) => p.day >= 3 && p.day < program.length) : program.filter((p) => p.day < program.length || program.length === 1);
    const slots = desertDays.length ? desertDays : [program[0]];
    const optionCodes: string[] = [luxe ? "camp-luxe" : "camp-standard"];
    picked
      .filter((c) => c !== "camel")
      .forEach((code, i) => {
        const a = activities.find((x) => x.code === code);
        if (!a) return;
        slots[(i + (slots.length > 1 ? 1 : 0)) % slots.length].items.push({ text: a.label, tag: t.option });
        optionCodes.push(code);
      });
    if (picked.includes("camel")) {
      // la balade est déjà au programme des circuits : on la signale « incluse » plutôt que de la dupliquer
      const existing = program.flatMap((p) => p.items).find((it) => /dromadaire|camel|الجمل/i.test(it.text));
      if (existing) existing.tag = t.included;
      else program[Math.min(program.length - 1, start === "MARRAKECH" ? 2 : 0)].items.push({ text: t.stay, tag: t.included });
    }

    let price: PriceResult | null = null;
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circuitId: base.id, adults: travelers, childAges: [], privateTour: false, optionCodes, locale }),
      });
      price = (await res.json()).price ?? null;
    } catch {
      price = null;
    }
    const actLabels = picked.map((c) => activities.find((a) => a.code === c)?.label).filter(Boolean).join(", ");
    const summary = [
      `${T.fr.starts[start]} · ${effectiveDays} j / ${effectiveDays - 1} n · ${travelers} pers. · ${luxe ? T.fr.luxe : T.fr.standard}`,
      `Circuit de base : ${base.slug}`,
      actLabels && `Activités : ${actLabels}`,
      extra > 0 && `${extra} nuit(s) supplémentaire(s) au désert à chiffrer`,
      start === "FES" && "Transfert Fès ↔ Merzouga à organiser et chiffrer",
    ]
      .filter(Boolean)
      .join(" | ");
    setResult({ circuit: base, program, notes, price, optionCodes, summary, travelers, departureCity: T.fr.starts[start] });
    setLoading(false);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const book = () => {
    if (!result) return;
    try {
      window.localStorage.setItem(TRIP_KEY, JSON.stringify(result.optionCodes.filter((c) => !c.startsWith("camp-standard"))));
      window.dispatchEvent(new Event("rimal-storage"));
    } catch {}
    router.push(`/${locale}/reservation?circuit=${result.circuit.slug}`);
  };

  const wa =
    result &&
    whatsappLink(
      `${t.yourProgram} — ${t.starts[start]}, ${d.common.daysNights(effectiveDays, effectiveDays - 1)}, ${t.persons(travelers)}, ${luxe ? t.luxe : t.standard}${
        picked.length ? ` — ${picked.map((c) => activities.find((a) => a.code === c)?.label).filter(Boolean).join(", ")}` : ""
      }`,
    );

  return (
    <div>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr] lg:items-start">
      {/* Formulaire */}
      <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_80px_-40px_rgba(20,40,63,0.55)] ring-1 ring-night/10">
        {/* En-tête : destination */}
        <div className="relative isolate overflow-hidden bg-night px-6 py-6 text-white sm:px-7">
          <div aria-hidden className="absolute -end-10 -top-10 -z-10 h-40 w-40 rounded-full bg-sand/20 blur-2xl" />
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-[1.9rem] font-semibold leading-tight">{t.titleFor(destName)}</h3>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-sand-light ring-1 ring-white/15" title={d.common.demoPriceLong}>
              {locale === "en" ? "Demo prices" : locale === "ar" ? "أسعار تجريبية" : "Tarifs démo"}
            </span>
          </div>
          <label className="mt-4 block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">{d.home.searchDestination}</span>
            <span className="relative mt-1.5 flex items-center">
              <Icon name="pin" className="pointer-events-none absolute start-4 h-5 w-5 text-sand" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full appearance-none rounded-2xl bg-white py-3.5 pe-10 ps-12 text-[17px] font-semibold text-night outline-none ring-2 ring-transparent transition focus:ring-sand"
              >
                {destinations.map((dd) => (
                  <option key={dd.slug} value={dd.slug} disabled={!dd.available}>
                    {dd.name}
                    {!dd.available ? ` — ${d.home.comingTitle.toLowerCase()}` : ""}
                  </option>
                ))}
              </select>
              <Icon name="arrow" className="pointer-events-none absolute end-4 h-4 w-4 rotate-90 text-night/50" />
            </span>
          </label>
        </div>

        <div className="space-y-6 p-6 sm:p-7">
          {/* 1. Départ */}
          <fieldset role="radiogroup">
            <legend className="flex items-center gap-2 text-sm font-bold text-night">
              <StepNum n={1} /> {t.start}
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(Object.keys(t.starts) as Start[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={start === s}
                  onClick={() => {
                    setStart(s);
                    if (s === "MARRAKECH" && days < 4) setDays(4);
                  }}
                  className={`rounded-2xl px-2 py-3 text-center text-sm font-semibold leading-tight transition ${
                    start === s ? "bg-night text-white shadow-md" : "bg-ivory text-night ring-1 ring-night/10 hover:ring-sand"
                  }`}
                >
                  {t.starts[s]}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 2. Durée + voyageurs */}
          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-bold text-night">
                <StepNum n={2} /> {t.duration}
              </span>
              <span className="relative mt-3 flex items-center">
                <Icon name="calendar" className="pointer-events-none absolute start-4 h-4 w-4 text-terracotta" />
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full appearance-none rounded-2xl bg-ivory py-3 pe-9 ps-11 font-semibold text-night outline-none ring-1 ring-night/10 focus:ring-2 focus:ring-sand">
                  {DURATIONS.map((n) => (
                    <option key={n} value={n} disabled={start === "MARRAKECH" && n < 4}>
                      {d.common.daysNights(n, n - 1)}
                    </option>
                  ))}
                </select>
                <Icon name="arrow" className="pointer-events-none absolute end-3.5 h-4 w-4 rotate-90 text-night/40" />
              </span>
            </label>
            <div>
              <span className="text-sm font-bold text-night">{t.travelers}</span>
              <div className="mt-3 flex items-center gap-1 rounded-2xl bg-ivory p-1.5 ring-1 ring-night/10">
                <button type="button" onClick={() => setTravelers(Math.max(1, travelers - 1))} disabled={travelers <= 1} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-night shadow-sm disabled:opacity-30" aria-label="−">
                  <Icon name="minus" className="h-4 w-4" />
                </button>
                <span className="min-w-[5.5rem] text-center text-sm font-semibold text-night" aria-live="polite">
                  {t.persons(travelers)}
                </span>
                <button type="button" onClick={() => setTravelers(Math.min(10, travelers + 1))} disabled={travelers >= 10} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-night shadow-sm disabled:opacity-30" aria-label="+">
                  <Icon name="plus" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {start === "MARRAKECH" && days < 4 && <p className="-mt-3 text-xs text-terracotta">{t.minDaysMarrakech}</p>}

          {/* 3. Hébergement */}
          <fieldset role="radiogroup">
            <legend className="flex items-center gap-2 text-sm font-bold text-night">
              <StepNum n={3} /> {t.lodging}
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { on: !luxe, set: () => setLuxe(false), icon: "tent", label: t.standard, hint: t.standardHint, price: d.common.free },
                { on: luxe, set: () => setLuxe(true), icon: "star", label: t.luxe, hint: t.luxeHint, price: luxePrice ? `+${formatMad(luxePrice, locale)} ${d.booking.units.PER_PERSON_NIGHT}` : "" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={o.on}
                  onClick={o.set}
                  className={`relative rounded-2xl p-4 text-start transition ${o.on ? "bg-sand/15 ring-2 ring-sand" : "bg-white ring-1 ring-night/10 hover:ring-sand/60"}`}
                >
                  <Icon name={o.icon} className={`h-6 w-6 ${o.on ? "text-terracotta" : "text-night/50"}`} />
                  <span className="mt-2 block font-semibold leading-tight text-night">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>
                  {o.price && <span className="mt-2 block text-xs font-bold text-night">{o.price}</span>}
                  {o.on && (
                    <span className="absolute end-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-terracotta text-white">
                      <Icon name="check" className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 4. Activités */}
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-bold text-night">
              <StepNum n={4} /> {t.activities}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {activities.map((a) => {
                const on = picked.includes(a.code);
                return (
                  <label
                    key={a.code}
                    className={`flex cursor-pointer items-center gap-2 rounded-full py-2 pe-4 ps-2 text-sm font-medium transition ${
                      on ? "bg-night text-white shadow-md" : "bg-white text-night ring-1 ring-night/15 hover:ring-sand"
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== a.code) : [...picked, a.code])} />
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${on ? "bg-sand text-night" : "bg-ivory text-terracotta"}`}>
                      <Icon name={on ? "check" : a.icon} className="h-4 w-4" />
                    </span>
                    {a.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={create}
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta py-4 text-lg font-semibold text-white shadow-[0_12px_30px_-12px_rgba(185,101,67,0.8)] transition hover:bg-terracotta-dark disabled:opacity-60"
          >
            <Icon name="sparkle" className="h-5 w-5" />
            {loading ? d.common.loading : t.create}
            <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180" />
          </button>
          <p className="-mt-3 text-center text-xs text-muted">{t.noCommitment}</p>
        </div>
      </div>

{/* Programme généré */}
      <div ref={resultRef} className="scroll-mt-28">
        {!result ? (
          <div className="relative isolate hidden min-h-[600px] overflow-hidden lg:sticky lg:top-24 rounded-[1.75rem] text-white lg:flex lg:flex-col lg:justify-end">
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 -z-10 bg-night" />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/40 to-transparent" />
            <div className="p-8">
              <p className="eyebrow !text-sand">{t.yourProgram}</p>
              <p className="font-display mt-2 text-4xl font-semibold leading-tight">{t.previewTitle}</p>
              <ul className="mt-5 space-y-2 text-white/85">
                {t.previewPoints.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-sand" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] bg-night p-6 text-white sm:p-8">
            <p className="eyebrow !text-sand">{t.yourProgram}</p>
            <h3 className="font-display mt-1 text-3xl font-semibold">
              {t.starts[start]} · {d.common.daysNights(effectiveDays, effectiveDays - 1)}
            </h3>
            <p className="mt-1 text-sm text-white/60">
              {t.basedOn} « {result.circuit.title} » · {t.persons(travelers)} · {luxe ? t.luxe : t.standard}
            </p>

            {result.notes.map((n) => (
              <p key={n} className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-sand-light">
                ⓘ {n}
              </p>
            ))}

            <ol className="mt-6 space-y-5 border-s border-white/15 ps-6">
              {result.program.map((p) => (
                <li key={p.day} className="relative">
                  <span className="absolute -start-[37px] top-0 grid h-6 w-6 place-items-center rounded-full bg-terracotta text-xs font-bold">{p.day}</span>
                  <p className="font-semibold text-sand">{p.title}</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-white/80">
                    {p.items.map((it, i) => (
                      <li key={i}>
                        • {it.text}
                        {it.tag && <span className={`ms-2 rounded-full px-2 py-0.5 text-[10px] ${it.tag === t.included ? "bg-emerald-400/20 text-emerald-200" : "bg-sand/20 text-sand"}`}>{it.tag}</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>

            {result.price && !result.price.onRequest && (
              <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-white/70">{t.estimate}</span>
                  <span className="font-display text-3xl font-semibold text-sand">{formatMad(result.price.total, locale)}</span>
                </div>
                <p className="text-end text-xs text-white/60">
                  {t.perPerson} {formatMad(Math.round(result.price.total / travelers), locale)}
                </p>
                {result.price.isDemo && <p className="mt-2 text-[11px] text-sand-light">● {d.common.demoPriceLong}</p>}
              </div>
            )}

            <div className="no-print mt-6 flex flex-wrap gap-3">
              <a href="#demande-express" className="btn btn-sand">
                {t.sendNow} <Icon name="arrow" className="h-4 w-4 rotate-90" />
              </a>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white">
                  <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
                </a>
              )}
              <button type="button" onClick={() => window.print()} className="btn btn-ghost text-white">
                <Icon name="print" className="h-4 w-4" /> PDF
              </button>
            </div>
            <button type="button" onClick={book} className="no-print mt-4 text-sm text-white/70 underline-offset-4 hover:text-sand hover:underline">
              {t.detailed}
            </button>
          </div>
        )}
      </div>
      </div>

      {result && (
        <div className="mt-8">
          <QuickRequest
            key={`${result.circuit.id}-${result.summary}`}
            locale={locale}
            circuitId={result.circuit.id}
            nights={result.circuit.nights}
            travelers={result.travelers}
            optionCodes={result.optionCodes}
            departureCity={result.departureCity}
            summary={result.summary}
          />
        </div>
      )}
    </div>
  );
}
