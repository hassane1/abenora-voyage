"use client";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { FAVORITES_KEY, TRIP_KEY, useLocalList } from "./useLocalList";
import { Icon } from "./Icon";

export function FavoriteButton({ id, locale, className = "" }: { id: string; locale: Locale; className?: string }) {
  const t = getDictionary(locale);
  const favs = useLocalList(FAVORITES_KEY);
  const on = favs.has(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        favs.toggle(id);
      }}
      aria-pressed={on}
      aria-label={on ? t.common.removeFromFavorites : t.common.addToFavorites}
      title={on ? t.common.removeFromFavorites : t.common.addToFavorites}
      className={`grid h-10 w-10 place-items-center rounded-full bg-white/90 text-terracotta shadow transition hover:scale-110 ${className}`}
    >
      <Icon name="heart" filled={on} className="h-5 w-5" />
    </button>
  );
}

export function AddToTripButton({ code, locale, className = "" }: { code: string | null; locale: Locale; className?: string }) {
  const t = getDictionary(locale);
  const trip = useLocalList(TRIP_KEY);
  if (!code) return <p className={`text-sm text-muted ${className}`}>{t.activity.notBookable}</p>;
  const on = trip.has(code);
  return (
    <button
      type="button"
      onClick={() => trip.toggle(code)}
      aria-pressed={on}
      className={`btn ${on ? "bg-night text-white" : "btn-primary"} ${className}`}
    >
      <Icon name={on ? "check" : "plus"} className="h-4 w-4" />
      {on ? t.activity.added : t.common.addToTrip}
    </button>
  );
}
