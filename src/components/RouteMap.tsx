"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/lib/site";
import "leaflet/dist/leaflet.css";

export type MapStop = {
  order: number;
  dayNumber: number;
  name: string;
  latitude: number;
  longitude: number;
  kind: string;
  modeToNext: string | null;
  description: string;
};

type Leg = { from: string; to: string; mode: string; distanceKm?: number; durationMin?: number };

const COLORS = { DRIVE: "#8C6420", WALK: "#0B1A2E", CAMEL: "#0B1A2E" } as Record<string, string>;

/**
 * Carte interactive d'un circuit (Leaflet + tuiles OpenStreetMap).
 * Les trajets en véhicule sont calculés par OSRM (tracé routier réel, distance et durée de conduite).
 * Les promenades / dromadaire sont des lignes indicatives en pointillés, sans durée inventée.
 */

/** Échappement HTML : le contenu des popups Leaflet est inséré comme HTML */
const esc = (v: string | null | undefined) =>
  String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string);

export default function RouteMap({ stops, locale, height = 460 }: { stops: MapStop[]; locale: Locale; height?: number }) {
  const t = getDictionary(locale);
  const el = useRef<HTMLDivElement>(null);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const key = stops.map((s) => `${s.latitude},${s.longitude},${s.modeToNext}`).join("|");

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // marqueurs (dédoublonnés par coordonnées)
      const seen = new Map<string, MapStop[]>();
      stops.forEach((s) => {
        const k = `${s.latitude},${s.longitude}`;
        seen.set(k, [...(seen.get(k) ?? []), s]);
      });
      let n = 0;
      for (const group of seen.values()) {
        n++;
        const s = group[0];
        const color = s.kind === "NIGHT" ? "#0B1A2E" : s.kind === "POI" ? "#D4A845" : "#8C6420";
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:999px;display:grid;place-items:center;font:600 12px sans-serif;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)">${n}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        const days = Array.from(new Set(group.map((g) => g.dayNumber))).map((d) => t.circuit.day(d)).join(" · ");
        const desc = group.map((g) => esc(g.description)).filter(Boolean).join("<br/>");
        L.marker([s.latitude, s.longitude], { icon, title: s.name })
          .addTo(map)
          .bindPopup(`<strong style="font-size:14px">${esc(s.name)}</strong><br/><span style="color:#8C6420;font-size:11px">${days}</span><p style="margin:6px 0 0">${desc}</p>`);
      }
      map.fitBounds(L.latLngBounds(stops.map((s) => [s.latitude, s.longitude])), { padding: [40, 40] });

      // tracés
      const results: Leg[] = [];
      let failed = false;
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i];
        const b = stops[i + 1];
        const mode = a.modeToNext ?? "DRIVE";
        if (a.latitude === b.latitude && a.longitude === b.longitude) continue;
        if (mode !== "DRIVE") {
          L.polyline([[a.latitude, a.longitude], [b.latitude, b.longitude]], { color: COLORS[mode], weight: 3, dashArray: "6 8", opacity: 0.8 }).addTo(map);
          results.push({ from: a.name, to: b.name, mode });
          continue;
        }
        try {
          const url = `${site.osrmUrl}/route/v1/driving/${a.longitude},${a.latitude};${b.longitude},${b.latitude}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.json();
          const route = data.routes?.[0];
          if (!route) throw new Error("no route");
          if (cancelled) return;
          L.geoJSON(route.geometry, { style: { color: COLORS.DRIVE, weight: 4, opacity: 0.9 } }).addTo(map);
          results.push({ from: a.name, to: b.name, mode, distanceKm: route.distance / 1000, durationMin: route.duration / 60 });
        } catch {
          failed = true;
          results.push({ from: a.name, to: b.name, mode });
        }
      }
      if (!cancelled) {
        setLegs(results);
        setState(failed ? "error" : "ok");
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, locale]);

  const fmtDur = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = Math.round(m % 60);
    return h ? `${h} h ${String(mm).padStart(2, "0")}` : `${mm} min`;
  };
  const drive = legs.filter((l) => l.distanceKm !== undefined);
  const totalKm = drive.reduce((s, l) => s + (l.distanceKm ?? 0), 0);
  const totalMin = drive.reduce((s, l) => s + (l.durationMin ?? 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div ref={el} style={{ height }} className="w-full overflow-hidden rounded-3xl bg-sand-light/40 ring-1 ring-night/10" />
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="h-1 w-6 rounded bg-terracotta" /> {t.map.legendDrive}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-0 w-6 border-t-2 border-dashed border-night" /> {t.map.legendWalk}
          </span>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
        <p className="font-display text-xl font-semibold text-night">{t.map.stops}</p>
        {state === "loading" && <p className="mt-4 text-sm text-muted">{t.map.computing}</p>}
        <ol className="mt-4 space-y-3 text-sm">
          {legs.map((l, i) => (
            <li key={i} className="flex gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${l.mode === "DRIVE" ? "bg-terracotta" : "bg-night"}`} />
              <div>
                <p className="font-medium text-night">
                  {l.from} → {l.to}
                </p>
                <p className="text-muted">
                  {l.distanceKm !== undefined
                    ? `${Math.round(l.distanceKm)} km · ${fmtDur(l.durationMin!)}`
                    : l.mode === "DRIVE"
                      ? "—"
                      : l.mode === "FLIGHT"
                        ? "✈"
                        : l.mode === "SEA"
                          ? "⛴"
                          : t.map.offRoad}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {drive.length > 0 && (
          <p className="mt-5 border-t border-night/10 pt-4 text-sm font-semibold text-night">
            {t.map.total} : {Math.round(totalKm)} km · {fmtDur(totalMin)}
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-muted">{state === "error" ? t.map.routingError : t.map.routingSource}</p>
      </div>
    </div>
  );
}
