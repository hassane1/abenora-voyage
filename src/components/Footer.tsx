import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getV2 } from "@/i18n/v2";
import { getAgency } from "@/i18n/agency";
import { getSignature } from "@/i18n/signature";
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
  // mentions légales : chaque champ est éditable dans Administration → Identité
  const lf = getSignature(locale).footer;
  const L = brand.legal;
  const legalRows = (
    [
      [lf.company, [L.companyName, L.legalForm].filter(Boolean).join(", ")],
      [lf.capital, L.capital],
      [lf.address, [brand.address, brand.city].filter(Boolean).join(", ")],
      [lf.rc, L.rc],
      [lf.ice, L.ice],
      [lf.ifNumber, L.ifNumber],
      [lf.patente, L.patente],
      [lf.license, L.license],
      [lf.cndp, L.cndp],
      [lf.host, L.host],
    ] as const
  ).filter(([, val]) => !!val);

  return (
    <footer className="bg-night text-white/80">
      <div aria-hidden className="band-star" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-7 px-4 py-10 lg:grid-cols-5 lg:gap-x-8 lg:px-8">
        <div className="col-span-2">
          <div className="flex items-center gap-3 text-white">
            <BrandMark logoUrl={brand.logoUrl} className="h-8 w-8 text-gold" />
            <span className="font-display text-xl">{brand.name}</span>
          </div>
          <p className="mt-2 max-w-sm text-sm leading-snug text-white/75">{tagline}</p>
          <p className="mt-5 text-[13px] font-semibold tracking-wide text-gold-light uppercase">{v.footer.contact}</p>
          {hasContact ? (
            <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {/* plusieurs numéros possibles, séparés par « / » */}
              {brand.phone
                .split(/[/|,;]/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p) => (
                  <li key={p}>
                    <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 hover:text-gold-light" dir="ltr">
                      <Icon name="phone" className="h-4 w-4" /> {p}
                    </a>
                  </li>
                ))}
              {brand.whatsapp && (
                <li>
                  <a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gold-light" dir="ltr">
                    <Icon name="whatsapp" className="h-4 w-4" /> +{brand.whatsapp}
                  </a>
                </li>
              )}
              {brand.email && (
                <li>
                  <a href={`mailto:${brand.email}`} className="inline-flex items-center gap-2 hover:text-gold-light">
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
            <p className="mt-2 text-sm text-white/70">{v.footer.notConfigured}</p>
          )}
          {socials.length > 0 && (
            <div className="mt-4 flex gap-2" aria-label={v.footer.follow}>
              {socials.map(([icon, url, label]) => (
                <a key={icon} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-gold hover:text-night">
                  <Icon name={icon} className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((c, i) => (
          // la colonne « informations légales » occupe toute la largeur sur mobile, sur deux colonnes
          <div key={c.title} className={i === 2 ? "col-span-2 lg:col-span-1" : undefined}>
            <p className="text-[13px] font-semibold tracking-wide text-gold-light uppercase">{c.title}</p>
            <ul className={`mt-2 text-sm ${i === 2 ? "grid grid-cols-2 gap-x-6 gap-y-1 lg:grid-cols-1" : "space-y-1"}`}>
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-1 hover:text-gold-light">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 lg:px-8">
          <p className="text-[13px] font-semibold tracking-wide text-gold-light uppercase">{lf.legalTitle}</p>
          {legalRows.length > 0 ? (
            <dl className="mt-2 grid gap-x-8 gap-y-1 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
              {legalRows.map(([k, val]) => (
                <div key={k} className="flex gap-2">
                  <dt className="shrink-0 text-white/70">{k} :</dt>
                  <dd className="text-white/90">{val}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-[13px] text-white/70">{lf.pending}</p>
          )}
          <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4 text-[13px] text-white/70 md:flex-row md:flex-wrap md:justify-between md:gap-x-6">
            <p>
              © {new Date().getFullYear()} {brand.name}. {t.footer.rights}
            </p>
            <p>{t.footer.legal}</p>
            <p>{t.footer.osm}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
