"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localeMeta, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getV2 } from "@/i18n/v2";
import { FAVORITES_KEY, TRIP_KEY, useLocalList } from "./useLocalList";
import { Icon } from "./Icon";
import { useBrand } from "./BrandProvider";
import type { ActiveBanner } from "@/lib/content";

export default function Header({ locale, banner }: { locale: Locale; banner?: ActiveBanner | null }) {
  const t = getDictionary(locale);
  const pathname = usePathname();
  const brand = useBrand();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const favs = useLocalList(FAVORITES_KEY);
  const trip = useLocalList(TRIP_KEY);
  const isHome = pathname === `/${locale}`;
  const solid = scrolled || !isHome || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // fermer le menu mobile à chaque navigation
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const links = [
    { href: `/${locale}/destinations/merzouga`, label: "Merzouga" },
    { href: `/${locale}/circuits`, label: t.nav.circuits },
    { href: `/${locale}/activites`, label: t.nav.activities },
    { href: `/${locale}/sur-mesure`, label: t.nav.tailorMade },
    { href: `/${locale}/destinations`, label: t.nav.destinations },
    { href: `/${locale}/blog`, label: t.nav.blog },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ];
  const secondary = [
    { href: `/${locale}/galerie`, label: t.nav.gallery },
    { href: `/${locale}/avis`, label: t.nav.reviews },
    { href: `/${locale}/a-propos`, label: t.nav.about },
    { href: `/${locale}/comparer`, label: t.nav.compare },
    { href: `/${locale}/compte`, label: getV2(locale).account.space },
    { href: `/${locale}/espace-client`, label: t.nav.account },
  ];

  const switchTo = (l: Locale) => {
    const rest = pathname.replace(/^\/(fr|en|ar)(?=\/|$)/, "");
    return `/${l}${rest}`;
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        solid ? "bg-ivory/95 text-night shadow-[0_1px_0_rgba(20,40,63,0.08)] backdrop-blur" : "bg-transparent text-white"
      }`}
    >
      {banner && (
        <div className="bg-terracotta px-4 py-1.5 text-center text-xs font-medium text-white sm:text-sm">
          {banner.text}
          {banner.linkUrl && (
            <Link href={banner.linkUrl} className="ms-2 font-semibold underline underline-offset-2">
              {banner.linkLabel || "→"}
            </Link>
          )}
        </div>
      )}
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 py-3 lg:px-8">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2" aria-label={brand.name}>
          <BrandMark logoUrl={brand.logoUrl} className={`h-9 w-9 shrink-0 ${solid ? "text-terracotta" : "text-sand"}`} />
          <BrandName name={brand.name} />
        </Link>

        <nav className="ms-6 hidden flex-1 items-center gap-6 text-sm font-medium xl:flex" aria-label="Navigation principale">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`transition hover:text-sand ${pathname.startsWith(l.href) ? "text-sand" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-current/20 p-0.5 text-xs sm:flex" role="group" aria-label="Langue">
            {locales.map((l) => (
              <Link
                key={l}
                href={switchTo(l)}
                onClick={() => (document.cookie = `locale=${l};path=/;max-age=31536000`)}
                className={`rounded-full px-2.5 py-1 font-semibold ${l === locale ? (solid ? "bg-night text-white" : "bg-white text-night") : "opacity-70 hover:opacity-100"}`}
                hrefLang={l}
                lang={l}
              >
                {localeMeta[l].short}
              </Link>
            ))}
          </div>
          <Link href={`/${locale}/compte`} className="hidden rounded-full p-2 hover:bg-black/5 sm:block" aria-label={getV2(locale).account.space} title={getV2(locale).account.space}>
            <Icon name="user" className="h-5 w-5" />
          </Link>
          <Link href={`/${locale}/favoris`} className="relative rounded-full p-2 hover:bg-black/5" aria-label={t.nav.favorites}>
            <Icon name="heart" className="h-5 w-5" />
            {favs.list.length + trip.list.length > 0 && (
              <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white">
                {favs.list.length + trip.list.length}
              </span>
            )}
          </Link>
          <Link href={`/${locale}/reservation`} className="btn btn-primary hidden !py-2 text-sm sm:inline-flex">
            {t.nav.book}
          </Link>
          <button className="rounded-full p-2 xl:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="menu-mobile" aria-label={open ? t.nav.close : t.nav.menu}>
            <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-mobile" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-night/10 bg-ivory px-4 pb-8 xl:hidden">
          <nav className="flex flex-col py-2 text-lg" aria-label="Menu mobile">
            {[...links, ...secondary].map((l) => (
              <Link key={l.href} href={l.href} className="border-b border-night/5 py-3 font-display text-2xl">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            {locales.map((l) => (
              <Link key={l} href={switchTo(l)} lang={l} className={`rounded-full border px-4 py-2 text-sm ${l === locale ? "border-night bg-night text-white" : "border-night/20"}`}>
                {localeMeta[l].label}
              </Link>
            ))}
          </div>
          <Link href={`/${locale}/reservation`} className="btn btn-primary mt-6 w-full">
            {t.home.bookAdventure}
          </Link>
        </div>
      )}
    </header>
  );
}

/** Logo téléversé dans l'admin, sinon monogramme par défaut */
export function BrandMark({ logoUrl, className = "" }: { logoUrl: string | null; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (logoUrl) return <img src={logoUrl} alt="" className={`${className} object-contain`} />;
  return <Logo className={className} />;
}

/** Nom de marque sur deux niveaux : premier mot(s) en capitales espacées, dernier mot en surtitre discret */
export function BrandName({ name, className = "" }: { name: string; className?: string }) {
  const words = name.trim().split(/\s+/);
  const main = words.length > 2 ? words.slice(0, -1).join(" ") : name;
  const sub = words.length > 2 ? words[words.length - 1] : "";
  return (
    <span className={`flex min-w-0 flex-col leading-none ${className}`}>
      <span className="font-display truncate text-xl font-semibold tracking-[0.12em] uppercase sm:text-2xl">{main}</span>
      {sub && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.45em] opacity-70">{sub}</span>}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  // Monogramme : dune stylisée sous une étoile à huit branches (motif zellige)
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M20 4l3 5.5 6-1.5-1.5 6L33 17l-5.5 3 1.5 6-6-1.5L20 30l-3-5.5-6 1.5 1.5-6L7 17l5.5-3L11 8l6 1.5z" opacity=".9" />
      <path d="M2 36c6-6 12-8 18-5s12 2 18-3" strokeLinecap="round" />
    </svg>
  );
}
