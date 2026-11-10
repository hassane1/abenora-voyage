import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { Logo } from "./Header";
import { site } from "@/lib/site";

export default function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const cols = [
    {
      title: t.nav.destinations,
      links: [
        { href: `/${locale}/destinations/merzouga`, label: "Merzouga" },
        { href: `/${locale}/destinations`, label: t.nav.destinations },
        { href: `/${locale}/circuits`, label: t.nav.circuits },
        { href: `/${locale}/activites`, label: t.nav.activities },
      ],
    },
    {
      title: t.brandTagline,
      links: [
        { href: `/${locale}/sur-mesure`, label: t.nav.tailorMade },
        { href: `/${locale}/comparer`, label: t.nav.compare },
        { href: `/${locale}/galerie`, label: t.nav.gallery },
        { href: `/${locale}/avis`, label: t.nav.reviews },
        { href: `/${locale}/blog`, label: t.nav.blog },
      ],
    },
    {
      title: t.nav.contact,
      links: [
        { href: `/${locale}/a-propos`, label: t.nav.about },
        { href: `/${locale}/contact`, label: t.nav.contact },
        { href: `/${locale}/reservation`, label: t.nav.book },
        { href: `/${locale}/espace-client`, label: t.nav.account },
      ],
    },
  ];
  return (
    <footer className="bg-night text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-white">
            <Logo className="h-9 w-9 text-sand" />
            <span className="font-display text-2xl tracking-[0.2em]">{site.name.toUpperCase()}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/60">{t.brandTagline}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="font-display text-lg text-sand">{c.title}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-sand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-white/50 md:flex-row md:justify-between lg:px-8">
          <p>
            © 2026 {site.name}. {t.footer.rights}
          </p>
          <p>{t.footer.legal}</p>
          <p>{t.footer.osm}</p>
        </div>
      </div>
    </footer>
  );
}
