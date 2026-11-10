import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getActivities, getCircuits } from "@/lib/queries";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { PageHero } from "@/components/Cards";
import FavoritesView from "@/components/FavoritesView";

export const metadata: Metadata = { robots: { index: false } };

export default async function FavoritesPage({ params }: PageProps<"/[locale]/favoris">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  await connection();
  const [circuits, activities, options] = await Promise.all([getCircuits(), getActivities(), db.bookingOption.findMany({ where: { published: true } })]);
  return (
    <>
      <PageHero eyebrow={t.nav.favorites} title={t.favorites.title} variant="dusk" seed={12} />
      <div className="mx-auto max-w-5xl px-4 py-16">
        <FavoritesView
          locale={locale}
          items={[
            ...circuits.map((c) => ({ id: `circuit:${c.slug}`, href: `/${locale}/circuits/${c.slug}`, title: tr(c.title, locale), subtitle: t.common.daysNights(c.days, c.nights) })),
            ...activities.map((a) => ({ id: `activity:${a.slug}`, href: `/${locale}/activites/${a.slug}`, title: tr(a.title, locale), subtitle: t.categories[a.category] })),
          ]}
          tripOptions={Array.from(new Map(options.map((o) => [o.code, { code: o.code, label: tr(o.label, locale) }])).values())}
        />
      </div>
    </>
  );
}
