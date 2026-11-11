"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { getSignature } from "@/i18n/signature";
import { Icon } from "./Icon";

type Tab = "maroc" | "international" | "omra" | "tailor";
type Dest = { slug: string; name: string };

/** Moteur de recherche en carte flottante : Maroc, International, Omra, Sur mesure */
export default function HeroSearch({ locale, national, international }: { locale: Locale; national: Dest[]; international: Dest[] }) {
  const s = getSignature(locale).search;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("maroc");
  const [dest, setDest] = useState("");
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const today = new Date().toISOString().slice(0, 10);

  const tabs: [Tab, string, string][] = [
    ["maroc", s.tabs.maroc, "pin"],
    ["international", s.tabs.international, "globe"],
    ["omra", s.tabs.omra, "moon"],
    ["tailor", s.tabs.tailor, "sparkle"],
  ];
  const select = (t: Tab) => {
    setTab(t);
    setDest("");
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    const d = tab === "omra" ? "omra-la-mecque-medine" : dest;
    if (!d && tab !== "omra") {
      router.push(`/${locale}/voyages?type=${tab === "maroc" ? "national" : "international"}`);
      return;
    }
    q.set("destination", d);
    if (date) q.set("date", date);
    q.set("travelers", String(travelers));
    router.push(`/${locale}/circuits?${q}`);
  };
  const list = tab === "maroc" ? national : international;
  const cell = "flex min-w-0 flex-col gap-1 rounded-xl px-4 py-3 ring-1 ring-line focus-within:ring-gold";
  const lab = "text-xs font-semibold text-muted";
  const input = "w-full bg-transparent font-semibold text-night outline-none";

  return (
    <div className="rounded-card bg-white p-3 text-night shadow-float ring-1 ring-line sm:p-4">
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label={s.label}>
        {tabs.map(([k, label, icon]) => (
          <button
            key={k}
            id={`tab-${k}`}
            role="tab"
            type="button"
            aria-selected={tab === k}
            aria-controls="hero-search-panel"
            onClick={() => select(k)}
            className={`flex shrink-0 items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-night text-gold-light" : "text-muted hover:bg-ivory hover:text-night"}`}
          >
            <Icon name={icon} className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div id="hero-search-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-3">
        {tab === "tailor" ? (
          <div className="flex flex-col items-start gap-3 p-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted sm:text-base">{s.tailorPitch}</p>
            <Link href={`/${locale}/sur-mesure#demande`} className="btn btn-primary shrink-0">
              {s.tailorCta} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          <form role="search" onSubmit={submit} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.7fr_auto]">
            {tab === "omra" ? (
              <p className={`${cell} justify-center text-sm text-muted`}>{s.omraPitch}</p>
            ) : (
              <label className={cell}>
                <span className={lab}>{s.destination}</span>
                <select value={dest} onChange={(e) => setDest(e.target.value)} className={input}>
                  <option value="">{tab === "maroc" ? s.allMaroc : s.allWorld}</option>
                  {list.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={cell}>
              <span className={lab}>{s.month}</span>
              <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            </label>
            <label className={cell}>
              <span className={lab}>{s.travelers}</span>
              <input type="number" inputMode="numeric" min={1} max={30} value={travelers} onChange={(e) => setTravelers(Math.max(1, Number(e.target.value) || 1))} className={input} />
            </label>
            <button type="submit" className="btn btn-dark min-h-14 rounded-xl sm:col-span-2 lg:col-span-1">
              <Icon name="search" className="h-5 w-5" /> {tab === "omra" ? s.seeOmra : s.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
