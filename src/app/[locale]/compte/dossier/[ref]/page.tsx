import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/customer";
import BookingFile from "@/components/account/BookingFile";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountBookingPage({ params, searchParams }: PageProps<"/[locale]/compte/dossier/[ref]">) {
  const { locale: l, ref } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const customer = await getCustomer();
  if (!customer) redirect(`/${locale}/compte`);
  const b = await db.booking.findFirst({ where: { reference: decodeURIComponent(ref).toUpperCase(), customerId: customer.id }, select: { id: true } });
  if (!b) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-24">
      <Link href={`/${locale}/compte?tab=reservations`} className="text-sm text-terracotta hover:underline">
        ← {getV2(locale).account.bookings}
      </Link>
      <div className="mt-6">
        <BookingFile bookingId={b.id} locale={locale} token={null} flags={{ msg: one("msg"), cancel: one("cancel"), review: one("review") }} />
      </div>
    </div>
  );
}
