import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import BookingWizard from "@/components/booking/BookingWizard";
import { resolveGrid } from "@/lib/pricing";

export async function generateMetadata({ params }: PageProps<"/[locale]/reservation">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).booking.title, robots: { index: false } };
}

export default async function ReservationPage({ params, searchParams }: PageProps<"/[locale]/reservation">) {
  const { locale: l } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const sp = await searchParams;
  await connection();

  const [destinations, circuits, options] = await Promise.all([
    db.destination.findMany({ orderBy: { sortOrder: "asc" } }),
    db.circuit.findMany({ where: { published: true, destination: { published: true } }, orderBy: { sortOrder: "asc" }, include: { destination: true } }),
    db.bookingOption.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-24 lg:px-8">
      <p className="eyebrow">{t.nav.book}</p>
      <h1 className="font-display mt-2 text-5xl font-semibold text-night">{t.booking.title}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t.booking.subtitle}</p>
      <div className="mt-10">
        <BookingWizard
          locale={locale}
          initialCircuit={typeof sp.circuit === "string" ? sp.circuit : undefined}
          initialDestination={typeof sp.destination === "string" ? sp.destination : undefined}
          destinations={destinations.map((d) => ({ slug: d.slug, name: tr(d.name, locale), available: d.published && circuits.some((c) => c.destinationId === d.id) }))}
          circuits={circuits.map((c) => ({
            id: c.id,
            slug: c.slug,
            destinationSlug: c.destination.slug,
            title: tr(c.title, locale),
            summary: tr(c.summary, locale),
            days: c.days,
            nights: c.nights,
            priceAdultMad: c.priceAdultMad,
            priceStatus: c.priceStatus,
            depositPercent: c.depositPercent,
            priceGrid: resolveGrid(c.priceGrid, (v) => tr<string>(v, locale, "")),
            options: options
              .filter((o) => o.circuitId === null || o.circuitId === c.id)
              .map((o) => ({
                code: o.code,
                group: o.group,
                label: tr(o.label, locale),
                description: tr(o.description, locale),
                priceMad: o.priceMad,
                unit: o.unit,
                exclusiveGroup: o.exclusiveGroup,
                isDefault: o.isDefault,
                priceStatus: o.priceStatus,
              })),
          }))}
        />
      </div>
    </div>
  );
}
