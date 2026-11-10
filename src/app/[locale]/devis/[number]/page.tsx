import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale, type Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { db } from "@/lib/db";
import { getBrand } from "@/lib/brand";
import { formatDate, formatMad } from "@/lib/format";
import type { QuoteLine } from "@/lib/quotes";
import PrintButton from "@/components/PrintButton";
import { respondToQuote } from "./actions";

export const metadata: Metadata = { robots: { index: false } };

/** Devis personnalisé : consultation, acceptation / refus, impression PDF (accès par lien secret) */
export default async function QuotePage({ params, searchParams }: PageProps<"/[locale]/devis/[number]">) {
  const { locale: l, number } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const v = getV2(locale);
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  await connection();
  const q = token.length >= 20 ? await db.quote.findFirst({ where: { number: decodeURIComponent(number), accessToken: token, status: { not: "DRAFT" } }, include: { request: true } }) : null;
  if (!q) notFound();
  const brand = await getBrand();
  const expired = q.status === "SENT" && q.validUntil < new Date();
  const lines = q.lines as QuoteLine[];
  const deposit = Math.round((q.totalMad * q.depositPercent) / 100);
  const legal = [brand.legal.companyName, brand.legal.rc && `RC ${brand.legal.rc}`, brand.legal.ice && `ICE ${brand.legal.ice}`, brand.legal.license && `Licence ${brand.legal.license}`].filter(Boolean);
  const blocks = q.program.split("\n").reduce<{ title: string; items: string[] }[]>((acc, line) => {
    const tl = line.trim();
    if (!tl) return acc;
    if (tl.startsWith("##")) acc.push({ title: tl.replace(/^#+\s*/, ""), items: [] });
    else (acc[acc.length - 1] ?? (acc[acc.push({ title: "", items: [] }) - 1])).items.push(tl.replace(/^-\s*/, ""));
    return acc;
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-24 print:pt-4">
      <div className="rounded-[2rem] bg-white p-6 ring-1 ring-night/5 sm:p-10 print:ring-0">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-night/10 pb-6">
          <div>
            <p className="font-display text-3xl font-semibold text-night">{brand.name}</p>
            <p className="mt-1 text-xs text-muted">{[brand.address, brand.city, brand.phone, brand.email].filter(Boolean).join(" · ")}</p>
            {legal.length > 0 && <p className="text-xs text-muted">{legal.join(" · ")}</p>}
          </div>
          <div className="text-end">
            <p className="text-xs uppercase tracking-widest text-terracotta">{v.quote.number}</p>
            <p className="font-mono text-xl font-bold">{q.number}</p>
            <p className="text-xs text-muted">
              {v.quote.validUntil} {formatDate(q.validUntil, locale)}
            </p>
          </div>
        </div>

        <p className="eyebrow mt-8">{v.quote.title}</p>
        <h1 className="font-display mt-1 text-4xl font-semibold text-night">{q.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {q.request.name} · {v.quote.travelers} : {q.travelers}
          {q.startDate && ` · ${v.quote.startDate} : ${formatDate(q.startDate, locale)}`}
        </p>

        {sp.r === "accepted" && <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{v.quote.accepted}</p>}
        {sp.r === "declined" && <p className="mt-6 rounded-2xl bg-sand/15 p-4 text-sm text-night">{v.quote.declined}</p>}
        {q.status === "CONVERTED" && <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{v.quote.converted}</p>}
        {expired && <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{v.quote.expired}</p>}

        {blocks.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold text-night">{v.quote.program}</h2>
            <ol className="mt-4 space-y-4 border-s-2 border-sand/50 ps-6">
              {blocks.map((b, i) => (
                <li key={i}>
                  {b.title && <p className="font-semibold text-night">{b.title}</p>}
                  <ul className="mt-1 list-disc space-y-1 ps-5 text-sm text-night/80">
                    {b.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-8 break-inside-avoid">
          <h2 className="font-display text-2xl font-semibold text-night">{v.quote.pricing}</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-night/5">
                  <td className="py-2">{l.label}</td>
                  <td className="py-2 text-end text-muted">
                    {l.qty} × {formatMad(l.unitMad, locale)}
                  </td>
                  <td className="py-2 text-end font-medium">{formatMad(Math.round(l.qty * l.unitMad), locale)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-4 text-end font-semibold">
                  {v.quote.total}
                </td>
                <td className="pt-4 text-end font-display text-2xl font-semibold text-night">{formatMad(q.totalMad, locale)}</td>
              </tr>
              <tr>
                <td colSpan={2} className="text-end text-muted">
                  {v.quote.deposit} ({q.depositPercent} %)
                </td>
                <td className="text-end">{formatMad(deposit, locale)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {q.conditions && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="font-display text-2xl font-semibold text-night">{v.quote.conditions}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-night/80">{q.conditions}</p>
          </section>
        )}
        <p className="mt-8 text-xs text-muted">{v.quote.notBinding}</p>

        <div className="no-print mt-8 flex flex-wrap gap-3">
          {q.status === "SENT" && !expired && (
            <form action={respondToQuote} className="flex flex-wrap gap-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="number" value={q.number} />
              <input type="hidden" name="token" value={token} />
              <button name="answer" value="accept" className="btn btn-primary">
                {v.quote.accept}
              </button>
              <button name="answer" value="decline" className="btn ring-1 ring-night/20">
                {v.quote.decline}
              </button>
            </form>
          )}
          <PrintButton label={v.quote.print} className="btn btn-sand" />
        </div>
      </div>
    </div>
  );
}
