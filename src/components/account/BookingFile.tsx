import Link from "next/link";
import { db } from "@/lib/db";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getV2 } from "@/i18n/v2";
import { tr } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import { waLink } from "@/lib/site";
import { getBrand } from "@/lib/brand";
import type { PriceResult } from "@/lib/pricing";
import { PriceTable } from "@/components/booking/BookingWizard";
import { Icon } from "@/components/Icon";
import { priceNote } from "@/components/Price";
import { requestCancellation, sendBookingMessage } from "@/app/[locale]/dossier-actions";
import { submitReview } from "@/app/[locale]/espace-client/actions";

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  CANCELLED: "bg-night/10 text-night",
};

/**
 * Dossier de voyage complet (espace voyageur ou accès sans compte).
 * `token` n'est fourni qu'en accès sans compte : il est renvoyé dans les formulaires pour prouver le droit d'accès.
 */
export default async function BookingFile({ bookingId, locale, token, flags }: { bookingId: string; locale: Locale; token: string | null; flags: Record<string, string | undefined> }) {
  const t = getDictionary(locale);
  const v = getV2(locale);
  const brand = await getBrand();
  const booking = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
      circuit: { include: { destination: true } },
      events: { orderBy: { createdAt: "asc" } },
      review: true,
      payments: { orderBy: { recordedAt: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  // les messages de l'agence sont marqués comme lus à l'ouverture du dossier
  await db.message.updateMany({ where: { bookingId, fromAgency: true, readAt: null }, data: { readAt: new Date() } });
  const paid = booking.payments.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0);
  const wa = waLink(brand.whatsapp, `${t.booking.reference} ${booking.reference}`);
  const accessQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const hidden = (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="ref" value={booking.reference} />
      {token && <input type="hidden" name="token" value={token} />}
    </>
  );
  const card = "rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:p-8";

  return (
    <div className="space-y-6">
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{t.booking.reference}</p>
            <p className="font-mono text-2xl font-bold text-night">{booking.reference}</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyle[booking.status]}`}>{t.status[booking.status]}</span>
        </div>
        {booking.status === "PENDING" && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{t.booking.successText}</p>}
        {booking.cancelRequestedAt && ["PENDING", "CONFIRMED"].includes(booking.status) && <p className="mt-4 rounded-2xl bg-sand/15 p-4 text-sm text-night">{v.account.cancelPending}</p>}
        {booking.pricesAreDemo && <p className="mt-4 text-xs text-terracotta">{priceNote(locale, (booking.pricing as { noteKind?: string }).noteKind ?? "DEMO", true)}</p>}
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <Item k={t.nav.circuits} v={`${tr(booking.circuit.title, locale)} — ${tr(booking.circuit.destination.name, locale)}`} />
          <Item k={t.booking.chooseDate} v={`${formatDate(booking.startDate, locale)} → ${formatDate(booking.endDate, locale)}`} />
          <Item k={t.home.searchTravelers} v={`${booking.adults} + ${booking.children} · ${booking.privateTour ? t.booking.private : t.booking.shared}`} />
          <Item k={t.booking.email} v={`${booking.firstName} ${booking.lastName} — ${booking.email}`} />
          {(booking.options as { label: string }[]).length > 0 && <Item k={t.booking.options} v={(booking.options as { label: string }[]).map((o) => o.label).join(", ")} />}
        </dl>
      </div>

      <div className={card}>
        <h2 className="font-display text-2xl font-semibold text-night">{t.booking.summary}</h2>
        <div className="mt-4">
          <PriceTable price={booking.pricing as unknown as PriceResult} locale={locale} depositPercent={booking.circuit.depositPercent} />
        </div>
      </div>

      <div className={card} id="factures">
        <h2 className="font-display text-2xl font-semibold text-night">{v.account.invoices}</h2>
        {booking.payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{v.account.noPayments}</p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-night/5 text-sm">
              {booking.payments.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span>
                    {formatDate(p.recordedAt, locale)} · {p.method}
                  </span>
                  <span className={p.kind === "REFUND" ? "text-rose-700" : "font-semibold"}>
                    {p.kind === "REFUND" ? "−" : ""}
                    {formatMad(p.amountMad, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between text-sm">
              <span>
                {v.account.paid} : <strong>{formatMad(paid, locale)}</strong>
              </span>
              <span>
                {v.account.remaining} : <strong>{formatMad(Math.max(0, booking.totalMad - paid), locale)}</strong>
              </span>
            </p>
            <Link href={`/${locale}/recu/${booking.reference}${accessQuery}`} className="btn btn-sand mt-4 !py-2 text-sm" target="_blank">
              <Icon name="print" className="h-4 w-4" /> {v.account.receipt}
            </Link>
          </>
        )}
      </div>

      <div className={card} id="documents">
        <h2 className="font-display text-2xl font-semibold text-night">{v.account.documents}</h2>
        {booking.documents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{v.account.noDocuments}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {booking.documents.map((d) => (
              <li key={d.id}>
                <a href={`/api/documents/${d.id}${accessQuery}`} className="flex items-center gap-3 rounded-xl bg-ivory px-4 py-3 text-sm hover:bg-sand/15" target="_blank" rel="noopener">
                  <Icon name="file" className="h-5 w-5 text-terracotta" />
                  <span className="flex-1 font-medium text-night">{d.title}</span>
                  <span className="text-xs text-muted">{formatDate(d.createdAt, locale)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={card} id="messages">
        <h2 className="font-display text-2xl font-semibold text-night">{v.account.messages}</h2>
        {booking.messages.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{v.account.noMessages}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {booking.messages.map((m) => (
              <li key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.fromAgency ? "bg-night text-white" : "ms-auto bg-sand/20 text-night"}`}>
                <p className="text-[11px] opacity-70">
                  {m.fromAgency ? `${v.account.agency} · ${brand.name}` : v.account.you} · {formatDate(m.createdAt, locale, { dateStyle: "short", timeStyle: "short" } as Intl.DateTimeFormatOptions)}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
        {flags.msg === "sent" && <p className="mt-3 text-sm text-emerald-800">✓</p>}
        <form action={sendBookingMessage} className="mt-4 space-y-2">
          {hidden}
          <label className="sr-only" htmlFor="msg-body">
            {v.account.writeMessage}
          </label>
          <textarea id="msg-body" name="body" required maxLength={4000} rows={3} placeholder={v.account.writeMessage} className="field" />
          <button className="btn btn-primary !py-2 text-sm">{v.account.sendMessage}</button>
        </form>
      </div>

      {["PENDING", "CONFIRMED"].includes(booking.status) && !booking.cancelRequestedAt && (
        <details className={card}>
          <summary className="cursor-pointer font-semibold text-night">{v.account.cancelRequest}</summary>
          <p className="mt-3 text-sm text-muted">{tr(booking.circuit.cancellationPolicy, locale)}</p>
          <form action={requestCancellation} className="mt-4 space-y-2">
            {hidden}
            <textarea name="reason" maxLength={1000} rows={2} placeholder={v.account.cancelReason} className="field" />
            <button className="btn !py-2 text-sm text-rose-700 ring-1 ring-rose-200">{v.account.cancelRequest}</button>
          </form>
        </details>
      )}
      {flags.cancel === "sent" && <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{v.account.cancelSent}</p>}

      <div className={card}>
        <h2 className="font-display text-2xl font-semibold text-night">{t.account.history}</h2>
        <ol className="mt-4 space-y-3 border-s-2 border-sand/40 ps-6 text-sm">
          {booking.events
            // les notes internes de l'agence ne sont pas montrées au client
            .filter((e) => e.toStatus || e.actor === "client" || e.type === "PAYMENT_RECORDED")
            .map((e) => (
              <li key={e.id}>
                <p className="font-medium text-night">{e.toStatus ? t.status[e.toStatus] : e.note}</p>
                <p className="text-xs text-muted">{formatDate(e.createdAt, locale, { dateStyle: "medium", timeStyle: "short" } as Intl.DateTimeFormatOptions)}</p>
              </li>
            ))}
        </ol>
      </div>

      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white">
          <Icon name="whatsapp" className="h-4 w-4" /> {t.common.whatsapp}
        </a>
      )}

      <div className={card}>
        <h2 className="font-display text-2xl font-semibold text-night">{t.account.leaveReview}</h2>
        {flags.review || booking.review ? (
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
