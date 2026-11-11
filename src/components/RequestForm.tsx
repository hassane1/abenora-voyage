"use client";

import { useActionState, useMemo, useState } from "react";
import { lengthLabel } from "@/lib/composer-engine";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getV2 } from "@/i18n/v2";
import { submitRequest, type FormState } from "@/app/[locale]/forms-actions";
import { formatMad } from "@/lib/format";
import { Icon } from "./Icon";

type Suggestable = { slug: string; title: string; days: number; priceAdultMad: number | null; tags: string[] };

export default function RequestForm({
  locale,
  kind,
  circuits = [],
  destinations = [],
  initialMessage = "",
  defaultDestination,
}: {
  locale: Locale;
  kind: "SUR_MESURE" | "CONTACT";
  circuits?: Suggestable[];
  destinations?: { slug: string; name: string }[];
  initialMessage?: string;
  defaultDestination?: string;
}) {
  const t = getDictionary(locale);
  const v = getV2(locale);
  const today = new Date().toISOString().slice(0, 10);
  const [state, action, pending] = useActionState<FormState, FormData>(submitRequest, null);
  // l'unité est la nuit d'hôtel : les jours sont calculés (nuits + 1, + 1 journée de trajet si longue distance)
  const [nights, setNights] = useState(2);
  const days = nights + 1;
  const [budget, setBudget] = useState(3000);
  const [interests, setInterests] = useState<string[]>([]);

  // Créateur de voyage : suggestion instantanée parmi les circuits publiés
  const suggestion = useMemo(() => {
    if (kind !== "SUR_MESURE" || circuits.length === 0) return null;
    const scored = circuits.map((c) => {
      let score = -Math.abs(c.days - days) * 2;
      if (c.priceAdultMad !== null && c.priceAdultMad > budget) score -= 5;
      score += interests.filter((i) => c.tags.includes(i)).length;
      return { c, score };
    });
    return scored.sort((a, b) => b.score - a.score)[0]?.c ?? null;
  }, [kind, circuits, days, budget, interests]);

  if (state?.ok)
    return (
      <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-night/5">
        <Icon name="check" className="mx-auto h-10 w-10 text-sand-dark" />
        <p className="mt-4 text-lg text-night">{kind === "CONTACT" ? t.contact.success : v.tailorForm.sent}</p>
        {state.reference && (
          <p className="mt-3 text-sm text-muted">
            {v.tailorForm.reference} : <strong className="font-mono text-night">{state.reference}</strong>
          </p>
        )}
      </div>
    );

  return (
    <form action={action} className="grid gap-5 rounded-[2rem] bg-white p-6 ring-1 ring-night/5 sm:p-8">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">{t.contact.name} *</span>
          <input name="name" required className="field" autoComplete="name" maxLength={120} />
        </label>
        <label>
          <span className="label">{t.booking.email} *</span>
          <input name="email" type="email" required className="field" autoComplete="email" />
        </label>
        <label>
          <span className="label">{t.booking.phone}</span>
          <input name="phone" type="tel" className="field" autoComplete="tel" />
        </label>
        {kind === "SUR_MESURE" && (
          <label>
            <span className="label">{t.home.searchTravelers}</span>
            <input name="travelers" type="number" min={1} max={100} defaultValue={2} className="field" />
          </label>
        )}
      </div>

      {kind === "SUR_MESURE" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">{t.home.searchDestination}</span>
              <select name="destination" className="field" defaultValue={defaultDestination ?? destinations[0]?.slug ?? "merzouga"}>
                {destinations.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">{v.tailorForm.departureCity}</span>
              <input name="departureCity" maxLength={80} className="field" placeholder="Marrakech, Fès, Casablanca…" />
            </label>
            <label>
              <span className="label">{v.tailorForm.date}</span>
              <input name="startDate" type="date" min={today} className="field" />
            </label>
            <label>
              <span className="label">{v.tailorForm.comfort}</span>
              <select name="comfort" className="field" defaultValue="CONFORT">
                {Object.entries(v.tailorForm.comforts).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="label">{v.tailorForm.transport}</span>
              <select name="transport" className="field" defaultValue="PRIVE">
                {Object.entries(v.tailorForm.transports).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <label>
              <span className="label">
                {t.tailor.duration}
              </span>
              <select name="nights" value={nights} onChange={(e) => setNights(Number(e.target.value))} className="field">
                {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <output className="mt-1 block text-xs font-semibold text-gold-deep" aria-live="polite">
                {locale === "ar" ? `${lengthLabel("ar", days, nights, false)} (+ يوم سفر للمسافات الطويلة، يُحسب حسب مدينة الانطلاق)` : locale === "en" ? `${days} days · ${nights} hotel night${nights > 1 ? "s" : ""} (+ 1 travel day for long distances, worked out from your departure city)` : `${days} jours · ${nights} nuit${nights > 1 ? "s" : ""} d'hôtel (+ 1 journée de trajet pour les longues distances, calculée selon votre ville de départ)`}
              </output>
            </label>
            <label>
              <span className="label">
                {t.tailor.budget} : <strong>{formatMad(budget, locale)}</strong>
              </span>
              <input name="budgetMad" type="range" min={500} max={15000} step={250} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-terracotta" />
            </label>
          </div>
          <fieldset>
            <legend className="label">{t.tailor.interests}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.tailor.interestList.map((it, i) => {
                const on = interests.includes(String(i));
                return (
                  <label key={it} className={`cursor-pointer rounded-full px-4 py-2 text-sm ring-1 transition ${on ? "bg-night text-white ring-night" : "ring-night/15 hover:ring-sand"}`}>
                    <input
                      type="checkbox"
                      name="interests"
                      value={it}
                      className="sr-only"
                      checked={on}
                      onChange={() => setInterests((x) => (on ? x.filter((y) => y !== String(i)) : [...x, String(i)]))}
                    />
                    {it}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {suggestion && (
            <div className="rounded-2xl bg-sand/10 p-4 ring-1 ring-sand/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">{t.tailor.suggestion}</p>
              <Link href={`/${locale}/circuits/${suggestion.slug}`} className="font-display mt-1 block text-2xl font-semibold text-night hover:text-terracotta">
                {suggestion.title} →
              </Link>
            </div>
          )}
        </>
      )}

      <label>
        <span className="label">{kind === "CONTACT" ? t.contact.message : t.tailor.message} *</span>
        <textarea name="message" required minLength={5} rows={5} className="field" maxLength={4000} defaultValue={initialMessage} />
      </label>
      {kind === "SUR_MESURE" && (
        <label>
          <span className="label">{v.tailorForm.needs}</span>
          <textarea name="needs" rows={2} maxLength={1000} className="field" />
        </label>
      )}
      <label className="flex items-start gap-2 text-sm text-night/80">
        <input type="checkbox" name="consent" required className="mt-1 accent-terracotta" />
        <span>
          {v.tailorForm.consent}{" "}
          <Link href={`/${locale}/legal/confidentialite`} className="text-terracotta underline">
            ↗
          </Link>
        </span>
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-rose-700">
          {t.booking.errors.invalid}
        </p>
      )}
      <button className="btn btn-primary w-fit" disabled={pending}>
        {pending ? t.booking.submitting : kind === "CONTACT" ? t.contact.submit : t.tailor.submit}
      </button>
    </form>
  );
}
