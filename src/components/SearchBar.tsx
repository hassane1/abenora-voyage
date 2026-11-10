"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { Icon } from "./Icon";

export default function SearchBar({
  locale,
  destinations,
  upcoming,
}: {
  locale: Locale;
  destinations: { slug: string; name: string }[];
  upcoming: { slug: string; name: string }[];
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [dest, setDest] = useState(destinations[0]?.slug ?? "");
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        if (dest) q.set("destination", dest);
        if (date) q.set("date", date);
        q.set("travelers", String(travelers));
        if (budget) q.set("budget", budget);
        router.push(`/${locale}/circuits?${q}`);
      }}
      className="grid w-full gap-px overflow-hidden rounded-3xl bg-night/10 text-night shadow-2xl ring-1 ring-white/20 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr_1fr_auto]"
      role="search"
    >
      <label className="flex flex-col bg-white px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.home.searchDestination}</span>
        <select value={dest} onChange={(e) => setDest(e.target.value)} className="bg-transparent py-1 font-medium outline-none">
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
      <label className="flex flex-col bg-white px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.home.searchDate}</span>
        <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent py-1 font-medium outline-none" />
      </label>
      <label className="flex flex-col bg-white px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.home.searchTravelers}</span>
        <input type="number" min={1} max={30} value={travelers} onChange={(e) => setTravelers(Number(e.target.value) || 1)} className="bg-transparent py-1 font-medium outline-none" />
      </label>
      <label className="flex flex-col bg-white px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.home.searchBudget}</span>
        <select value={budget} onChange={(e) => setBudget(e.target.value)} className="bg-transparent py-1 font-medium outline-none">
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
  );
}
