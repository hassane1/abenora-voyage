"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getExtra } from "@/i18n/extra";
import { getV2 } from "@/i18n/v2";
import { Icon } from "./Icon";

type Tab = "circuits" | "activities" | "tailor";

/** Moteur de recherche à onglets (circuits / activités / sur mesure) */
export default function HeroSearch({
  locale,
  destinations,
  upcoming,
  categories,
}: {
  locale: Locale;
  destinations: { slug: string; name: string }[];
  upcoming: { slug: string; name: string }[];
  categories: { key: string; label: string }[];
}) {
  const t = getDictionary(locale);
  const x = getExtra(locale);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("circuits");
  const [dest, setDest] = useState(destinations[0]?.slug ?? "");
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const v = getV2(locale);
  const [cat, setCat] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const tabs: [Tab, string, string][] = [
    ["circuits", x.tabs.circuits, "route"],
    ["activities", x.tabs.activities, "camel"],
    ["tailor", x.tabs.tailor, "sparkle"],
  ];
  const cell = "flex flex-col bg-white px-5 py-3 transition hover:bg-ivory/60";
  const lab = "text-[11px] font-bold uppercase tracking-wider text-muted";

  return (
    <div className="w-full max-w-5xl">
      <div className="flex gap-1" role="tablist">
        {tabs.map(([k, label, icon]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`flex items-center gap-2 rounded-t-2xl px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${tab === k ? "bg-white text-night" : "bg-white/15 text-white backdrop-blur hover:bg-white/25"}`}
          >
            <Icon name={icon} className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-b-3xl rounded-tr-3xl bg-white text-night shadow-2xl rtl:rounded-tl-3xl rtl:rounded-tr-none">
        {tab === "circuits" && (
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new URLSearchParams();
              if (dest) q.set("destination", dest);
              if (date) q.set("date", date);
              q.set("travelers", String(travelers));
              if (budget) q.set("budget", budget);
              if (duration) q.set("duration", duration);
              router.push(`/${locale}/circuits?${q}`);
            }}
            className="grid gap-px bg-night/10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.7fr_0.9fr_0.9fr_auto]"
          >
            <label className={cell}>
              <span className={lab}>{t.home.searchDestination}</span>
              <select value={dest} onChange={(e) => setDest(e.target.value)} className="bg-transparent py-1 font-semibold outline-none">
                {destinations.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
                {upcoming.length > 0 && (
                  <optgroup label={t.home.comingTitle}>
                    {upcoming.map((d) => (
                      <option key={d.slug} value={d.slug} disabled>
                        {d.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <label className={cell}>
              <span className={lab}>{t.home.searchDate}</span>
              <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent py-1 font-semibold outline-none" />
            </label>
            <label className={cell}>
              <span className={lab}>{t.home.searchTravelers}</span>
              <input type="number" min={1} max={30} value={travelers} onChange={(e) => setTravelers(Number(e.target.value) || 1)} className="bg-transparent py-1 font-semibold outline-none" />
            </label>
            <label className={cell}>
              <span className={lab}>{v.hero.duration}</span>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-transparent py-1 font-semibold outline-none">
                <option value="">{v.hero.anyDuration}</option>
                {v.hero.durations.map((d) => (
                  <option key={d.v} value={d.v}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={cell}>
              <span className={lab}>{t.home.searchBudget}</span>
              <select value={budget} onChange={(e) => setBudget(e.target.value)} className="bg-transparent py-1 font-semibold outline-none">
                <option value="">{t.home.searchAnyBudget}</option>
                <option value="1500">≤ 1 500 MAD</option>
                <option value="3000">≤ 3 000 MAD</option>
                <option value="5000">≤ 5 000 MAD</option>
              </select>
            </label>
            <button type="submit" className="flex items-center justify-center gap-2 bg-terracotta px-8 py-4 font-semibold text-white transition hover:bg-terracotta-dark sm:col-span-2 lg:col-span-1">
              <Icon name="search" className="h-5 w-5" /> {t.home.searchSubmit}
            </button>
          </form>
        )}
        {tab === "activities" && (
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/${locale}/activites${cat ? `#${cat}` : ""}`);
            }}
            className="grid gap-px bg-night/10 sm:grid-cols-[1fr_auto]"
          >
            <label className={cell}>
              <span className={lab}>{x.activityType}</span>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-transparent py-1 font-semibold outline-none">
                <option value="">{x.allActivities}</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="flex items-center justify-center gap-2 bg-terracotta px-8 py-4 font-semibold text-white transition hover:bg-terracotta-dark">
              <Icon name="search" className="h-5 w-5" /> {t.home.searchSubmit}
            </button>
          </form>
        )}
        {tab === "tailor" && (
          <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <p className="font-medium text-night">{x.tailorPitch}</p>
            <a href={`/${locale}/sur-mesure`} className="btn btn-primary shrink-0">
              {x.tailorCta} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
