"use client";

import { useState } from "react";

type Point = { label: string; bookings: number; revenue: number };

/** Graphique interactif (12 mois) : réservations ou encaissements, avec info-bulle au survol / focus */
export default function TrendChart({ data }: { data: Point[] }) {
  const [metric, setMetric] = useState<"bookings" | "revenue">("bookings");
  const [hover, setHover] = useState<number | null>(null);
  const values = data.map((d) => d[metric]);
  const max = Math.max(1, ...values);
  const fmt = (n: number) => (metric === "revenue" ? `${n.toLocaleString("fr-FR")} MAD` : `${n} dossier${n > 1 ? "s" : ""}`);
  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg bg-ivory p-1 text-xs font-semibold" role="tablist">
        {(
          [
            ["bookings", "Réservations"],
            ["revenue", "Encaissements"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={metric === k} onClick={() => setMetric(k)} className={`rounded-md px-3 py-1.5 ${metric === k ? "bg-white text-night shadow-sm" : "text-muted"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="relative flex h-52 items-end gap-1.5 sm:gap-2.5" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => {
          const v = values[i];
          return (
            <button
              key={d.label}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5 outline-none"
              aria-label={`${d.label} : ${fmt(v)}`}
            >
              <span className={`w-full rounded-t-md transition ${hover === i ? "bg-terracotta" : "bg-night/80 group-hover:bg-night"}`} style={{ height: `${(v / max) * 85}%`, minHeight: 3 }} />
              <span className="text-[10px] text-muted">{d.label}</span>
            </button>
          );
        })}
        {hover !== null && (
          <div className="pointer-events-none absolute -top-2 rounded-lg bg-night px-3 py-1.5 text-xs text-white shadow-lg" style={{ left: `${((hover + 0.5) / data.length) * 100}%`, transform: "translateX(-50%)" }}>
            <strong>{data[hover].label}</strong> · {fmt(values[hover])}
          </div>
        )}
      </div>
    </div>
  );
}
