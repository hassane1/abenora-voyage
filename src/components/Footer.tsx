import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getV2 } from "@/i18n/v2";
import { getAgency } from "@/i18n/agency";
import { getBrand } from "@/lib/brand";
import { LEGAL_SLUGS } from "@/lib/content";
import { BrandMark } from "./Header";
import { Icon } from "./Icon";

export default async function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const v = getV2(locale);
  const ag = getAgency(locale);
  const brand = await getBrand();
  const tagline = brand.tagline[locale] || t.brandTagline;
  const cols = [
    {
      title: ag.nav.trips,
      links: [
        { href: `/${locale}/voyages?type=national`, label: ag.typologies.national.title },
        { href: `/${locale}/voyages?type=international`, label: ag.typologies.international.title },
        { href: `/${locale}/destinations`, label: t.nav.destinations },
        { href: `/${locale}/services`, label: ag.nav.services },
        { href: `/${locale}/sur-mesure`, label: t.nav.tailorMade },
      ],
    },
    {
      title: brand.name,
      links: [
        { href: `/${locale}/a-propos`, label: t.nav.about },
        { href: `/${locale}/avis`, label: t.nav.reviews },
        { href: `/${locale}/galerie`, label: t.nav.gallery },
        { href: `/${locale}/blog`, label: t.nav.blog },
        { href: `/${locale}/compte`, label: v.account.space },
        { href: `/${locale}/espace-client`, label: t.nav.account },
      ],
    },
    {
      title: v.footer.legal,
      links: LEGAL_SLUGS.map((s) => ({ href: `/${locale}/legal/${s}`, label: v.legalPages[s] })),
    },
  ];
  const socials = (
    [
      ["instagram", brand.socials.instagram, "Instagram"],
      ["facebook", brand.socials.facebook, "Facebook"],
      ["tiktok", brand.socials.tiktok, "TikTok"],
      ["youtube", brand.socials.youtube, "YouTube"],
    ] as const
  ).filter(([, url]) => /^https:\/\//.test(url));
  const hasContact = brand.phone || brand.email || brand.address || brand.whatsapp;
  const legalIds = [
    brand.legal.companyName && `${brand.legal.companyName}${brand.legal.legalForm ? ` (${brand.legal.legalForm})` : ""}`,
    brand.legal.rc && `RC ${brand.legal.rc}`,
    brand.legal.ice && `ICE ${brand.legal.ice}`,
    brand.legal.license && `${v.footer.licence} : ${brand.legal.license}`,
  ].filter(Boolean);

  return (
    <footer className="bg-night text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 text-white">
            <BrandMark logoUrl={brand.logoUrl} className="h-10 w-10 text-sand" />
            <span className="font-display text-2xl tracking-[0.12em] uppercase">{brand.name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">{tagline}</p>
          <p className="font-display mt-8 text-lg text-sand">{v.footer.contact}</p>
          {hasContact ? (
            <ul className="mt-3 space-y-2 text-sm">
              {/* plusieurs numéros possibles, séparés par « / » */}
              {brand.phone
                .split(/[/|,;]/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p) => (
                  <li key={p}>
                    <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 hover:text-sand" dir="ltr">
                      <Icon name="phone" className="h-4 w-4" /> {p}
                    </a>
                  </li>
                ))}
              {brand.whatsapp && (
                <li>
                  <a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-sand" dir="ltr">
                    <Icon name="whatsapp" className="h-4 w-4" /> +{brand.whatsapp}
                  </a>
                </li>
              )}
              {brand.email && (
                <li>
                  <a href={`mailto:${brand.email}`} className="inline-flex items-center gap-2 hover:text-sand">
                    <Icon name="mail" className="h-4 w-4" /> {brand.email}
                  </a>
                </li>
              )}
              {(brand.address || brand.city) && (
                <li className="flex items-start gap-2">
                  <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0" /> {[brand.address, brand.city].filter(Boolean).join(", ")}
                </li>
              )}
              {brand.hours && (
                <li className="flex items-start gap-2">
                  <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" /> {brand.hours}
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-white/40">{v.footer.notConfigured}</p>
          )}
          {socials.length > 0 && (
            <div className="mt-6 flex gap-2" aria-label={v.footer.follow}>
              {socials.map(([icon, url, label]) => (
                <a key={icon} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-sand hover:text-night">
                  <Icon name={icon} className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
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
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-white/50 md:flex-row md:flex-wrap md:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} {brand.name}. {t.footer.rights}
          </p>
          {legalIds.length > 0 && <p>{legalIds.join(" · ")}</p>}
          <p>{t.footer.legal}</p>
          <p>{t.footer.osm}</p>
        </div>
      </div>
    </footer>
  );
}
