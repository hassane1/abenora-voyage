import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getV2 } from "@/i18n/v2";
import { db } from "@/lib/db";
import BookingFile from "@/components/account/BookingFile";
import { lookupBooking } from "./actions";

export const metadata: Metadata = { robots: { index: false } };

/** Accès à un dossier SANS compte : numéro de dossier + e-mail, puis lien sécurisé par jeton */
export default async function ClientSpace({ params, searchParams }: PageProps<"/[locale]/espace-client">) {
  const { locale: l } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const v = getV2(locale);
  const sp = await searchParams;
  await connection();
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const ref = one("ref") ?? "";
  const token = one("token") ?? "";
  const booking = ref && token.length >= 20 ? await db.booking.findFirst({ where: { reference: ref, accessToken: token }, select: { id: true } }) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-24">
      <p className="eyebrow">{t.nav.account}</p>
      <h1 className="font-display mt-2 text-5xl font-semibold text-night">{t.account.title}</h1>

      {!booking && (
        <>
          <p className="mt-3 text-muted">{t.account.intro}</p>
          {sp.notfound && (
            <p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
              {sp.notfound === "locked" ? v.account.locked : t.account.notFound}
            </p>
          )}
          <form action={lookupBooking} className="mt-8 grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="locale" value={locale} />
            <label>
              <span className="label">{t.booking.reference}</span>
              <input name="ref" required maxLength={40} className="field uppercase" placeholder="MET-…" />
            </label>
            <label>
              <span className="label">{t.booking.email}</span>
              <input name="email" type="email" required className="field" autoComplete="email" />
            </label>
            <button className="btn btn-primary">{t.account.lookup}</button>
          </form>
          <p className="mt-6 text-sm text-muted">
            {v.account.noAccount}{" "}
            <Link href={`/${locale}/compte?mode=register`} className="font-semibold text-terracotta hover:underline">
              {v.account.register}
            </Link>{" "}
            ·{" "}
            <Link href={`/${locale}/compte`} className="font-semibold text-terracotta hover:underline">
              {v.account.login}
            </Link>
          </p>
        </>
      )}

      {booking && (
        <div className="mt-8">
          <BookingFile bookingId={booking.id} locale={locale} token={token} flags={{ msg: one("msg"), cancel: one("cancel"), review: one("review") }} />
          <Link href={`/${locale}/espace-client`} className="mt-6 inline-block text-sm text-terracotta hover:underline">
            ← {t.common.back}
          </Link>
        </div>
      )}
    </div>
  );
}
