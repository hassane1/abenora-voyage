"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hasLocale, type Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { checkPassword, hashPassword } from "@/lib/auth";
import { needsRehash } from "@/lib/password";
import { createCustomerSession, consumeCustomerToken, destroyCustomerSession, getCustomer, issueCustomerToken } from "@/lib/customer";
import { audit, clientIp, passwordProblem, rateLimit, resetRateLimit } from "@/lib/security";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mail";
import { site } from "@/lib/site";

const loc = (f: FormData): Locale => {
  const l = String(f.get("locale") ?? "fr");
  return hasLocale(l) ? l : "fr";
};
const s = (f: FormData, k: string, max = 160) => String(f.get(k) ?? "").trim().slice(0, max);

async function sendVerification(customerId: string, email: string, locale: Locale) {
  const token = await issueCustomerToken(customerId, "VERIFY_EMAIL", 60 * 48);
  const v = getV2(locale);
  const link = `${site.url}/api/account/verify?token=${token}`;
  await sendMail({
    to: email,
    subject: v.account.space,
    html: await emailLayout(v.account.space, `<p>${escapeHtml(v.account.created)}</p><p><a href="${link}" style="display:inline-block;background:#8C6420;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">✓ ${escapeHtml(v.account.email)}</a></p>`, locale === "ar" ? "rtl" : "ltr"),
  });
}

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(10).max(128),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().max(80).optional(),
});

export async function register(formData: FormData) {
  const locale = loc(formData);
  if (s(formData, "website")) redirect(`/${locale}/compte`);
  const lim = await rateLimit(`register:${await clientIp()}`, 5, 3600);
  if (!lim.ok) redirect(`/${locale}/compte?mode=register&error=locked`);
  const p = registerSchema.safeParse(Object.fromEntries(formData));
  if (!p.success || passwordProblem(p.data.password, p.data.email) || formData.get("terms") !== "on") redirect(`/${locale}/compte?mode=register&error=invalid`);
  const exists = await db.customer.findUnique({ where: { email: p.data.email } });
  if (exists) {
    // on n'indique pas publiquement l'existence du compte : e-mail d'information au titulaire
    await sendMail({ to: p.data.email, subject: getV2(locale).account.space, html: await emailLayout(getV2(locale).account.space, `<p>${escapeHtml(getV2(locale).account.exists)}</p><p><a href="${site.url}/${locale}/compte">${escapeHtml(getV2(locale).account.login)}</a></p>`) });
    redirect(`/${locale}/compte?created=1`);
  }
  const c = await db.customer.create({
    data: {
      email: p.data.email,
      passwordHash: await hashPassword(p.data.password),
      firstName: p.data.firstName,
      lastName: p.data.lastName,
      phone: p.data.phone || null,
      country: p.data.country || null,
      locale,
      marketingConsent: false,
    },
  });
  await sendVerification(c.id, c.email, locale);
  await createCustomerSession(c.id);
  redirect(`/${locale}/compte?created=1`);
}

export async function login(formData: FormData) {
  const locale = loc(formData);
  const email = s(formData, "email").toLowerCase();
  const ip = await clientIp();
  const [a, b] = await Promise.all([rateLimit(`clogin:acct:${email}`, 8, 900), rateLimit(`clogin:ip:${ip}`, 30, 900)]);
  if (!a.ok || !b.ok) redirect(`/${locale}/compte?error=locked`);
  const c = await db.customer.findUnique({ where: { email } });
  const pw = s(formData, "password", 200);
  const ok = await checkPassword(pw, c?.passwordHash);
  if (!c || !ok) {
    await audit(`client:${email}`, "CUSTOMER_LOGIN_FAIL");
    redirect(`/${locale}/compte?error=login`);
  }
  await resetRateLimit(`clogin:acct:${email}`);
  if (needsRehash(c.passwordHash)) await db.customer.update({ where: { id: c.id }, data: { passwordHash: await hashPassword(pw) } });
  await createCustomerSession(c.id);
  redirect(`/${locale}/compte`);
}

export async function logout(formData: FormData) {
  await destroyCustomerSession(formData.get("all") === "1");
  redirect(`/${loc(formData)}/compte`);
}

