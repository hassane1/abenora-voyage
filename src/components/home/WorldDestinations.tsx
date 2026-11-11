"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getSignature } from "@/i18n/signature";
import { Icon } from "../Icon";

export type WorldDestination = {
  slug: string;
  name: string;
  region: string;
  country: string;
  scope: "NATIONAL" | "INTERNATIONAL";
  omra: boolean;
  open: boolean;
  latitude: number;
  longitude: number;
};
type Filter = "all" | "NATIONAL" | "INTERNATIONAL" | "omra";

const esc = (v: string) => v.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string);
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Carte « Maroc + Monde » : destinations nationales et internationales réunies, avec filtres.
 * La carte Leaflet n'est chargée que lorsque la section approche de l'écran (pas de coût au premier affichage).
 */
export default function WorldDestinations({ locale, destinations }: { locale: Locale; destinations: WorldDestination[] }) {
  const s = getSignature(locale).world;
  const [filter, setFilter] = useState<Filter>("all");
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ map: import("leaflet").Map; layer: import("leaflet").LayerGroup; L: typeof import("leaflet") } | null>(null);

  const shown = useMemo(
    () => destinations.filter((d) => (filter === "all" ? true : filter === "omra" ? d.omra : d.scope === filter)),
    [destinations, filter],
  );

  // chargement différé de Leaflet
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !box.current) return;
        const map = L.map(box.current, { scrollWheelZoom: false, worldCopyJump: true, zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 12,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        mapRef.current = { map, layer: L.layerGroup().addTo(map), L };
        setReady(true);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      mapRef.current?.map.remove();
      mapRef.current = null;
    };
  }, []);

  // marqueurs selon le filtre
  useEffect(() => {
    const m = mapRef.current;
    if (!ready || !m) return;
    m.layer.clearLayers();
    const gold = cssVar("--color-gold") || "gold";
    const night = cssVar("--color-night") || "black";
    const emerald = cssVar("--color-emerald") || "green";
    shown.forEach((d) => {
      const marker = m.L.circleMarker([d.latitude, d.longitude], {
        radius: d.open ? 8 : 6,
        color: night,
        weight: 2,
        fillColor: d.omra ? emerald : gold,
        fillOpacity: d.open ? 1 : 0.55,
      });
      const link = d.open ? `<a href="/${locale}/destinations/${encodeURIComponent(d.slug)}">${esc(d.name)}</a>` : `${esc(d.name)} · ${esc(s.soon)}`;
      marker.bindPopup(`<strong>${link}</strong><br/>${esc(d.country)}`);
      marker.addTo(m.layer);
    });
    if (shown.length) m.map.fitBounds(m.L.latLngBounds(shown.map((d) => [d.latitude, d.longitude])), { padding: [40, 40], maxZoom: 6 });
  }, [ready, shown, locale, s.soon]);

  const filters: Filter[] = ["all", "NATIONAL", "INTERNATIONAL", "omra"];
  return (
    <section id="carte" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-section lg:px-8" aria-labelledby="world-title">
      <div className="max-w-2xl">
        <p className="eyebrow">{s.eyebrow}</p>
        <h2 id="world-title" className="font-display mt-3 text-4xl leading-tight text-night md:text-5xl">
          {s.title}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{s.text}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label={s.eyebrow}>
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`chip ${filter === f ? "chip-active" : ""}`}
          >
            {s.filters[f]}
          </button>
        ))}
        <span className="ms-auto text-sm text-muted" aria-live="polite">
          {s.count(shown.length)}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-card bg-night/5 ring-1 ring-line">
          <div ref={box} className="h-[22rem] w-full md:h-[28rem]" role="region" aria-label={s.mapLabel} />
          {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-muted">{s.loading}</p>}
        </div>
        <ul className="grid max-h-[28rem] content-start gap-2 overflow-y-auto pe-1">
          {shown.map((d) => {
            const inner = (
              <>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${d.omra ? "bg-emerald text-white" : d.scope === "NATIONAL" ? "bg-gold-light text-night" : "bg-night text-gold-light"}`}>
                  <Icon name={d.omra ? "moon" : d.scope === "NATIONAL" ? "pin" : "globe"} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-night">{d.name}</span>
                  <span className="block truncate text-xs text-muted">{d.scope === "NATIONAL" ? d.region : d.country}</span>
                </span>
                {d.open ? <Icon name="arrow" className="h-4 w-4 shrink-0 text-gold-deep rtl:rotate-180" /> : <span className="shrink-0 text-xs text-muted">{s.soon}</span>}
              </>
            );
            return (
              <li key={d.slug}>
                {d.open ? (
                  <Link href={`/${locale}/destinations/${d.slug}`} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-line transition hover:shadow-card">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-line">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
