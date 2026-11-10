import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getV2 } from "@/i18n/v2";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/customer";
import { getActivities, getCircuits } from "@/lib/queries";
import { tr } from "@/lib/i18n-content";
import { formatDate, formatMad } from "@/lib/format";
import { Icon } from "@/components/Icon";
import AccountFavorites from "@/components/account/AccountFavorites";
import { attachBooking, forgotPassword, login, logout, register, resendVerification, updateProfile } from "./actions";

export const metadata: Metadata = { robots: { index: false } };

const TABS = ["tableau", "reservations", "favoris", "documents", "messages", "devis", "profil"] as const;
type Tab = (typeof TABS)[number];

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  CANCELLED: "bg-night/10 text-night",
};

export default async function AccountPage({ params, searchParams }: PageProps<"/[locale]/compte">) {
  const { locale: l } = await params;
  if (!hasLocale(l)) notFound();
  const locale = l as Locale;
  const t = getDictionary(locale);
  const v = getV2(locale);
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  await connection();
  const customer = await getCustomer();

  if (!customer) return <AuthScreens locale={locale} mode={one("mode")} error={one("error")} reset={one("reset")} verify={one("verify")} created={one("created")} />;

  const tab: Tab = (TABS as readonly string[]).includes(one("tab") ?? "") ? (one("tab") as Tab) : "tableau";
  const now = new Date();
  const [bookings, quotes, unread] = await Promise.all([
    db.booking.findMany({
      where: { customerId: customer.id },
      orderBy: { startDate: "asc" },
      include: { circuit: { include: { destination: true } }, documents: true, payments: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    db.quote.findMany({ where: { status: { not: "DRAFT" }, request: { email: customer.email } }, orderBy: { createdAt: "desc" } }),
    db.message.count({ where: { fromAgency: true, readAt: null, booking: { customerId: customer.id } } }),
  ]);
  const upcoming = bookings.filter((b) => b.endDate >= now && ["PENDING", "CONFIRMED"].includes(b.status));
  const past = bookings.filter((b) => !upcoming.includes(b)).reverse();
  const docs = bookings.flatMap((b) => b.documents.map((d) => ({ ...d, reference: b.reference })));
  const labels: Record<Tab, string> = {
    tableau: v.account.dashboard,
    reservations: v.account.bookings,
    favoris: v.account.favorites,
    documents: v.account.documents,
    messages: v.account.messages,
    devis: v.account.quotes,
    profil: v.account.profile,
  };
  const icons: Record<Tab, string> = { tableau: "chart", reservations: "calendar", favoris: "heart", documents: "file", messages: "message", devis: "sparkle", profil: "user" };

  const BookingRow = ({ b }: { b: (typeof bookings)[number] }) => (
    <Link href={`/${locale}/compte/dossier/${b.reference}`} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-night/5 transition hover:ring-sand">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-sand/15 text-center leading-none text-night">
        <span>
          <span className="block font-display text-2xl font-semibold">{formatDate(b.startDate, locale, { day: "numeric" })}</span>
          <span className="block text-[10px] uppercase">{formatDate(b.startDate, locale, { month: "short" })}</span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-night">{tr(b.circuit.title, locale)}</p>
        <p className="text-xs text-muted">
          {b.reference} · {b.adults + b.children} {t.home.searchTravelers.toLowerCase()} · {formatMad(b.totalMad, locale)}
        </p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[b.status]}`}>{t.status[b.status]}</span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{v.account.space}</p>
          <h1 className="font-display mt-2 text-4xl font-semibold text-night md:text-5xl">{v.account.hello(customer.firstName)}</h1>
        </div>
        <form action={logout}>
          <input type="hidden" name="locale" value={locale} />
          <button className="text-sm text-muted hover:text-terracotta">{v.account.logout}</button>
        </form>
      </div>
      {!customer.emailVerifiedAt && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <span>{one("verify") === "sent" ? "✓ " + v.account.created : v.account.notVerified}</span>
          <form action={resendVerification}>
            <input type="hidden" name="locale" value={locale} />
            <button className="font-semibold underline">{v.account.resendVerify}</button>
          </form>
        </div>
      )}
      {one("verify") === "ok" && <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{v.account.verified}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label={v.account.space}>
          {TABS.map((k) => (
            <Link
              key={k}
              href={`/${locale}/compte?tab=${k}`}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium ${tab === k ? "bg-night text-white" : "text-night hover:bg-white"}`}
              aria-current={tab === k ? "page" : undefined}
            >
              <Icon name={icons[k]} className="h-4 w-4" /> {labels[k]}
              {k === "messages" && unread > 0 && <span className="ms-auto rounded-full bg-terracotta px-1.5 text-[11px] font-bold text-white">{unread}</span>}
            </Link>
          ))}
        </nav>

        <section className="min-w-0 space-y-6">
          {tab === "tableau" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  [v.account.upcoming, upcoming.length, "reservations"],
                  [v.account.messages, unread, "messages"],
                  [v.account.documents, docs.length, "documents"],
                ].map(([label, n, k]) => (
                  <Link key={String(k)} href={`/${locale}/compte?tab=${k}`} className="rounded-2xl bg-white p-5 ring-1 ring-night/5 hover:ring-sand">
                    <p className="text-sm text-muted">{label}</p>
                    <p className="font-display mt-1 text-4xl font-semibold text-night">{n}</p>
                  </Link>
                ))}
              </div>
              <h2 className="font-display text-2xl font-semibold text-night">{v.account.upcoming}</h2>
              {upcoming.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-night/5">
                  {v.account.noUpcoming}{" "}
                  <Link href={`/${locale}/circuits`} className="font-semibold text-terracotta hover:underline">
                    {t.nav.circuits} →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((b) => (
                    <BookingRow key={b.id} b={b} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "reservations" && (
            <>
              {one("attach") && <p className={`rounded-2xl p-4 text-sm ${one("attach") === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{one("attach") === "ok" ? v.account.attachDone : v.account.attachFail}</p>}
              <h2 className="font-display text-2xl font-semibold text-night">{v.account.upcoming}</h2>
              {upcoming.length === 0 ? <p className="text-sm text-muted">{v.account.noUpcoming}</p> : upcoming.map((b) => <BookingRow key={b.id} b={b} />)}
              <h2 className="font-display pt-4 text-2xl font-semibold text-night">{v.account.history}</h2>
              {past.length === 0 ? <p className="text-sm text-muted">{v.account.noHistory}</p> : past.map((b) => <BookingRow key={b.id} b={b} />)}
              <form action={attachBooking} className="rounded-2xl bg-white p-5 ring-1 ring-night/5">
                <input type="hidden" name="locale" value={locale} />
                <p className="font-semibold text-night">{v.account.attach}</p>
                <p className="mt-1 text-xs text-muted">{v.account.attachText}</p>
                <div className="mt-3 flex gap-2">
                  <input name="ref" required maxLength={40} placeholder="MET-…" className="field !py-2 uppercase" />
                  <button className="btn btn-sand !py-2 text-sm">OK</button>
                </div>
              </form>
            </>
          )}

          {tab === "favoris" && (
            <AccountFavorites
              initial={customer.favorites as string[]}
              empty={v.account.noFavorites}
              items={[
                ...(await getCircuits()).map((c) => ({ id: `circuit:${c.slug}`, href: `/${locale}/circuits/${c.slug}`, title: tr(c.title, locale), subtitle: t.common.daysNights(c.days, c.nights) })),
                ...(await getActivities()).map((a) => ({ id: `activity:${a.slug}`, href: `/${locale}/activites/${a.slug}`, title: tr(a.title, locale), subtitle: t.categories[a.category] })),
              ]}
            />
          )}

          {tab === "documents" && (
            <>
              <h2 className="font-display text-2xl font-semibold text-night">{v.account.documents}</h2>
              {docs.length === 0 ? (
                <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted ring-1 ring-night/5">{v.account.noDocuments}</p>
              ) : (
                <ul className="space-y-2">
                  {docs.map((d) => (
                    <li key={d.id}>
                      <a href={`/api/documents/${d.id}`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-night/5 hover:ring-sand">
                        <Icon name="file" className="h-5 w-5 text-terracotta" />
                        <span className="flex-1 font-medium text-night">{d.title}</span>
                        <span className="text-xs text-muted">
                          {d.reference} · {formatDate(d.createdAt, locale)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="font-display pt-4 text-2xl font-semibold text-night">{v.account.invoices}</h2>
              {bookings.filter((b) => b.payments.length).length === 0 ? (
                <p className="text-sm text-muted">{v.account.noPayments}</p>
              ) : (
                <ul className="space-y-2">
                  {bookings
                    .filter((b) => b.payments.length)
                    .map((b) => (
                      <li key={b.id}>
                        <Link href={`/${locale}/recu/${b.reference}`} target="_blank" className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-night/5 hover:ring-sand">
                          <Icon name="print" className="h-5 w-5 text-terracotta" />
                          <span className="flex-1 font-medium text-night">
                            {v.account.receipt} — {b.reference}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </>
          )}

          {tab === "messages" && (
            <>
              <h2 className="font-display text-2xl font-semibold text-night">{v.account.messages}</h2>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted">{v.account.noMessages}</p>
              ) : (
                <ul className="space-y-2">
                  {bookings.map((b) => (
                    <li key={b.id}>
                      <Link href={`/${locale}/compte/dossier/${b.reference}#messages`} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-night/5 hover:ring-sand">
                        <Icon name="message" className="h-5 w-5 text-terracotta" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-night">
                            {b.reference} — {tr(b.circuit.title, locale)}
                          </span>
                          <span className="block truncate text-xs text-muted">{b.messages[0]?.body ?? v.account.noMessages}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "devis" && (
            <>
              <h2 className="font-display text-2xl font-semibold text-night">{v.account.quotes}</h2>
              {quotes.length === 0 ? (
                <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted ring-1 ring-night/5">
                  —{" "}
                  <Link href={`/${locale}/sur-mesure`} className="font-semibold text-terracotta hover:underline">
                    {t.nav.tailorMade} →
                  </Link>
                </p>
              ) : (
                <ul className="space-y-2">
                  {quotes.map((q) => (
                    <li key={q.id}>
                      <Link href={`/${locale}/devis/${q.number}?token=${q.accessToken}`} className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-night/5 hover:ring-sand">
                        <Icon name="sparkle" className="h-5 w-5 text-terracotta" />
                        <span className="flex-1 font-medium text-night">
                          {q.number} — {q.title}
                        </span>
                        <span className="text-xs">{formatMad(q.totalMad, locale)}</span>
                        <span className="rounded-full bg-ivory px-2 py-0.5 text-xs">{v.quote.status[q.status]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "profil" && (
            <>
              {one("saved") && <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{v.account.saved}</p>}
              <form action={updateProfile} className="grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:grid-cols-2">
                <input type="hidden" name="locale" value={locale} />
                <label>
                  <span className="label">{v.account.firstName}</span>
                  <input name="firstName" defaultValue={customer.firstName} required maxLength={80} className="field" autoComplete="given-name" />
                </label>
                <label>
                  <span className="label">{v.account.lastName}</span>
                  <input name="lastName" defaultValue={customer.lastName} required maxLength={80} className="field" autoComplete="family-name" />
                </label>
                <label>
                  <span className="label">{v.account.email}</span>
                  <input value={customer.email} readOnly className="field bg-ivory" />
                </label>
                <label>
                  <span className="label">{v.account.phone}</span>
                  <input name="phone" defaultValue={customer.phone ?? ""} maxLength={40} className="field" autoComplete="tel" />
                </label>
                <label>
                  <span className="label">{v.account.whatsapp}</span>
                  <input name="whatsapp" defaultValue={customer.whatsapp ?? ""} maxLength={40} className="field" />
                </label>
                <label>
                  <span className="label">{v.account.country}</span>
                  <input name="country" defaultValue={customer.country ?? ""} maxLength={80} className="field" autoComplete="country-name" />
                </label>
                <label className="flex items-start gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" name="marketing" defaultChecked={customer.marketingConsent} className="mt-1 accent-terracotta" /> {v.account.marketing}
                </label>
                <button className="btn btn-primary w-fit">{v.account.save}</button>
              </form>
              <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
                <p className="font-semibold text-night">{v.account.sessions}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <form action={logout}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="all" value="1" />
                    <button className="btn !py-2 text-sm ring-1 ring-night/15">{v.account.logoutAll}</button>
                  </form>
                  <Link href={`/${locale}/compte?mode=forgot`} className="btn !py-2 text-sm ring-1 ring-night/15">
                    {v.account.resetTitle}
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function AuthScreens({ locale, mode, error, reset, verify, created }: { locale: Locale; mode?: string; error?: string; reset?: string; verify?: string; created?: string }) {
  const v = getV2(locale);
  const t = getDictionary(locale);
  const msg =
    error === "login" ? v.account.badLogin : error === "locked" ? v.account.locked : error === "invalid" ? `${v.account.invalid} (${v.account.passwordHint})` : null;
  const info =
    reset === "sent" ? v.account.resetSent : reset === "done" ? v.account.resetDone : reset === "invalid" ? v.newsletter.invalid : verify === "invalid" ? v.newsletter.invalid : created ? v.account.created : null;
  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 pb-24">
      <p className="eyebrow">{v.account.space}</p>
      <h1 className="font-display mt-2 text-5xl font-semibold text-night">{mode === "register" ? v.account.register : mode === "forgot" ? v.account.resetTitle : v.account.login}</h1>
      {msg && (
        <p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
          {msg}
        </p>
      )}
      {info && (
        <p role="status" className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          {info}
        </p>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5 sm:p-8">
          {mode === "register" ? (
            <form action={register} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <label>
                <span className="label">{v.account.firstName}</span>
                <input name="firstName" required maxLength={80} className="field" autoComplete="given-name" />
              </label>
              <label>
                <span className="label">{v.account.lastName}</span>
                <input name="lastName" required maxLength={80} className="field" autoComplete="family-name" />
              </label>
              <label className="sm:col-span-2">
                <span className="label">{v.account.email}</span>
                <input name="email" type="email" required maxLength={160} className="field" autoComplete="email" />
              </label>
              <label className="sm:col-span-2">
                <span className="label">
                  {v.account.password} <span className="font-normal text-muted">({v.account.passwordHint})</span>
                </span>
                <input name="password" type="password" required minLength={10} maxLength={128} className="field" autoComplete="new-password" />
              </label>
              <label>
                <span className="label">{v.account.phone}</span>
                <input name="phone" maxLength={40} className="field" autoComplete="tel" />
              </label>
              <label>
                <span className="label">{v.account.country}</span>
                <input name="country" maxLength={80} className="field" autoComplete="country-name" />
              </label>
              <label className="flex items-start gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="terms" required className="mt-1 accent-terracotta" />
                <span>
                  {v.tailorForm.consent}{" "}
                  <Link href={`/${locale}/legal/confidentialite`} className="text-terracotta underline">
                    ↗
                  </Link>
                </span>
              </label>
              <button className="btn btn-primary sm:col-span-2">{v.account.register}</button>
              <p className="text-sm text-muted sm:col-span-2">
                {v.account.haveAccount}{" "}
                <Link href={`/${locale}/compte`} className="font-semibold text-terracotta hover:underline">
                  {v.account.login}
                </Link>
              </p>
            </form>
          ) : mode === "forgot" ? (
            <form action={forgotPassword} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label>
                <span className="label">{v.account.email}</span>
                <input name="email" type="email" required className="field" autoComplete="email" />
              </label>
              <button className="btn btn-primary w-fit">{v.account.send}</button>
            </form>
          ) : (
            <form action={login} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label>
                <span className="label">{v.account.email}</span>
                <input name="email" type="email" required className="field" autoComplete="username" />
              </label>
              <label>
                <span className="label">{v.account.password}</span>
                <input name="password" type="password" required className="field" autoComplete="current-password" />
              </label>
              <button className="btn btn-primary">{v.account.login}</button>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <Link href={`/${locale}/compte?mode=forgot`} className="text-muted hover:text-terracotta">
                  {v.account.forgot}
                </Link>
                <span className="text-muted">
                  {v.account.noAccount}{" "}
                  <Link href={`/${locale}/compte?mode=register`} className="font-semibold text-terracotta hover:underline">
                    {v.account.register}
                  </Link>
                </span>
              </div>
            </form>
          )}
        </div>
        <div className="rounded-3xl bg-night p-6 text-white sm:p-8">
          <Icon name="lock" className="h-8 w-8 text-sand" />
          <h2 className="font-display mt-3 text-2xl font-semibold">{v.account.guestTitle}</h2>
          <p className="mt-2 text-sm text-white/75">{v.account.guestText}</p>
          <Link href={`/${locale}/espace-client`} className="btn btn-sand mt-6">
            {t.account.lookup}
          </Link>
        </div>
      </div>
    </div>
  );
}
