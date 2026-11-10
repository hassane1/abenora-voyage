import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getAgency, SERVICE_KEYS } from "@/i18n/agency";
import { getBrand } from "@/lib/brand";
import { waLink } from "@/lib/site";
import { getPhotos } from "@/lib/photos";
import { PageHero } from "@/components/Cards";
import { Icon } from "@/components/Icon";

export async function generateMetadata({ params }: PageProps<"/[locale]/services">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getAgency(locale).servicesTitle };
}

/** Services de l'agence : chaque service hors circuits réservables est traité sur demande (devis) */
export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const { locale: l } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const a = getAgency(locale);
  const [brand, photo] = await Promise.all([getBrand(), getPhotos(locale)]);
  return (
    <>
      <PageHero photo={photo("valley")} eyebrow={brand.name} title={a.servicesTitle} text={a.servicesText} variant="night" seed={31} />
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICE_KEYS.map((k) => {
            const s = a.services[k];
            const wa = waLink(brand.whatsapp, `${s.title} — ${brand.name}`);
            const bookable = k === "national";
            return (
              <li key={k} id={k} className="flex scroll-mt-28 flex-col rounded-3xl bg-white p-7 ring-1 ring-night/5">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-night text-sand">
                  <Icon name={s.icon} className="h-7 w-7" />
                </span>
                <h2 className="font-display mt-5 text-3xl font-semibold text-night">{s.title}</h2>
                <p className="mt-2 flex-1 leading-relaxed text-muted">{s.text}</p>
                {!bookable && <p className="mt-3 text-xs text-terracotta">{a.onRequest}</p>}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={bookable ? `/${locale}/voyages?type=national` : `/${locale}/sur-mesure?service=${k}#demande`} className="btn btn-primary !py-2 text-sm">
                    {bookable ? a.typologies.national.cta : a.serviceCta}
                  </Link>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn !py-2 text-sm text-night ring-1 ring-night/15 hover:ring-sand">
                      <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
