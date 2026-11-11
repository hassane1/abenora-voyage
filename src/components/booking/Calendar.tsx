"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { localeMeta } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { Icon } from "../Icon";

export type Dep = { id: string; date: string; remaining: number; status: string; isDemo: boolean };

/** Calendrier mensuel des départs : disponibles, presque complets, complets, indisponibles */
export default function Calendar({
  departures,
  travelers,
  selected,
  onSelect,
  locale,
}: {
  departures: Dep[];
  travelers: number;
  selected: string | null;
  onSelect: (d: Dep) => void;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const byDate = useMemo(() => new Map(departures.map((d) => [d.date, d])), [departures]);
  const first = departures[0]?.date ?? new Date().toISOString().slice(0, 10);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${selected ?? first}T00:00:00Z`);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });

  const monthStart = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const offset = (monthStart.getUTCDay() + 6) % 7; // semaine commençant lundi
  const fmtMonth = new Intl.DateTimeFormat(localeMeta[locale].intl, { month: "long", year: "numeric", timeZone: "UTC" }).format(monthStart);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(localeMeta[locale].intl, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const move = (delta: number) => setCursor((c) => ({ y: c.m + delta < 0 ? c.y - 1 : c.m + delta > 11 ? c.y + 1 : c.y, m: (c.m + delta + 12) % 12 }));

  return (
    <div className="rounded-3xl bg-white p-4 ring-1 ring-night/10 sm:p-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} className="rounded-full p-2 hover:bg-ivory" aria-label="Mois précédent">
          <Icon name="arrow" className="h-5 w-5 rotate-180 rtl:rotate-0" />
        </button>
        <p className="font-display text-xl font-semibold capitalize text-night" aria-live="polite">
          {fmtMonth}
        </p>
        <button type="button" onClick={() => move(1)} className="rounded-full p-2 hover:bg-ivory" aria-label="Mois suivant">
          <Icon name="arrow" className="h-5 w-5 rtl:rotate-180" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
        {weekdays.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1" role="group" aria-label="Dates">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dep = byDate.get(iso);
          const state = !dep ? "none" : dep.status !== "OPEN" ? "closed" : dep.remaining < travelers ? "full" : dep.remaining <= 3 ? "few" : "ok";
          const isSel = selected === iso;
          const clickable = state === "ok" || state === "few";
          const label = state === "none" ? t.booking.noDeparture : state === "closed" ? t.booking.closed : state === "full" ? t.booking.full : state === "few" ? t.booking.fewLeft(dep!.remaining) : t.booking.available;
          return (
            <button
              key={iso}
              type="button"
              disabled={!clickable}
              onClick={() => dep && onSelect(dep)}
              title={label}
              aria-label={`${day} — ${label}`}
              aria-pressed={isSel}
              className={`relative aspect-square rounded-xl text-sm font-medium transition ${
                isSel
                  ? "bg-terracotta text-white shadow-lg"
                  : state === "ok"
                    ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                    : state === "few"
                      ? "bg-amber-50 text-amber-900 hover:bg-amber-100"
                      : state === "full"
                        ? "bg-rose-50 text-rose-300 line-through"
                        : state === "closed"
                          ? "bg-night/5 text-night/25"
                          : "text-night/20"
              }`}
            >
              {day}
              {state === "few" && !isSel && <span className="absolute inset-x-0 bottom-1 mx-auto h-1 w-1 rounded-full bg-amber-500" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted">
        <Legend cls="bg-emerald-100" label={t.booking.available} />
        <Legend cls="bg-amber-100" label={t.booking.fewLeft(3).replace("3 ", "≤ 3 ")} />
        <Legend cls="bg-rose-100" label={t.booking.full} />
        <Legend cls="bg-night/10" label={t.booking.closed} />
      </div>
      {departures.some((d) => d.isDemo) && <p className="mt-3 text-xs font-medium text-terracotta">● {t.common.demoAvailability}</p>}
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${cls}`} /> {label}
    </span>
  );
}
