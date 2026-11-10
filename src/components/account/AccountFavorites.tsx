"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FAVORITES_KEY, useLocalList } from "../useLocalList";
import { Icon } from "../Icon";
import { removeFavorite, syncFavorites } from "@/app/[locale]/compte/actions";

type Item = { id: string; href: string; title: string; subtitle: string };

/** Favoris du compte : fusion avec les favoris enregistrés dans ce navigateur */
export default function AccountFavorites({ items, initial, empty }: { items: Item[]; initial: string[]; empty: string }) {
  const local = useLocalList(FAVORITES_KEY);
  const [server, setServer] = useState<string[]>(initial);
  const localKey = local.list.join("|");
  useEffect(() => {
    let alive = true;
    syncFavorites(localKey ? localKey.split("|") : []).then((merged) => {
      if (!alive) return;
      setServer(merged);
    });
    return () => {
      alive = false;
    };
  }, [localKey]);
  const ids = new Set([...server, ...local.list]);
  const mine = items.filter((i) => ids.has(i.id));
  if (mine.length === 0) return <p className="rounded-3xl bg-white p-10 text-center text-muted ring-1 ring-night/5">{empty}</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {mine.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-night/5">
          <Link href={i.href} className="min-w-0">
            <p className="text-xs text-terracotta">{i.subtitle}</p>
            <p className="font-display truncate text-xl font-semibold text-night hover:text-terracotta">{i.title}</p>
          </Link>
          <button
            onClick={async () => {
              local.remove(i.id);
              setServer(await removeFavorite(i.id));
            }}
            aria-label="Retirer"
            className="rounded-full p-2 text-terracotta hover:bg-ivory"
          >
            <Icon name="heart" filled />
          </button>
        </li>
      ))}
    </ul>
  );
}
