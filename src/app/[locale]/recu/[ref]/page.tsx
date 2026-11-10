import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getV2 } from "@/i18n/v2";
import { db } from "@/lib/db";
import { findAccessibleBooking } from "@/lib/customer";
import { getBrand } from "@/lib/brand";
import { tr } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = { robots: { index: false } };

/** Reçu de paiement imprimable / enregistrable en PDF (récapitule les paiements enregistrés par l'agence) */
export default async function ReceiptPage({ params, searchParams }: PageProps<"/[locale]/recu/[ref]">) {
  const { locale: l, ref } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const v = getV2(locale);
  const sp = await searchParams;
  const access = await findAccessibleBooking(decodeURIComponent(ref), typeof sp.token === "string" ? sp.token : null);
  if (!access) notFound();
  const [b, brand] = await Promise.all([
    db.booking.findUniqueOrThrow({ where: { id: access.id }, include: { circuit: true, payments: { orderBy: { recordedAt: "asc" } } } }),
    getBrand(),
  ]);
  if (b.payments.length === 0) notFound();
  const paid = b.payments.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0);
  const legal = [brand.legal.companyName, brand.legal.rc && `RC ${brand.legal.rc}`, brand.legal.ice && `ICE ${brand.legal.ice}`, brand.legal.ifNumber && `IF ${brand.legal.ifNumber}`, brand.legal.license && `Licence ${brand.legal.license}`].filter(Boolean);
  return (
    <div className="mx-auto max-w-3xl bg-white px-6 pt-28 pb-16 print:pt-6">
      <div className="flex items-start justify-between gap-6 border-b border-night/10 pb-6">
        <div>
          <p className="font-display text-3xl font-semibold text-night">{brand.name}</p>
          <p className="mt-1 text-xs text-muted">{[brand.address, brand.city, brand.phone, brand.email].filter(Boolean).join(" · ")}</p>
          {legal.length > 0 && <p className="text-xs text-muted">{legal.join(" · ")}</p>}
        </div>
        <div className="text-end">
          <p className="text-xs uppercase tracking-widest text-terracotta">{v.account.receipt}</p>
          <p className="font-mono text-lg font-bold">{b.reference}</p>
          <p className="text-xs text-muted">{formatDate(new Date(), locale)}</p>
        </div>
      </div>
      <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">{t.booking.email}</dt>
          <dd className="font-medium">
            {b.firstName} {b.lastName}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{t.nav.circuits}</dt>
          <dd className="font-medium">
            {tr(b.circuit.title, locale)} — {formatDate(b.startDate, locale)}
          </dd>
        </div>
      </dl>
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-night/15 text-start text-xs uppercase text-muted">
            <th className="py-2 text-start">Date</th>
            <th className="py-2 text-start">Mode</th>
            <th className="py-2 text-start">Réf.</th>
            <th className="py-2 text-end">MAD</th>
          </tr>
        </thead>
        <tbody>
          {b.payments.map((p) => (
            <tr key={p.id} className="border-b border-night/5">
              <td className="py-2">{formatDate(p.recordedAt, locale)}</td>
              <td className="py-2">{p.kind === "REFUND" ? `Remboursement · ${p.method}` : p.method}</td>
              <td className="py-2 font-mono text-xs">{p.reference ?? "—"}</td>
              <td className="py-2 text-end">{(p.kind === "REFUND" ? -p.amountMad : p.amountMad).toLocaleString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 ms-auto w-full max-w-xs space-y-1 text-sm">
        <p className="flex justify-between">
          <span>{t.booking.total}</span> <strong>{formatMad(b.totalMad, locale)}</strong>
        </p>
        <p className="flex justify-between">
          <span>{v.account.paid}</span> <strong>{formatMad(paid, locale)}</strong>
        </p>
        <p className="flex justify-between">
          <span>{v.account.remaining}</span> <strong>{formatMad(Math.max(0, b.totalMad - paid), locale)}</strong>
        </p>
      </div>
      <p className="mt-10 text-xs text-muted">
        Document récapitulatif des paiements enregistrés par l&apos;agence. Il ne remplace pas la facture officielle, qui doit être émise par l&apos;agence conformément à ses obligations fiscales.
      </p>
      <div className="no-print mt-8">
        <PrintButton label={v.quote.print} className="btn btn-primary" />
      </div>
    </div>
  );
}
