"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import RouteMap, { type MapStop } from "./RouteMap";

/** Carte adaptée au circuit choisi */
export default function CircuitMapTabs({ circuits, locale }: { circuits: { slug: string; title: string; stops: MapStop[] }[]; locale: Locale }) {
  const [active, setActive] = useState(circuits[0]?.slug);
  const current = circuits.find((c) => c.slug === active) ?? circuits[0];
  if (!current) return null;
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {circuits.map((c) => (
          <button
            key={c.slug}
            role="tab"
            aria-selected={c.slug === current.slug}
            onClick={() => setActive(c.slug)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${c.slug === current.slug ? "bg-night text-white" : "bg-white text-night ring-1 ring-night/10 hover:bg-sand-light/40"}`}
          >
            {c.title}
          </button>
        ))}
      </div>
      <RouteMap key={current.slug} stops={current.stops} locale={locale} />
    </div>
  );
}
