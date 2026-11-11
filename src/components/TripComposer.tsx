"use client";

import Image from "next/image";
import { useActionState, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatMad } from "@/lib/format";
import { arCount, buildProgram, lengthLabel, onSiteKey, startCities, travelFrom, tripLength, type ComposerPrice, type ProgramDay } from "@/lib/composer-engine";
import type { ComposerDestination, ComposerDestinationData } from "@/lib/composer-data";
import { submitRequest, type FormState } from "@/app/[locale]/forms-actions";
import { useWhatsApp } from "./BrandProvider";
import { Icon } from "./Icon";

const T = {
  fr: {
    titleFor: (d: string) => `Créez votre voyage sur mesure — ${d}`,
    demo: "Tarifs démo",
    demoLong: "Tarifs de démonstration, non contractuels : le prix définitif vous est communiqué dans le devis de l'agence.",
    destination: "Destination",
    morocco: "Maroc",
    abroad: "International",
    start: "Ville de départ",
    onSite: (d: string) => `Sur place à ${d}`,
    onSiteGroup: "Déjà sur place",
    fromGroup: "Au départ de…",
    airportsGroup: "Aéroports",
    road: (h: string) => `environ ${h} h de route`,
    flight: (h: string) => `environ ${h} h de vol (selon compagnie et escale)`,
    duration: "Nuits d'hôtel",
    nightsOpt: (n: number) => (n > 1 ? `${n} nuits` : "1 nuit"),
    travelers: "Voyageurs",
    persons: (n: number) => `${n} personne${n > 1 ? "s" : ""}`,
    lodging: "Hébergement",
    perNight: "/ nuit / pers.",
    options: "Activités en option",
    create: "Créer mon programme",
    noCommitment: "Gratuit et sans engagement · aucun paiement en ligne",
    previewTitle: "Votre voyage sur mesure, en un clic",
    previewPoints: ["Programme jour par jour adapté à vos choix", "Estimation immédiate (tarifs démo)", "Demande envoyée à notre équipe en 30 secondes"],
    seasons: "Meilleure période",
    tips: "Bon à savoir",
    yourProgram: "Votre programme",
    estimate: "Estimation",
    perPerson: "soit par personne",
    send: "Envoyer ma demande",
    modify: "Modifier",
    formTitle: "Recevoir mon devis personnalisé",
    formIntro: "Laissez vos coordonnées : l'agence vérifie les disponibilités et vous envoie un devis réel. Aucun paiement à cette étape.",
    name: "Nom complet",
    email: "E-mail",
    phone: "Téléphone / WhatsApp",
    date: "Date de départ souhaitée",
    message: "Un souhait particulier ? (facultatif)",
    consent: "J'accepte que mes données soient utilisées pour traiter ma demande.",
    submit: "Envoyer ma demande de devis",
    sent: (r: string) => `Merci ! Votre demande ${r} est bien envoyée. Un conseiller vous répond rapidement.`,
    error: "L'envoi n'a pas abouti. Vérifiez les champs ou écrivez-nous sur WhatsApp.",
    level: { FACILE: "facile", MODERE: "modéré", SPORTIF: "sportif" },
    loading: "Chargement…",
  },
  en: {
    titleFor: (d: string) => `Create your tailor-made trip — ${d}`,
    demo: "Demo prices",
    demoLong: "Demonstration prices, not binding: the final price is given in the agency's quote.",
    destination: "Destination",
    morocco: "Morocco",
    abroad: "International",
    start: "Departure city",
    onSite: (d: string) => `Already in ${d}`,
    onSiteGroup: "Already there",
    fromGroup: "Departing from…",
    airportsGroup: "Airports",
    road: (h: string) => `about ${h} h by road`,
    flight: (h: string) => `about ${h} h flight (depending on airline and stopover)`,
    duration: "Hotel nights",
    nightsOpt: (n: number) => (n > 1 ? `${n} nights` : "1 night"),
    travelers: "Travellers",
    persons: (n: number) => `${n} traveller${n > 1 ? "s" : ""}`,
    lodging: "Accommodation",
    perNight: "/ night / pers.",
    options: "Optional activities",
    create: "Create my programme",
    noCommitment: "Free, no obligation · no online payment",
    previewTitle: "Your tailor-made trip, in one click",
    previewPoints: ["Day-by-day programme matching your choices", "Instant estimate (demo prices)", "Request sent to our team in 30 seconds"],
    seasons: "Best time to go",
    tips: "Good to know",
    yourProgram: "Your programme",
    estimate: "Estimate",
    perPerson: "i.e. per person",
    send: "Send my request",
    modify: "Edit",
    formTitle: "Get my personalised quote",
    formIntro: "Leave your details: the agency checks availability and sends you a real quote. No payment at this stage.",
    name: "Full name",
    email: "E-mail",
    phone: "Phone / WhatsApp",
    date: "Preferred departure date",
    message: "Any special wish? (optional)",
    consent: "I agree that my data is used to handle my request.",
    submit: "Send my quote request",
    sent: (r: string) => `Thank you! Your request ${r} has been sent. An advisor will reply shortly.`,
    error: "Sending failed. Please check the fields or write to us on WhatsApp.",
    level: { FACILE: "easy", MODERE: "moderate", SPORTIF: "active" },
    loading: "Loading…",
  },
  ar: {
    titleFor: (d: string) => `صمّم رحلتك حسب الطلب — ${d}`,
    demo: "أسعار تجريبية",
    demoLong: "أسعار تجريبية غير ملزمة: يُبلَّغ السعر النهائي في عرض الوكالة.",
    destination: "الوجهة",
    morocco: "المغرب",
    abroad: "دولي",
    start: "مدينة الانطلاق",
    onSite: (d: string) => `في عين المكان: ${d}`,
    onSiteGroup: "في عين المكان",
    fromGroup: "انطلاقاً من…",
    airportsGroup: "المطارات",
    road: (h: string) => `حوالي ${h} ساعة بالطريق`,
    flight: (h: string) => `حوالي ${h} ساعة طيران (حسب الشركة والتوقف)`,
    duration: "ليالي الفندق",
    nightsOpt: (n: number) => arCount(n, "ليلة واحدة", "ليلتان", "ليالٍ", "ليلة"),
    travelers: "المسافرون",
    persons: (n: number) => `${n} ${n > 2 && n < 11 ? "أشخاص" : "شخص"}`,
    lodging: "الإقامة",
    perNight: "/ ليلة / للفرد",
    options: "أنشطة اختيارية",
    create: "أنشئ برنامجي",
    noCommitment: "مجاني ودون التزام · لا دفع عبر الإنترنت",
    previewTitle: "رحلتك حسب الطلب بنقرة واحدة",
    previewPoints: ["برنامج يوماً بيوم حسب اختياراتك", "تقدير فوري (أسعار تجريبية)", "يصل طلبك إلى فريقنا في 30 ثانية"],
    seasons: "أفضل فترة",
    tips: "معلومات مفيدة",
    yourProgram: "برنامجك",
    estimate: "تقدير",
    perPerson: "أي للفرد",
    send: "أرسل طلبي",
    modify: "تعديل",
    formTitle: "احصل على عرض سعر مخصص",
    formIntro: "اترك معلوماتك: تتحقق الوكالة من التوفر وترسل لك عرضاً حقيقياً. لا دفع في هذه المرحلة.",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "الهاتف / واتساب",
    date: "تاريخ الانطلاق المرغوب",
    message: "رغبة خاصة؟ (اختياري)",
    consent: "أوافق على استعمال معطياتي لمعالجة طلبي.",
    submit: "إرسال طلب عرض السعر",
    sent: (r: string) => `شكراً! تم إرسال طلبك ${r}. سيجيبك مستشار قريباً.`,
    error: "تعذر الإرسال. تحقق من الحقول أو راسلنا عبر واتساب.",
    level: { FACILE: "سهل", MODERE: "متوسط", SPORTIF: "رياضي" },
    loading: "جارٍ التحميل…",
  },
};

