"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Petite liste persistée dans localStorage, synchronisée entre composants et onglets */
const EVENT = "rimal-storage";

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const cache = new Map<string, { raw: string | null; value: string[] }>();
const EMPTY: string[] = [];

function snapshot(key: string) {
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  const value = read(key);
  cache.set(key, { raw, value });
  return value;
}

export function useLocalList(key: string) {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener(EVENT, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(EVENT, cb);
      window.removeEventListener("storage", cb);
    };
  }, []);
  const list = useSyncExternalStore(subscribe, () => snapshot(key), () => EMPTY);

  const write = useCallback(
    (next: string[]) => {
      window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(next))));
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  const toggle = useCallback((id: string) => write(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]), [list, write]);
  const add = useCallback((id: string) => write([...list, id]), [list, write]);
  const remove = useCallback((id: string) => write(list.filter((x) => x !== id)), [list, write]);

  return { list, toggle, add, remove, has: (id: string) => list.includes(id), clear: () => write([]) };
}

export const FAVORITES_KEY = "rimal-favorites"; // "circuit:slug" | "activity:slug"
export const TRIP_KEY = "rimal-trip"; // codes d'options de réservation ajoutées depuis les fiches activités
