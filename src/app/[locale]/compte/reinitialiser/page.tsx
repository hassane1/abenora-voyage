import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { resetPassword } from "../actions";

export const metadata: Metadata = { robots: { index: false } };

export default async function ResetPage({ params, searchParams }: PageProps<"/[locale]/compte/reinitialiser">) {
  const { locale: l } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const v = getV2(locale);
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <div className="mx-auto max-w-md px-4 pt-32 pb-24">
      <h1 className="font-display text-4xl font-semibold text-night">{v.account.resetTitle}</h1>
      {sp.error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {v.account.passwordHint}
        </p>
      )}
      <form action={resetPassword} className="mt-6 grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-night/5">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token" value={token} />
        <label>
          <span className="label">
            {v.account.newPassword} <span className="font-normal text-muted">({v.account.passwordHint})</span>
          </span>
          <input name="password" type="password" required minLength={10} maxLength={128} className="field" autoComplete="new-password" />
        </label>
        <button className="btn btn-primary">{v.account.save}</button>
      </form>
    </div>
  );
}
