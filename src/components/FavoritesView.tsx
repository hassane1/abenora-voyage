"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { FAVORITES_KEY, TRIP_KEY, useLocalList } from "./useLocalList";
import { Icon } from "./Icon";

type Item = { id: string; href: string; title: string; subtitle: string };

export default function FavoritesView({ locale, items, tripOptions }: { locale: Locale; items: Item[]; tripOptions: { code: string; label: string }[] }) {
  const t = getDictionary(locale);
  const favs = useLocalList(FAVORITES_KEY);
  const trip = useLocalList(TRIP_KEY);
  const mine = items.filter((i) => favs.has(i.id));
  const tripItems = tripOptions.filter((o) => trip.has(o.code));
  return (
    <div className="space-y-10">
      {mine.length === 0 && tripItems.length === 0 && <p className="rounded-3xl bg-white p-10 text-center text-muted ring-1 ring-night/5">{t.favorites.empty}</p>}
      {mine.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {mine.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-night/5">
              <Link href={i.href} className="min-w-0">
                <p className="text-xs text-terracotta">{i.subtitle}</p>
                <p className="font-display truncate text-xl font-semibold text-night hover:text-terracotta">{i.title}</p>
              </Link>
              <button onClick={() => favs.remove(i.id)} aria-label={t.common.removeFromFavorites} className="rounded-full p-2 text-terracotta hover:bg-ivory">
                <Icon name="heart" filled />
              </button>
            </li>
          ))}
        </ul>
      )}
      {tripItems.length > 0 && (
        <div className="rounded-3xl bg-night p-6 text-white">
          <p className="font-display text-2xl text-sand">{t.common.addToTrip}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {tripItems.map((o) => (
              <li key={o.code} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
                {o.label}
                <button onClick={() => trip.remove(o.code)} aria-label="✕" className="opacity-70 hover:opacity-100">
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <Link href={`/${locale}/reservation`} className="btn btn-sand mt-6">
            {t.home.bookAdventure}
          </Link>
        </div>
      )}
    </div>
  );
}
