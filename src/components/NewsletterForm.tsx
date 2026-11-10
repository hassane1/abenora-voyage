"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { subscribeNewsletter, type NewsletterState } from "@/app/[locale]/newsletter-actions";

export default function NewsletterForm({ locale, status }: { locale: Locale; status?: string }) {
  const v = getV2(locale);
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeNewsletter, null);
  const banner =
    status === "confirmed" ? v.newsletter.confirmed : status === "unsubscribed" ? v.newsletter.unsubscribed : status === "invalid" ? v.newsletter.invalid : null;
  return (
    <form action={action} className="space-y-3">
      {banner && (
        <p role="status" className="rounded-xl bg-white/10 p-3 text-sm text-sand-light">
          {banner}
        </p>
      )}
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="nl-email">
          {v.newsletter.email}
        </label>
        <input id="nl-email" name="email" type="email" required placeholder={v.newsletter.email} autoComplete="email" className="field flex-1 !bg-white text-night" />
        <button className="btn btn-sand shrink-0" disabled={pending}>
          {v.newsletter.submit}
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs text-white/70">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-sand" />
        <span>
          {v.newsletter.consent}{" "}
          <Link href={`/${locale}/legal/confidentialite`} className="underline">
            ↗
          </Link>
        </span>
      </label>
      {state && (
        <p role="status" className={`text-sm ${state.ok ? "text-emerald-200" : "text-rose-200"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
