"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatMad, addDays } from "@/lib/format";
import { useWhatsApp } from "../BrandProvider";
import type { PriceResult, ResolvedGrid } from "@/lib/pricing";
import { TRIP_KEY, useLocalList } from "../useLocalList";
import { Icon } from "../Icon";
import DuneArt from "../DuneArt";
import ProgramArt from "../ProgramArt";
import { circuitVariant, hashSeed } from "../Cards";
import { priceNote } from "../Price";
import Calendar, { type Dep } from "./Calendar";

export type WizardOption = { code: string; group: string; label: string; description: string; priceMad: number; unit: string; exclusiveGroup: string | null; isDefault: boolean; priceStatus: string };
export type WizardCircuit = {
  id: string;
  slug: string;
  destinationSlug: string;
  title: string;
  summary: string;
  days: number;
  nights: number;
  priceAdultMad: number | null;
  priceStatus: string;
  depositPercent: number;
  options: WizardOption[];
  priceGrid?: ResolvedGrid | null;
  programType?: string;
};
export type WizardDestination = { slug: string; name: string; available: boolean };

type Contact = { firstName: string; lastName: string; email: string; phone: string; whatsapp: string; country: string; departureCity: string; specialNeeds: string; comments: string };

export default function BookingWizard({
  locale,
  destinations,
  circuits,
  initialCircuit,
  initialDestination,
}: {
  locale: Locale;
  destinations: WizardDestination[];
  circuits: WizardCircuit[];
  initialCircuit?: string;
  initialDestination?: string;
}) {
  const t = getDictionary(locale);
  const whatsappLink = useWhatsApp();
  const trip = useLocalList(TRIP_KEY);
  const preCircuit = circuits.find((c) => c.slug === initialCircuit);
  const [step, setStep] = useState(preCircuit ? 2 : initialDestination ? 1 : 0);
  const [destination, setDestination] = useState(preCircuit?.destinationSlug ?? initialDestination ?? destinations.find((d) => d.available)?.slug ?? "");
  const [circuitId, setCircuitId] = useState(preCircuit?.id ?? "");
  const [departures, setDepartures] = useState<Dep[] | null>(null);
  const [departure, setDeparture] = useState<Dep | null>(null);
  const [adults, setAdults] = useState(2);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [privateTour, setPrivateTour] = useState(false);
  const [optionCodes, setOptionCodes] = useState<string[] | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [gridChoice, setGridChoice] = useState<{ circuitId: string; row: number; col: string } | null>(null);
  const [promo, setPromo] = useState("");
  const [quote, setQuote] = useState<{ price: PriceResult; promoRejected: boolean } | null>(null);
  const [contact, setContact] = useState<Contact>({ firstName: "", lastName: "", email: "", phone: "", whatsapp: "", country: "", departureCity: "", specialNeeds: "", comments: "" });
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; token: string } | null>(null);

  const circuit = circuits.find((c) => c.id === circuitId) ?? null;
  const travelers = adults + childAges.length;
  const priceGrid = circuit?.priceGrid ?? null;
  // choix hébergement × chambre (programmes à grille, ex. Omra) — ignoré si l'on change de circuit
  const grid = useMemo(() => (priceGrid && gridChoice && gridChoice.circuitId === circuitId ? { row: gridChoice.row, col: gridChoice.col } : null), [priceGrid, gridChoice, circuitId]);

  // options : défauts + activités ajoutées depuis les fiches (« Ajouter à mon séjour »)
  const effectiveOptions = useMemo(() => {
    if (!circuit) return [];
    if (optionCodes) return optionCodes;
    const fromTrip = trip.list.filter((c) => circuit.options.some((o) => o.code === c));
    // une option exclusive choisie en amont (ex. campement de luxe) remplace le défaut de son groupe
    const tripGroups = new Set(circuit.options.filter((o) => fromTrip.includes(o.code) && o.exclusiveGroup).map((o) => o.exclusiveGroup));
    const defaults = circuit.options.filter((o) => o.isDefault && !tripGroups.has(o.exclusiveGroup)).map((o) => o.code);
    return Array.from(new Set([...defaults, ...fromTrip]));
  }, [circuit, optionCodes, trip.list]);

  // chargement des départs
  useEffect(() => {
    if (!circuitId) return;
    let cancelled = false;
    fetch(`/api/departures?circuitId=${circuitId}`)
      .then((r) => r.json())
      .then((d: Dep[]) => {
        if (!cancelled) setDepartures(d);
      })
      .catch(() => !cancelled && setDepartures([]));
    return () => {
      cancelled = true;
    };
  }, [circuitId]);

  // calcul du prix côté serveur (fait foi)
  useEffect(() => {
    if (!circuitId) return;
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circuitId, adults, childAges, privateTour, optionCodes: effectiveOptions, promoCode: promo || undefined, locale, grid }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((d) => d.price && setQuote({ price: d.price, promoRejected: d.promoRejected }))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [circuitId, adults, childAges, privateTour, effectiveOptions, promo, locale, grid]);

  const toggleOption = (o: WizardOption) => {
    let next = effectiveOptions.filter((c) => c !== o.code);
    if (!effectiveOptions.includes(o.code)) {
      if (o.exclusiveGroup) {
        const same = circuit!.options.filter((x) => x.exclusiveGroup === o.exclusiveGroup).map((x) => x.code);
        next = next.filter((c) => !same.includes(c));
      }
      next.push(o.code);
    } else if (o.exclusiveGroup) {
      return; // une option exclusive reste sélectionnée (choisir l'autre pour changer)
    }
    setOptionCodes(next);
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
  const canNext = [
    !!destination,
    !!circuit,
    !!departure && departure.remaining >= travelers,
    adults >= 1 && childAges.every((a) => a >= 0 && a <= 11) && (!priceGrid || (!!grid && typeof priceGrid.rows[grid.row]?.prices[grid.col] === "number")),
    true,
    !!quote,
    !!contact.firstName && !!contact.lastName && emailOk && contact.phone.trim().length >= 6 && contact.country.trim().length >= 2,
    consent,
  ];

  const submit = async () => {
    if (!circuit || !departure) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circuitId: circuit.id,
          departureId: departure.id,
          adults,
          childAges,
          privateTour,
          optionCodes: effectiveOptions,
          promoCode: promo,
          grid,
          ...contact,
          consent,
          locale,
          website: honeypot,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone({ reference: data.reference, token: data.token });
        trip.clear();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (data.error === "SOLD_OUT") {
        setError(t.booking.errors.soldOut);
        setDeparture(null);
        setStep(2);
        fetch(`/api/departures?circuitId=${circuit.id}`).then((r) => r.json()).then(setDepartures);
      } else setError(data.error === "INVALID" ? t.booking.errors.invalid : t.booking.errors.generic);
    } catch {
      setError(t.booking.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  if (done && circuit && departure) {
    const wa = whatsappLink(
      `${t.booking.reference} ${done.reference} — ${circuit.title}, ${formatDate(departure.date, locale)}, ${travelers} ${t.home.searchTravelers.toLowerCase()}`,
    );
    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-xl ring-1 ring-night/5 sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sand/20 text-sand-dark">
          <Icon name="check" className="h-8 w-8" />
        </div>
        <h2 className="font-display mt-6 text-4xl font-semibold text-night">{t.booking.successTitle}</h2>
        <p className="mt-4 text-muted">{t.booking.successText}</p>
        <dl className="mx-auto mt-8 grid max-w-sm gap-3 rounded-2xl bg-ivory p-6 text-start">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t.booking.reference}</dt>
            <dd className="font-mono font-bold text-night">{done.reference}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t.booking.status}</dt>
            <dd className="font-semibold text-amber-700">{t.status.PENDING}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}/espace-client?ref=${done.reference}&token=${done.token}`} className="btn btn-primary">
            {t.booking.viewFile}
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white">
              <Icon name="whatsapp" className="h-4 w-4" /> {t.common.whatsapp}
            </a>
          )}
        </div>
      </div>
    );
  }

  const price = quote?.price;
  const nightsLabel = circuit ? t.common.daysNights(circuit.days, circuit.nights) : "";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        {/* Étapes */}
        <ol className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2" aria-label="Étapes">
          {t.booking.steps.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                disabled={i > step && !canNext.slice(0, i).every(Boolean)}
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  i === step ? "bg-night text-white" : i < step ? "bg-sand/25 text-night" : "bg-white text-night/40 ring-1 ring-night/10"
                }`}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[10px]">{i < step ? "✓" : i + 1}</span>
                {s}
              </button>
            </li>
          ))}
        </ol>

        {error && (
          <p role="alert" className="mb-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </p>
        )}

        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-night/5 sm:p-8">
          {step === 0 && (
            <Step title={t.booking.chooseDestination}>
              <div className="grid gap-3 sm:grid-cols-2">
                {destinations.map((d) => (
                  <button
                    key={d.slug}
                    type="button"
                    disabled={!d.available}
                    onClick={() => {
                      setDestination(d.slug);
                      setStep(1);
                    }}
                    className={`rounded-2xl p-4 text-start ring-1 transition ${destination === d.slug ? "bg-night text-white ring-night" : "ring-night/10 hover:ring-sand"} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <p className="font-display text-xl font-semibold">{d.name}</p>
                    <p className="text-xs opacity-70">{d.available ? t.booking.available : t.home.comingTitle}</p>
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title={t.booking.chooseCircuit}>
              <div className="grid gap-4">
                {circuits
                  .filter((c) => c.destinationSlug === destination)
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (c.id !== circuitId) {
                          setCircuitId(c.id);
                          setDeparture(null);
                          setDepartures(null);
                          setOptionCodes(null);
                        }
                        setStep(2);
                      }}
                      className={`flex overflow-hidden rounded-2xl text-start ring-1 transition ${circuitId === c.id ? "ring-2 ring-terracotta" : "ring-night/10 hover:ring-sand"}`}
                    >
                      {c.programType && c.programType !== "CIRCUIT" ? <ProgramArt type={c.programType} className="hidden w-40 shrink-0 sm:block" /> : <DuneArt variant={circuitVariant(c.slug)} seed={hashSeed(c.slug)} className="hidden w-40 shrink-0 sm:block" />}
                      <div className="p-4">
                        <p className="eyebrow">{t.common.daysNights(c.days, c.nights)}</p>
                        <p className="font-display text-2xl font-semibold text-night">{c.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{c.summary}</p>
                        <p className="mt-2 text-sm font-semibold text-night">
                          {c.priceAdultMad ? `${t.common.from} ${formatMad(c.priceAdultMad, locale)} ${t.common.perPerson}` : t.common.onRequest}
                          {c.priceStatus !== "VALIDATED" && <span className="ms-2 text-xs font-medium text-terracotta">● {priceNote(locale, c.priceStatus)}</span>}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </Step>
          )}

          {step === 2 && circuit && (
            <Step title={t.booking.chooseDate}>
              {departures === null ? (
                <p className="text-muted">{t.common.loading}</p>
              ) : (
                <Calendar departures={departures} travelers={travelers} selected={departure?.date ?? null} onSelect={setDeparture} locale={locale} />
              )}
              {departure && (
                <p className="mt-4 rounded-2xl bg-ivory p-4 text-sm">
                  <Icon name="calendar" className="me-2 inline h-4 w-4 text-terracotta" />
                  {formatDate(departure.date, locale)} → {t.booking.returnDate} : <strong>{formatDate(addDays(new Date(`${departure.date}T00:00:00Z`), circuit.nights), locale)}</strong> ({nightsLabel})
                </p>
              )}
            </Step>
          )}

          {step === 3 && (
            <Step title={t.home.searchTravelers}>
              <Counter label={t.booking.adults} value={adults} min={1} max={20} onChange={setAdults} />
              <Counter
                label={t.booking.children}
                value={childAges.length}
                min={0}
                max={10}
                onChange={(n) => setChildAges((ages) => (n > ages.length ? [...ages, ...Array(n - ages.length).fill(6)] : ages.slice(0, n)))}
              />
              {childAges.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {childAges.map((age, i) => (
                    <label key={i} className="block">
                      <span className="label">{t.booking.childAge(i + 1)}</span>
                      <select className="field" value={age} onChange={(e) => setChildAges((a) => a.map((x, j) => (j === i ? Number(e.target.value) : x)))}>
                        {Array.from({ length: 12 }, (_, n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              {priceGrid && (
                <fieldset className="mt-8">
                  <legend className="label">{locale === "ar" ? "الفندق ونوع الغرفة (السعر للشخص)" : locale === "en" ? "Hotel and room type (price per person)" : "Hôtel et type de chambre (prix par personne)"}</legend>
                  <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-night/10">
                    <table className="w-full text-sm">
                      <thead className="bg-ivory text-xs text-muted">
                        <tr>
                          <th className="p-2 text-start" />
                          {priceGrid.columns.map((c) => (
                            <th key={c.key} className="p-2 text-center">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {priceGrid.rows.map((r, i) => (
                          <tr key={i} className="border-t border-night/5">
                            <td className="p-2">
                              <span className="font-semibold text-night">{r.label}</span>
                              {r.detail && <span className="block text-xs text-muted">{r.detail}</span>}
                            </td>
                            {priceGrid.columns.map((c) => {
                              const v = r.prices[c.key];
                              const on = grid?.row === i && grid?.col === c.key;
                              return (
                                <td key={c.key} className="p-1 text-center">
                                  {typeof v === "number" ? (
                                    <button
                                      type="button"
                                      aria-pressed={on}
                                      onClick={() => setGridChoice({ circuitId, row: i, col: c.key })}
                                      className={`w-full rounded-xl px-2 py-2 font-semibold transition ${on ? "bg-night text-sand" : "bg-white ring-1 ring-night/10 hover:ring-sand"}`}
                                    >
                                      {formatMad(v, locale)}
                                    </button>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </fieldset>
              )}
              {!priceGrid && (
              <fieldset className="mt-8">
                <legend className="label">{t.booking.tripType}</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[false, true].map((p) => (
                    <label key={String(p)} className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 ring-1 ${privateTour === p ? "bg-night/5 ring-night" : "ring-night/10"}`}>
                      <input type="radio" name="private" checked={privateTour === p} onChange={() => setPrivateTour(p)} className="accent-terracotta" />
                      {p ? t.booking.private : t.booking.shared}
                    </label>
                  ))}
                </div>
              </fieldset>
              )}
              {departure && departure.remaining < travelers && <p className="mt-4 text-sm text-rose-700">{t.booking.errors.soldOut}</p>}
            </Step>
          )}

          {step === 4 && circuit && (
            <Step title={t.booking.options}>
              {Object.entries(
                circuit.options.reduce<Record<string, WizardOption[]>>((acc, o) => {
                  (acc[o.group] ||= []).push(o);
                  return acc;
                }, {}),
              ).map(([group, opts]) => (
                <fieldset key={group} className="mb-6">
                  <legend className="font-display text-xl font-semibold text-night">{t.booking.groups[group] ?? group}</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {opts.map((o) => {
                      const on = effectiveOptions.includes(o.code);
                      return (
                        <label key={o.code} className={`flex cursor-pointer gap-3 rounded-2xl p-4 ring-1 transition ${on ? "bg-sand/10 ring-sand" : "ring-night/10 hover:ring-sand/60"}`}>
                          <input type={o.exclusiveGroup ? "radio" : "checkbox"} name={o.exclusiveGroup ?? o.code} checked={on} onChange={() => toggleOption(o)} className="mt-1 accent-terracotta" />
                          <span className="flex-1">
                            <span className="block font-semibold text-night">{o.label}</span>
                            <span className="block text-xs text-muted">{o.description}</span>
                          </span>
                          <span className="text-end text-sm font-semibold text-night">
                            {o.priceMad === 0 ? t.common.free : `+${formatMad(o.priceMad, locale)}`}
                            <span className="block text-[10px] font-normal text-muted">{o.priceMad ? t.booking.units[o.unit] : ""}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </Step>
          )}

          {step === 5 && (
            <Step title={t.booking.summary}>
              {price ? <PriceTable price={price} locale={locale} depositPercent={circuit?.depositPercent ?? 30} /> : <p>{t.common.loading}</p>}
              <div className="mt-6 flex flex-wrap items-end gap-3">
                <label className="flex-1">
                  <span className="label">{t.booking.promo}</span>
                  <input className="field uppercase" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} maxLength={40} />
                </label>
                <button type="button" className="btn btn-sand" onClick={() => setPromo(promoInput.trim())}>
                  {t.booking.applyPromo}
                </button>
              </div>
              {promo && quote && <p className={`mt-2 text-sm ${quote.promoRejected ? "text-rose-700" : "text-emerald-700"}`}>{quote.promoRejected ? t.booking.promoInvalid : t.booking.promoApplied}</p>}
            </Step>
          )}

          {step === 6 && (
            <Step title={t.booking.steps[6]}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.booking.firstName} required value={contact.firstName} onChange={(v) => setContact({ ...contact, firstName: v })} autoComplete="given-name" />
                <Field label={t.booking.lastName} required value={contact.lastName} onChange={(v) => setContact({ ...contact, lastName: v })} autoComplete="family-name" />
                <Field label={t.booking.email} required type="email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} autoComplete="email" />
                <Field label={t.booking.phone} required type="tel" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} autoComplete="tel" />
                <Field label={t.booking.whatsapp} type="tel" value={contact.whatsapp} onChange={(v) => setContact({ ...contact, whatsapp: v })} />
                <Field label={t.booking.country} required value={contact.country} onChange={(v) => setContact({ ...contact, country: v })} autoComplete="country-name" />
                <Field label={t.booking.departureCity} value={contact.departureCity} onChange={(v) => setContact({ ...contact, departureCity: v })} />
              </div>
              <label className="mt-4 block">
                <span className="label">{t.booking.specialNeeds}</span>
                <textarea className="field" rows={2} value={contact.specialNeeds} onChange={(e) => setContact({ ...contact, specialNeeds: e.target.value })} maxLength={1000} />
              </label>
              <label className="mt-4 block">
                <span className="label">{t.booking.comments}</span>
                <textarea className="field" rows={3} value={contact.comments} onChange={(e) => setContact({ ...contact, comments: e.target.value })} maxLength={2000} />
              </label>
              {/* champ piège anti-robot, invisible pour les humains */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />
            </Step>
          )}

          {step === 7 && circuit && departure && (
            <Step title={t.booking.steps[7]}>
              <dl className="grid gap-3 rounded-2xl bg-ivory p-5 text-sm sm:grid-cols-2">
                <Row k={t.nav.circuits} v={`${circuit.title} (${nightsLabel})`} />
                <Row k={t.booking.chooseDate} v={`${formatDate(departure.date, locale)} → ${formatDate(addDays(new Date(`${departure.date}T00:00:00Z`), circuit.nights), locale)}`} />
                <Row k={t.home.searchTravelers} v={`${adults} + ${childAges.length}${childAges.length ? ` (${childAges.join(", ")})` : ""} · ${privateTour ? t.booking.private : t.booking.shared}`} />
                <Row k={t.booking.email} v={`${contact.firstName} ${contact.lastName} — ${contact.email}`} />
                {price && <Row k={t.booking.total} v={formatMad(price.total, locale)} />}
              </dl>
              <p className="mt-4 rounded-2xl border border-sand/50 bg-sand/10 p-4 text-sm text-night">{t.booking.subtitle}</p>
              {(price?.isDemo || departure.isDemo) && <p className="mt-3 text-xs text-terracotta">● {priceNote(locale, price?.noteKind ?? "DEMO", true)}</p>}
              <label className="mt-6 flex items-start gap-3 text-sm">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-terracotta" />
                <span>{t.booking.consent}</span>
              </label>
              <button type="button" disabled={!consent || submitting} onClick={submit} className="btn btn-primary mt-6 w-full sm:w-auto">
                {submitting ? t.booking.submitting : t.booking.submit}
              </button>
            </Step>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between gap-3 border-t border-night/10 pt-6">
            <button type="button" className="btn text-night disabled:invisible" disabled={step === 0} onClick={() => setStep(step - 1)}>
              ← {t.common.previous}
            </button>
            {step < 7 && (
              <button type="button" className="btn btn-primary" disabled={!canNext[step]} onClick={() => setStep(step + 1)}>
                {t.common.next} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Récapitulatif */}
      <aside className="h-fit lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-[2rem] bg-night text-white shadow-xl">
          {circuit && (circuit.programType && circuit.programType !== "CIRCUIT" ? <ProgramArt type={circuit.programType} className="h-32 w-full" /> : <DuneArt variant={circuitVariant(circuit.slug)} seed={hashSeed(circuit.slug)} caravan className="h-32 w-full" />)}
          <div className="p-6">
            <p className="eyebrow !text-sand">{t.booking.summary}</p>
            <p className="font-display mt-1 text-2xl font-semibold">{circuit?.title ?? "—"}</p>
            {departure && circuit && (
              <p className="mt-1 text-sm text-white/70">
                {formatDate(departure.date, locale, { day: "numeric", month: "short" })} → {formatDate(addDays(new Date(`${departure.date}T00:00:00Z`), circuit.nights), locale, { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
            <p className="mt-1 text-sm text-white/70">
              {travelers} {t.home.searchTravelers.toLowerCase()}
            </p>
            {price && !price.onRequest && (
              <>
                <div className="mt-5 border-t border-white/15 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-white/70">{t.booking.total}</span>
                    <span className="font-display text-3xl font-semibold text-sand">{formatMad(price.total, locale)}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/60">
                    {t.booking.deposit(circuit?.depositPercent ?? 30)} : {formatMad(price.deposit, locale)}
                  </p>
                </div>
                {price.isDemo && <p className="mt-3 text-[11px] text-sand-light">● {priceNote(locale, price.noteKind ?? "DEMO", true)}</p>}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display mb-6 text-3xl font-semibold text-night">{title}</h2>
      {children}
    </section>
  );
}

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-night/10 py-4">
      <span className="font-medium text-night">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-night/20 disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="−">
          <Icon name="minus" className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-lg font-semibold" aria-live="polite">
          {value}
        </span>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-night/20 disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="+">
          <Icon name="plus" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, autoComplete }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="label">
        {label} {required && <span className="text-terracotta">*</span>}
      </span>
      <input className="field" type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} maxLength={160} />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium text-night">{v}</dd>
    </div>
  );
}

export function PriceTable({ price, locale, depositPercent }: { price: PriceResult; locale: Locale; depositPercent: number }) {
  const t = getDictionary(locale);
  if (price.onRequest) return <p className="text-muted">{t.common.onRequest}</p>;
  return (
    <div>
      <table className="w-full text-sm">
        <tbody>
          {[...price.lines, ...price.discounts].map((l) => (
            <tr key={l.key} className="border-b border-night/5">
              <td className="py-2 pe-2 text-night">{l.label}</td>
              <td className="py-2 text-xs text-muted" dir="ltr">
                {l.detail}
              </td>
              <td className={`py-2 text-end font-medium ${l.amount < 0 ? "text-emerald-700" : "text-night"}`}>{formatMad(l.amount, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between text-lg font-semibold text-night">
          <span>{t.booking.total}</span>
          <span>{formatMad(price.total, locale)}</span>
        </div>
        <p className="text-xs text-muted">{price.taxRatePercent > 0 ? `${t.booking.taxIncluded(price.taxRatePercent)} : ${formatMad(price.taxIncluded, locale)}` : t.booking.taxNotConfigured}</p>
        <div className="flex justify-between pt-2">
          <span className="text-muted">{t.booking.deposit(depositPercent)}</span>
          <span className="font-medium">{formatMad(price.deposit, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t.booking.balance}</span>
          <span className="font-medium">{formatMad(price.balance, locale)}</span>
        </div>
      </div>
      {price.isDemo && <p className="mt-4 rounded-xl bg-terracotta/5 p-3 text-xs text-terracotta">● {priceNote(locale, price.noteKind ?? "DEMO", true)}</p>}
    </div>
  );
}
