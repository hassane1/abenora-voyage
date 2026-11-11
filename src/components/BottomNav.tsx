"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getSignature } from "@/i18n/signature";
import { FAVORITES_KEY, TRIP_KEY, useLocalList } from "./useLocalList";
import { Icon } from "./Icon";

/** Barre mobile flottante (fond nuit, bouton central « Devis » or) — masquée sur les pages qui ont leur propre barre d'action */
export default function BottomNav({ locale }: { locale: Locale }) {
  const s = getSignature(locale).bottomNav;
  const pathname = usePathname();
  const favs = useLocalList(FAVORITES_KEY);
  const trip = useLocalList(TRIP_KEY);
  if (/\/(circuits\/[^/]+|reservation)$/.test(pathname)) return null;
  const items = [
    { href: `/${locale}`, label: s.home, icon: "globe", exact: true },
    { href: `/${locale}/voyages`, label: s.trips, icon: "route" },
    { href: `/${locale}/sur-mesure#demande`, match: `/${locale}/sur-mesure`, label: s.quote, icon: "file", primary: true },
    { href: `/${locale}/favoris`, label: s.favorites, icon: "heart", badge: favs.list.length + trip.list.length },
    { href: `/${locale}/contact`, label: s.contact, icon: "phone" },
  ];
  return (
    <nav className="no-print fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 rounded-[1.25rem] bg-night/95 shadow-float ring-1 ring-white/10 backdrop-blur lg:hidden" aria-label="Navigation mobile">
      <ul className="grid grid-cols-5 items-end">
        {items.map((it) => {
          const target = it.match ?? it.href;
          const active = it.exact ? pathname === target : pathname.startsWith(target);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium ${active ? "text-gold-light" : "text-white/75"}`}
              >
                {it.primary ? (
                  <span className="-mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-gold text-night shadow-lift ring-4 ring-night">
                    <Icon name={it.icon} className="h-5 w-5" />
                  </span>
                ) : (
                  <Icon name={it.icon} className="h-5 w-5" filled={it.icon === "heart" && active} />
                )}
                <span className={it.primary ? "font-semibold text-gold-light" : ""}>{it.label}</span>
                {active && !it.primary && <span aria-hidden className="absolute top-1 h-1 w-1 rounded-full bg-gold" />}
                {!!it.badge && <span className="absolute end-[18%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-night">{it.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
