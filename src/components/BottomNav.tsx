"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getExtra } from "@/i18n/extra";
import { FAVORITES_KEY, TRIP_KEY, useLocalList } from "./useLocalList";
import { Icon } from "./Icon";

/** Barre de navigation mobile (style application) — masquée sur les pages qui ont leur propre barre d'action */
export default function BottomNav({ locale }: { locale: Locale }) {
  const x = getExtra(locale);
  const pathname = usePathname();
  const favs = useLocalList(FAVORITES_KEY);
  const trip = useLocalList(TRIP_KEY);
  if (/\/(circuits\/[^/]+|reservation)$/.test(pathname)) return null;
  const items = [
    { href: `/${locale}`, label: x.bottomNav.home, icon: "globe", exact: true },
    { href: `/${locale}/circuits`, label: x.bottomNav.circuits, icon: "route" },
    { href: `/${locale}/sur-mesure`, label: x.bottomNav.compose, icon: "sparkle", primary: true },
    { href: `/${locale}/favoris`, label: x.bottomNav.favorites, icon: "heart", badge: favs.list.length + trip.list.length },
    { href: `/${locale}/contact`, label: x.bottomNav.contact, icon: "phone" },
  ];
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-night/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navigation mobile">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link href={it.href} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-terracotta" : "text-night/70"}`}>
                {it.primary ? (
                  <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-terracotta text-white shadow-lg ring-4 ring-white">
                    <Icon name={it.icon} className="h-6 w-6" />
                  </span>
                ) : (
                  <Icon name={it.icon} className="h-6 w-6" filled={it.icon === "heart" && active} />
                )}
                {it.label}
                {!!it.badge && <span className="absolute end-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[10px] text-white">{it.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
