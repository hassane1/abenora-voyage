"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { addDays, formatDate } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import Calendar, { type Dep } from "./booking/Calendar";
import { TRIP_KEY } from "./useLocalList";
import { Icon } from "./Icon";

const T = {
  fr: {
    title: "Envoyer ma demande maintenant",
    intro: "Choisissez votre date et laissez vos coordonnées : votre programme est transmis à notre équipe, qui vérifie la disponibilité et vous répond. Aucun paiement à cette étape.",
    date: "1. Date d'arrivée au désert",
    you: "2. Vos coordonnées",
    message: "Un souhait particulier ? (facultatif)",
    send: "Envoyer ma demande de réservation",
    extra: "Programme composé en ligne",
  },
  en: {
    title: "Send my request now",
    intro: "Pick your date and leave your details: your programme goes to our team, who check availability and reply. No payment at this stage.",
    date: "1. Date",
    you: "2. Your details",
    message: "Any special wish? (optional)",
    send: "Send my booking request",
    extra: "Programme built online",
  },
  ar: {
    title: "أرسل طلبي الآن",
    intro: "اختر تاريخك واترك معلوماتك: يصل برنامجك إلى فريقنا الذي يتحقق من التوفر ويرد عليك. لا دفع في هذه المرحلة.",
    date: "1. التاريخ",
    you: "2. معلوماتك",
    message: "رغبة خاصة؟ (اختياري)",
    send: "إرسال طلب الحجز",
    extra: "برنامج مصمم عبر الإنترنت",
  },
};

export default function QuickRequest({
  locale,
  circuitId,
  nights,
  travelers,
  optionCodes,
  departureCity,
  summary,
}: {
  locale: Locale;
  circuitId: string;
  nights: number;
  travelers: number;
  optionCodes: string[];
  departureCity: string;
  summary: string;
}) {
  const t = T[locale];
  const d = getDictionary(locale);
  const [deps, setDeps] = useState<Dep[] | null>(null);
  const [dep, setDep] = useState<Dep | null>(null);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", country: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error" | "soldout">("idle");
  const [done, setDone] = useState<{ reference: string; token: string } | null>(null);

  useEffect(() => {
    let off = false;
    fetch(`/api/departures?circuitId=${circuitId}`)
      .then((r) => r.json())
      .then((x: Dep[]) => !off && setDeps(x))
      .catch(() => !off && setDeps([]));
    return () => {
      off = true;
    };
  }, [circuitId]);

  const valid = dep && f.firstName && f.lastName && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) && f.phone.trim().length >= 6 && f.country.trim().length >= 2 && consent;

  const send = async () => {
    if (!valid || !dep) return;
    setState("sending");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        circuitId,
        departureId: dep.id,
        adults: travelers,
        childAges: [],
        privateTour: false,
        optionCodes,
        promoCode: "",
        firstName: f.firstName,
        lastName: f.lastName,
        email: f.email,
        phone: f.phone,
        whatsapp: "",
        country: f.country,
        departureCity,
        specialNeeds: "",
        comments: `[${t.extra}] ${summary}${f.message ? `\n— ${f.message}` : ""}`.slice(0, 2000),
        consent: true,
        locale,
        website: hp,
      }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setDone({ reference: data.reference, token: data.token });
      try {
        window.localStorage.removeItem(TRIP_KEY);
        window.dispatchEvent(new Event("rimal-storage"));
      } catch {}
    } else if (data.error === "SOLD_OUT") {
      setState("soldout");
      setDep(null);
      fetch(`/api/departures?circuitId=${circuitId}`).then((r) => r.json()).then(setDeps);
    } else setState("error");
  };

  if (done) {
    const wa = whatsappLink(`${d.booking.reference} ${done.reference}`);
    return (
      <div className="rounded-[1.75rem] bg-white p-8 text-center ring-1 ring-night/10" role="status">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sand/20 text-sand-dark">
          <Icon name="check" className="h-7 w-7" />
        </div>
        <h3 className="font-display mt-4 text-3xl font-semibold text-night">{d.booking.successTitle}</h3>
        <p className="mx-auto mt-3 max-w-xl text-muted">{d.booking.successText}</p>
        <p className="mt-5 text-sm text-muted">{d.booking.reference}</p>
        <p className="font-mono text-2xl font-bold text-night">{done.reference}</p>
        <p className="mt-1 text-sm font-semibold text-amber-700">{d.status.PENDING}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}/espace-client?ref=${done.reference}&token=${done.token}`} className="btn btn-primary">
            {d.booking.viewFile}
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white">
              <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  const field = (k: keyof typeof f, label: string, type = "text", auto?: string) => (
    <label className="block">
      <span className="label">
        {label} <span className="text-terracotta">*</span>
      </span>
      <input className="field" type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} autoComplete={auto} maxLength={160} required />
    </label>
  );

  return (
    <div id="demande-express" className="scroll-mt-28 rounded-[1.75rem] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(20,40,63,0.4)] ring-2 ring-terracotta/30 sm:p-8">
      <h3 className="font-display text-3xl font-semibold text-night">{t.title}</h3>
      <p className="mt-2 max-w-3xl text-muted">{t.intro}</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-3 font-semibold text-night">{t.date}</p>
          {deps === null ? (
            <p className="text-muted">{d.common.loading}</p>
          ) : (
            <Calendar departures={deps} travelers={travelers} selected={dep?.date ?? null} onSelect={setDep} locale={locale} />
          )}
          {dep && (
            <p className="mt-3 rounded-2xl bg-ivory p-3 text-sm">
              <Icon name="calendar" className="me-2 inline h-4 w-4 text-terracotta" />
              {formatDate(dep.date, locale)} → {formatDate(addDays(new Date(`${dep.date}T00:00:00Z`), nights), locale)}
            </p>
          )}
          {state === "soldout" && <p className="mt-3 text-sm text-rose-700">{d.booking.errors.soldOut}</p>}
        </div>
        <div>
          <p className="mb-3 font-semibold text-night">{t.you}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("firstName", d.booking.firstName, "text", "given-name")}
            {field("lastName", d.booking.lastName, "text", "family-name")}
            {field("email", d.booking.email, "email", "email")}
            {field("phone", `${d.booking.phone} / WhatsApp`, "tel", "tel")}
            {field("country", d.booking.country, "text", "country-name")}
          </div>
          <label className="mt-3 block">
            <span className="label">{t.message}</span>
            <textarea className="field" rows={2} maxLength={800} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          </label>
          <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-terracotta" />
            <span>{d.booking.consent}</span>
          </label>
          {state === "error" && <p className="mt-3 text-sm text-rose-700">{d.booking.errors.generic}</p>}
          <button type="button" onClick={send} disabled={!valid || state === "sending"} className="btn btn-primary mt-5 w-full">
            {state === "sending" ? d.booking.submitting : t.send} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
          </button>
          <p className="mt-2 text-center text-xs text-muted">{d.booking.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
