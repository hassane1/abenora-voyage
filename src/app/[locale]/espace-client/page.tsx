import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import type { PriceResult } from "@/lib/pricing";
import { PriceTable } from "@/components/booking/BookingWizard";
import { Icon } from "@/components/Icon";
import { lookupBooking, submitReview } from "./actions";

export const metadata: Metadata = { robots: { index: false } };

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  CANCELLED: "bg-night/10 text-night",
};

export default async function ClientSpace({ params, searchParams }: PageProps<"/[locale]/espace-client">) {
  const { locale: l } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const sp = await searchParams;
  await connection();
  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const token = typeof sp.token === "string" ? sp.token : "";
  const booking =
    ref && token
      ? await db.booking.findFirst({
          where: { reference: ref, accessToken: token },
          include: { circuit: { include: { destination: true } }, events: { orderBy: { createdAt: "asc" } }, review: true, payments: true },
        })
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-24">
      <p className="eyebrow">{t.nav.account}</p>
      <h1 className="font-display mt-2 text-5xl font-semibold text-night">{t.account.title}</h1>

      {!booking && (
        <>
          <p className="mt-3 text-muted">{t.account.intro}</p>
          {sp.notfound && (
            <p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
              {t.account.notFound}
            </p>
          )}
          <form action={lookupBooking} className="mt-8 grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="locale" value={locale} />
            <label>
              <span className="label">{t.booking.reference}</span>
              <input name="ref" required className="field uppercase" placeholder="RML-…" />
            </label>
            <label>
              <span className="label">{t.booking.email}</span>
              <input name="email" type="email" required className="field" autoComplete="email" />
            </label>
            <button className="btn btn-primary">{t.account.lookup}</button>
          </form>
        </>
      )}

      {booking && (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">{t.booking.reference}</p>
                <p className="font-mono text-2xl font-bold text-night">{booking.reference}</p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyle[booking.status]}`}>{t.status[booking.status]}</span>
            </div>
            {booking.status === "PENDING" && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{t.booking.successText}</p>}
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <Item k={t.nav.circuits} v={`${tr(booking.circuit.title, locale)} — ${tr(booking.circuit.destination.name, locale)}`} />
              <Item k={t.booking.chooseDate} v={`${formatDate(booking.startDate, locale)} → ${formatDate(booking.endDate, locale)}`} />
              <Item k={t.home.searchTravelers} v={`${booking.adults} + ${booking.children} · ${booking.privateTour ? t.booking.private : t.booking.shared}`} />
              <Item k={t.booking.email} v={`${booking.firstName} ${booking.lastName} — ${booking.email}`} />
              {(booking.options as { label: string }[]).length > 0 && <Item k={t.booking.options} v={(booking.options as { label: string }[]).map((o) => o.label).join(", ")} />}
            </dl>
          </div>

          <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-night">{t.booking.summary}</h2>
            <div className="mt-4">
              <PriceTable price={booking.pricing as unknown as PriceResult} locale={locale} depositPercent={booking.circuit.depositPercent} />
            </div>
            {booking.payments.length > 0 && (
              <p className="mt-4 text-sm text-emerald-800">
                ✓ {formatMad(booking.payments.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0), locale)}
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-night">{t.account.history}</h2>
            <ol className="mt-4 space-y-3 border-s-2 border-sand/40 ps-6 text-sm">
              {booking.events
                .filter((e) => e.type !== "EMAIL")
                .map((e) => (
                  <li key={e.id}>
                    <p className="font-medium text-night">{e.toStatus ? t.status[e.toStatus] : e.note}</p>
                    <p className="text-xs text-muted">{formatDate(e.createdAt, locale, { dateStyle: "medium", timeStyle: "short" } as Intl.DateTimeFormatOptions)}</p>
                  </li>
                ))}
            </ol>
          </div>

          {(() => {
            const wa = whatsappLink(`${t.booking.reference} ${booking.reference}`);
            return (
              wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white">
                  <Icon name="whatsapp" className="h-4 w-4" /> {t.common.whatsapp}
                </a>
              )
            );
          })()}

          <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-night">{t.account.leaveReview}</h2>
            {sp.review || booking.review ? (
              <p className="mt-3 text-emerald-800">{t.account.reviewSent}</p>
            ) : booking.status === "CONFIRMED" && booking.endDate < new Date() ? (
              <form action={submitReview} className="mt-4 grid gap-4">
                <input type="hidden" name="ref" value={booking.reference} />
                <input type="hidden" name="token" value={booking.accessToken} />
                <input type="hidden" name="locale" value={locale} />
                <label>
                  <span className="label">{t.account.rating}</span>
                  <select name="rating" className="field" defaultValue="5">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {"★".repeat(n)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label">{t.account.reviewTitle}</span>
                  <input name="title" required maxLength={120} className="field" />
                </label>
                <label>
                  <span className="label">{t.account.reviewText}</span>
                  <textarea name="comment" required minLength={10} maxLength={2000} rows={4} className="field" />
                </label>
                <label>
                  <span className="label">{t.account.yourName}</span>
                  <input name="authorName" required maxLength={60} defaultValue={`${booking.firstName} ${booking.lastName.charAt(0)}.`} className="field" />
                </label>
                <button className="btn btn-primary w-fit">{t.contact.submit}</button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-muted">{t.account.reviewOnlyAfter}</p>
            )}
          </div>

          <Link href={`/${locale}/espace-client`} className="inline-block text-sm text-terracotta hover:underline">
            ← {t.common.back}
          </Link>
        </div>
      )}
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium text-night">{v}</dd>
    </div>
  );
}