const fmtHours = (h: number, locale: Locale) => (Number.isInteger(h) ? String(h) : String(h).replace(".", locale === "en" ? "." : ","));

function StepNum({ n }: { n: number }) {
  return (
    <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-gold/25 text-xs font-bold text-gold-deep">
      {n}
    </span>
  );
}

export default function TripComposer({ locale, destinations, initial }: { locale: Locale; destinations: ComposerDestination[]; initial: ComposerDestinationData | null }) {
  const t = T[locale];
  const whatsappLink = useWhatsApp();
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ComposerDestinationData | null>(initial);
  const [slug, setSlug] = useState(initial?.slug ?? destinations[0]?.slug ?? "");
  const [loadingDest, setLoadingDest] = useState(false);
  const cfg = data?.config;
  const [city, setCity] = useState<string>(initial?.config.onSite ? onSiteKey : "casablanca");
  const [nights, setNights] = useState(initial?.config.durations.default ?? 2);
  const [travelers, setTravelers] = useState(2);
  const [lodging, setLodging] = useState(initial?.config.lodging[1]?.key ?? initial?.config.lodging[0]?.key ?? "");
  const [options, setOptions] = useState<string[]>([]);
  const [result, setResult] = useState<null | { program: ProgramDay[]; price: ComposerPrice | null; summary: string }>(null);
  const [loading, setLoading] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(submitRequest, null);

  // changement de destination : chargement de son programme et remise à zéro des choix dépendants
  const reqId = useRef(0);
  const changeDestination = (next: string) => {
    setSlug(next);
    if (!next || next === data?.slug) return;
    const id = ++reqId.current;
    setLoadingDest(true);
    fetch(`/api/composer?slug=${encodeURIComponent(next)}&locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: ComposerDestinationData | null) => {
        if (id !== reqId.current || !j) return; // une sélection plus récente l'emporte
        setData(j);
        setResult(null);
        setOptions([]);
        setNights(j.config.durations.default);
        setLodging(j.config.lodging[1]?.key ?? j.config.lodging[0]?.key ?? "");
        const starts = startCities(j.cities, j.config);
        setCity((prev) => (j.config.onSite ? onSiteKey : starts.some((c) => c.key === prev) ? prev : (starts.find((c) => c.key === "casablanca") ?? starts[0])?.key ?? onSiteKey));
      })
      .finally(() => id === reqId.current && setLoadingDest(false));
  };

  const starts = useMemo(() => (data ? startCities(data.cities, data.config) : []), [data]);
  const travel = data ? travelFrom(data.cities, data.config, data.pos, city) : null;
  const travelHint = travel && travel.kind !== "NONE" ? (travel.kind === "FLIGHT" ? t.flight(fmtHours(travel.hours, locale)) : t.road(fmtHours(travel.hours, locale))) : null;

  if (!data || !cfg) return null;
  const len = tripLength(data.cities, cfg, data.pos, city, nights);
  const durations = Array.from({ length: cfg.durations.max - cfg.durations.min + 1 }, (_, i) => cfg.durations.min + i);
  const lodgingObj = cfg.lodging.find((l) => l.key === lodging) ?? cfg.lodging[0];

  const create = async () => {
    setLoading(true);
    const choice = { destination: data.slug, city, nights, travelers, lodging: lodgingObj.key, options };
    const program = buildProgram(data.cities, cfg, data.pos, choice, locale);
    let price: ComposerPrice | null = null;
    try {
      const res = await fetch("/api/composer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice, locale }) });
      price = res.ok ? ((await res.json()).price ?? null) : null;
    } catch {
      price = null;
    }
    const cityLabel = city === onSiteKey ? t.onSite(data.name) : (starts.find((c) => c.key === city)?.name[locale] ?? city);
    const summary = `${data.name} · ${cityLabel} · ${lengthLabel(locale, len.days, len.nights, len.travelDay)} · ${t.persons(travelers)} · ${lodgingObj.label[locale]}${
      options.length ? ` · ${options.map((o) => cfg.options.find((x) => x.code === o)?.label[locale]).filter(Boolean).join(", ")}` : ""
    }`;
    setResult({ program, price, summary });
    setLoading(false);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const choiceJson = JSON.stringify({ destination: data.slug, city, nights, travelers, lodging: lodgingObj.key, options });
  const wa = result && whatsappLink(`${t.yourProgram} — ${result.summary}`);
  const national = destinations.filter((x) => x.scope === "NATIONAL");
  const international = destinations.filter((x) => x.scope === "INTERNATIONAL");
  const selectCls = "w-full appearance-none rounded-2xl bg-ivory py-3 pe-9 ps-11 font-semibold text-night outline-none ring-1 ring-night/10 focus:ring-2 focus:ring-gold";

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr] lg:items-start">
        {/* ─── Formulaire ─── */}
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-float ring-1 ring-night/10">
          <div className="relative isolate overflow-hidden bg-night px-6 py-6 text-white sm:px-7">
            <div aria-hidden className="absolute -end-10 -top-10 -z-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-[1.75rem] font-semibold leading-tight">{t.titleFor(data.name)}</h3>
              <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-gold-light ring-1 ring-white/15" title={t.demoLong}>
                {t.demo}
              </span>
            </div>
            <label className="mt-4 block">
              <span className="text-[11px] font-bold tracking-wider text-white/70 uppercase">{t.destination}</span>
              <span className="relative mt-1.5 flex items-center">
                <Icon name="pin" className="pointer-events-none absolute start-4 h-5 w-5 text-gold" />
                <select value={slug} onChange={(e) => changeDestination(e.target.value)} className="w-full appearance-none rounded-2xl bg-white py-3.5 pe-10 ps-12 text-[17px] font-semibold text-night outline-none ring-2 ring-transparent transition focus:ring-gold">
                  <optgroup label={t.morocco}>
                    {national.map((x) => (
                      <option key={x.slug} value={x.slug}>
                        {x.name}
                      </option>
                    ))}
                  </optgroup>
                  {international.length > 0 && (
                    <optgroup label={t.abroad}>
                      {international.map((x) => (
                        <option key={x.slug} value={x.slug}>
                          {x.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <Icon name="arrow" className="pointer-events-none absolute end-4 h-4 w-4 rotate-90 text-night/50" />
              </span>
            </label>
          </div>

          <div className={`space-y-6 p-6 transition sm:p-7 ${loadingDest ? "pointer-events-none opacity-50" : ""}`} aria-busy={loadingDest}>
            {/* 1. Départ */}
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-bold text-night">
                <StepNum n={1} /> {t.start}
              </span>
              <span className="relative mt-3 flex items-center">
                <Icon name={cfg.mode === "FLIGHT" ? "route" : "car"} className="pointer-events-none absolute start-4 h-4 w-4 text-gold-deep" />
                <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
                  {cfg.onSite && (
                    <optgroup label={t.onSiteGroup}>
                      <option value={onSiteKey}>{t.onSite(data.name)}</option>
                    </optgroup>
                  )}
                  <optgroup label={cfg.mode === "FLIGHT" ? t.airportsGroup : t.fromGroup}>
                    {starts.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name[locale]}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <Icon name="arrow" className="pointer-events-none absolute end-3.5 h-4 w-4 rotate-90 text-night/40" />
              </span>
              {travelHint && <span className="mt-1.5 block text-xs text-muted">{travelHint}</span>}
            </label>

            {/* 2. Durée + voyageurs */}
            <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-night">
                  <StepNum n={2} /> {t.duration}
                </span>
                <span className="relative mt-3 flex items-center">
                  <Icon name="calendar" className="pointer-events-none absolute start-4 h-4 w-4 text-gold-deep" />
                  <select value={nights} onChange={(e) => setNights(Number(e.target.value))} className={selectCls}>
                    {durations.map((n) => (
                      <option key={n} value={n}>
                        {t.nightsOpt(n)}
                      </option>
                    ))}
                  </select>
                  <Icon name="arrow" className="pointer-events-none absolute end-3.5 h-4 w-4 rotate-90 text-night/40" />
                </span>
                {/* durée calculée, jamais saisie */}
                <output className="mt-1.5 block text-xs font-semibold text-gold-deep" aria-live="polite">
                  {lengthLabel(locale, len.days, len.nights, len.travelDay)}
                </output>
              </label>
              <div>
                <span id="composer-travelers" className="text-sm font-bold text-night">
                  {t.travelers}
                </span>
                <div className="mt-3 flex items-center gap-1 rounded-2xl bg-ivory p-1.5 ring-1 ring-night/10" role="group" aria-labelledby="composer-travelers">
                  <button type="button" onClick={() => setTravelers(Math.max(1, travelers - 1))} disabled={travelers <= 1} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-night shadow-sm disabled:opacity-30" aria-label="−">
                    <Icon name="minus" className="h-4 w-4" />
                  </button>
                  <span className="min-w-[5.5rem] text-center text-sm font-semibold text-night" aria-live="polite">
                    {t.persons(travelers)}
                  </span>
                  <button type="button" onClick={() => setTravelers(Math.min(20, travelers + 1))} disabled={travelers >= 20} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-night shadow-sm disabled:opacity-30" aria-label="+">
                    <Icon name="plus" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Hébergement */}
            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-bold text-night">
                <StepNum n={3} /> {t.lodging}
              </legend>
              <div className={`mt-3 grid gap-3 ${cfg.lodging.length >= 3 ? "sm:grid-cols-3" : "grid-cols-2"}`}>
                {cfg.lodging.map((o) => {
                  const on = o.key === lodgingObj.key;
                  return (
                    <label key={o.key} className={`relative cursor-pointer rounded-2xl p-4 text-start transition ${on ? "bg-gold/15 ring-2 ring-gold" : "bg-white ring-1 ring-night/10 hover:ring-gold/60"}`}>
                      <input type="radio" name="composer-lodging" className="sr-only" checked={on} onChange={() => setLodging(o.key)} />
                      <span className="block font-semibold leading-tight text-night">{o.label[locale]}</span>
                      <span className="mt-0.5 block text-xs text-muted">{o.hint[locale]}</span>
                      <span className="mt-2 block text-xs font-bold text-night">
                        {formatMad(o.nightMad, locale)} <span className="font-normal text-muted">{t.perNight}</span>
                      </span>
                      {on && (
                        <span aria-hidden className="absolute end-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-gold-deep text-white">
                          <Icon name="check" className="h-3 w-3" />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* 4. Options */}
            {cfg.options.length > 0 && (
              <fieldset>
                <legend className="flex items-center gap-2 text-sm font-bold text-night">
                  <StepNum n={4} /> {t.options}
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cfg.options.map((o) => {
                    const on = options.includes(o.code);
                    return (
                      <label
                        key={o.code}
                        title={`${o.duration[locale]} · ${t.level[o.level]} · ${o.audience[locale]}`}
                        className={`flex cursor-pointer items-center gap-2 rounded-full py-2 pe-4 ps-2 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${on ? "bg-night text-white shadow-md" : "bg-white text-night ring-1 ring-night/15 hover:ring-gold"}`}
                      >
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => setOptions(on ? options.filter((x) => x !== o.code) : [...options, o.code])} />
                        <span aria-hidden className={`grid h-7 w-7 place-items-center rounded-full ${on ? "bg-gold text-night" : "bg-ivory text-gold-deep"}`}>
                          <Icon name={on ? "check" : "plus"} className="h-4 w-4" />
                        </span>
                        <span>
                          {o.label[locale]}
                          <span className={`ms-1.5 text-xs ${on ? "text-white/70" : "text-muted"}`}>+{formatMad(o.priceMad, locale)}</span>
                          <span className="sr-only">
                            {" "}
                            — {o.duration[locale]}, {t.level[o.level]}, {o.audience[locale]}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <button type="button" onClick={create} disabled={loading || loadingDest} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-4 text-lg font-semibold text-night shadow-lift transition hover:bg-gold-light disabled:opacity-60">
              <Icon name="sparkle" className="h-5 w-5" />
              {loading ? t.loading : t.create}
              <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180" />
            </button>
            <p className="-mt-3 text-center text-xs text-muted">{t.noCommitment}</p>
          </div>
        </div>

        {/* ─── Aperçu / programme ─── */}
        <div ref={resultRef} className="scroll-mt-28" aria-live="polite">
          {!result ? (
            <div className="relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[1.75rem] text-white lg:sticky lg:top-24 lg:min-h-[600px]">
              {data.photos.main ? (
                <Image src={data.photos.main.src} alt={data.photos.main.alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="-z-10 object-cover" />
              ) : (
                <div className="absolute inset-0 -z-10 bg-night" />
              )}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/55 to-night/10" />
              <div className="p-7 sm:p-8">
                <p className="eyebrow eyebrow-light">{t.yourProgram}</p>
                <p className="font-display mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{t.previewTitle}</p>
                <ul className="mt-4 space-y-1.5 text-white/90">
                  {t.previewPoints.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-gold" /> {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-white/85">
                  <strong className="text-gold-light">{t.seasons} : </strong>
                  {cfg.seasons[locale]}
                </p>
                {data.photos.steps.length > 0 && (
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {data.photos.steps.slice(0, 3).map((p) => (
                      <span key={p!.src} className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/20">
                        <Image src={p!.src} alt={p!.alt} fill sizes="160px" className="object-cover" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.75rem] bg-night text-white">
              {data.photos.main && (
                <div className="relative h-44 sm:h-56">
                  <Image src={data.photos.main.src} alt={data.photos.main.alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-night to-transparent" />
                </div>
              )}
              <div className="p-6 sm:p-8">
                <p className="eyebrow eyebrow-light">{t.yourProgram}</p>
                <h3 className="font-display mt-1 text-2xl font-semibold sm:text-3xl">{data.name}</h3>
                <p className="mt-1 text-sm text-white/70">{result.summary}</p>

                <ol className="mt-6 space-y-5 border-s border-white/15 ps-6">
                  {result.program.map((p) => {
                    const ph = p.photo ? data.photos.byKey[p.photo] : null;
                    return (
                      <li key={p.day} className="relative">
                        <span aria-hidden className="absolute -start-[37px] top-0 grid h-6 w-6 place-items-center rounded-full bg-gold text-xs font-bold text-night">
                          {p.day}
                        </span>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gold-light">
                              {p.title}
                            </p>
                            <ul className="mt-1 space-y-0.5 text-sm text-white/85">
                              {p.items.map((it, i) => (
                                <li key={i}>
                                  • {it.text}
                                  {it.tag && <span className="ms-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold-light">{it.tag}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {ph && (
                            <span className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15 sm:block">
                              <Image src={ph.src} alt={ph.alt} fill sizes="112px" className="object-cover" />
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {result.price && (
                  <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <ul className="space-y-1 text-sm text-white/75">
                      {result.price.lines.map((l) => (
                        <li key={l.key} className="flex justify-between gap-4">
                          <span>{l.label}</span>
                          <span className="shrink-0 tabular-nums">{formatMad(l.amount, locale)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
                      <span className="text-sm text-white/70">
                        {t.estimate} · {t.persons(travelers)}
                      </span>
                      <span className="font-display text-3xl font-semibold text-gold">{formatMad(result.price.total, locale)}</span>
                    </div>
                    <p className="text-end text-xs text-white/65">
                      {t.perPerson} {formatMad(result.price.perPerson, locale)}
                    </p>
                    <p className="mt-2 text-[11px] text-gold-light">● {t.demoLong}</p>
                  </div>
                )}

                <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm ring-1 ring-white/10">
                  <p className="font-semibold text-gold-light">{t.tips}</p>
                  <ul className="mt-1.5 space-y-1 text-white/80">
                    {cfg.tips[locale].map((x) => (
                      <li key={x}>• {x}</li>
                    ))}
                  </ul>
                </div>

                <div className="no-print mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="btn btn-primary">
                    {t.send} <Icon name="arrow" className="h-4 w-4 rotate-90" />
                  </button>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                      <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  <button type="button" onClick={() => window.print()} className="btn btn-outline-light">
                    <Icon name="print" className="h-4 w-4" /> PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Demande de devis (dossier SM-…) ─── */}
      {result && (
        <div ref={formRef} id="demande-express" className="mt-8 scroll-mt-28 rounded-[1.75rem] bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
          <h3 className="font-display text-2xl text-night">{t.formTitle}</h3>
          <p className="mt-1 text-sm text-muted">{t.formIntro}</p>
          {state?.ok ? (
            <p role="status" className="mt-5 rounded-2xl bg-emerald/10 p-4 font-semibold text-emerald">
              {t.sent(state.reference ?? "")}
            </p>
          ) : (
            <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="kind" value="SUR_MESURE" />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="composer" value={choiceJson} />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <label className="block">
                <span className="label">{t.name} *</span>
                <input name="name" required minLength={2} maxLength={120} autoComplete="name" className="field" />
              </label>
              <label className="block">
                <span className="label">{t.email} *</span>
                <input name="email" type="email" required maxLength={160} autoComplete="email" className="field" />
              </label>
              <label className="block">
                <span className="label">{t.phone}</span>
                <input name="phone" type="tel" maxLength={40} autoComplete="tel" className="field" dir="ltr" />
              </label>
              <label className="block">
                <span className="label">{t.date}</span>
                <input name="startDate" type="date" className="field" />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">{t.message}</span>
                <textarea name="message" rows={3} maxLength={2000} defaultValue={result.summary} className="field" />
              </label>
              <label className="flex items-start gap-2 text-sm text-muted sm:col-span-2">
                <input type="checkbox" name="consent" required className="mt-1 accent-gold-deep" /> {t.consent}
              </label>
              {state && !state.ok && (
                <p role="alert" className="text-sm text-rose-700 sm:col-span-2">
                  {t.error}
                </p>
              )}
              <button disabled={pending} className="btn btn-primary sm:col-span-2 sm:justify-self-start">
                {pending ? t.loading : t.submit} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