export async function forgotPassword(formData: FormData) {
  const locale = loc(formData);
  const email = s(formData, "email").toLowerCase();
  const lim = await rateLimit(`forgot:${await clientIp()}`, 5, 3600);
  if (lim.ok) {
    const c = await db.customer.findUnique({ where: { email } });
    if (c) {
      const token = await issueCustomerToken(c.id, "RESET_PASSWORD", 60);
      const v = getV2(c.locale as Locale);
      const link = `${site.url}/${c.locale}/compte/reinitialiser?token=${token}`;
      await sendMail({ to: c.email, subject: v.account.resetTitle, html: await emailLayout(v.account.resetTitle, `<p><a href="${link}">${escapeHtml(v.account.resetTitle)}</a></p><p style="font-size:12px;color:#6b7280">60 min.</p>`) });
    }
  }
  redirect(`/${locale}/compte?reset=sent`); // réponse identique que le compte existe ou non
}

export async function resetPassword(formData: FormData) {
  const locale = loc(formData);
  const token = s(formData, "token", 200);
  const pw = s(formData, "password", 200);
  if (passwordProblem(pw)) redirect(`/${locale}/compte/reinitialiser?token=${encodeURIComponent(token)}&error=1`);
  const customerId = await consumeCustomerToken(token, "RESET_PASSWORD");
  if (!customerId) redirect(`/${locale}/compte?reset=invalid`);
  await db.customer.update({ where: { id: customerId }, data: { passwordHash: await hashPassword(pw) } });
  await db.customerSession.deleteMany({ where: { customerId } }); // déconnecte tous les appareils
  await audit(`client:${customerId}`, "CUSTOMER_PASSWORD_RESET");
  redirect(`/${locale}/compte?reset=done`);
}

export async function resendVerification(formData: FormData) {
  const locale = loc(formData);
  const c = await getCustomer();
  if (!c) redirect(`/${locale}/compte`);
  const lim = await rateLimit(`verify:${c.id}`, 3, 3600);
  if (lim.ok && !c.emailVerifiedAt) await sendVerification(c.id, c.email, locale);
  redirect(`/${locale}/compte?tab=profil&verify=sent`);
}

export async function updateProfile(formData: FormData) {
  const locale = loc(formData);
  const c = await getCustomer();
  if (!c) redirect(`/${locale}/compte`);
  const data = {
    firstName: s(formData, "firstName", 80) || c.firstName,
    lastName: s(formData, "lastName", 80) || c.lastName,
    phone: s(formData, "phone", 40) || null,
    whatsapp: s(formData, "whatsapp", 40) || null,
    country: s(formData, "country", 80) || null,
    locale,
    marketingConsent: formData.get("marketing") === "on",
  };
  await db.customer.update({ where: { id: c.id }, data });
  redirect(`/${locale}/compte?tab=profil&saved=1`);
}

/** Rattache un dossier fait sans compte : même e-mail, et e-mail du compte vérifié */
export async function attachBooking(formData: FormData) {
  const locale = loc(formData);
  const c = await getCustomer();
  if (!c) redirect(`/${locale}/compte`);
  const ref = s(formData, "ref", 40).toUpperCase();
  const b = c.emailVerifiedAt ? await db.booking.findFirst({ where: { reference: ref, email: c.email, customerId: null } }) : null;
  if (!b) redirect(`/${locale}/compte?tab=reservations&attach=fail`);
  await db.booking.update({ where: { id: b.id }, data: { customerId: c.id } });
  await db.bookingEvent.create({ data: { bookingId: b.id, type: "NOTE", actor: "client", note: "Dossier rattaché au compte voyageur" } });
  redirect(`/${locale}/compte?tab=reservations&attach=ok`);
}

/** Fusionne les favoris du navigateur dans le compte */
export async function syncFavorites(local: string[]): Promise<string[]> {
  const c = await getCustomer();
  if (!c) return local;
  const clean = local.filter((x) => typeof x === "string" && /^(circuit|activity):[a-z0-9-]{1,80}$/.test(x)).slice(0, 100);
  const merged = Array.from(new Set([...(c.favorites as string[]), ...clean])).slice(0, 200);
  await db.customer.update({ where: { id: c.id }, data: { favorites: merged } });
  return merged;
}

export async function removeFavorite(slug: string): Promise<string[]> {
  const c = await getCustomer();
  if (!c) return [];
  const next = (c.favorites as string[]).filter((x) => x !== slug);
  await db.customer.update({ where: { id: c.id }, data: { favorites: next } });
  return next;
}
