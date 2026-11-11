import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { waLink } from "@/lib/site";
import { getBrand } from "@/lib/brand";
import { getPhotos } from "@/lib/photos";
import { PageHero } from "@/components/Cards";
import RequestForm from "@/components/RequestForm";
import { Icon } from "@/components/Icon";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).contact.title };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const brand = await getBrand();
  const wa = waLink(brand.whatsapp, t.contact.intro);
  const heroPhoto = (await getPhotos(locale))("tea");
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={brand.name} title={t.contact.title} text={t.contact.intro} variant="night" seed={44} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_320px]">
        <RequestForm locale={locale} kind="CONTACT" />
        <aside className="space-y-4">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-3xl bg-whatsapp p-6 text-white">
              <Icon name="whatsapp" className="h-7 w-7" /> {t.common.whatsapp}
            </a>
          )}
          <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
            <p className="font-display text-xl font-semibold text-night">{t.nav.account}</p>
            <p className="mt-2 text-sm text-muted">{t.account.intro}</p>
            <a href={`/${locale}/espace-client`} className="mt-4 inline-block font-semibold text-terracotta hover:underline">
              {t.account.lookup} →
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
