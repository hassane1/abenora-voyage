"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { hasLocale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { clientIp, randomToken, rateLimit, sha256 } from "@/lib/security";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mail";
import { site } from "@/lib/site";

export type NewsletterState = { ok: boolean; message: string } | null;

/** Inscription newsletter : consentement explicite + double opt-in (aucun envoi marketing avant confirmation) */
export async function subscribeNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const locale = String(formData.get("locale") ?? "fr");
  const loc = hasLocale(locale) ? locale : "fr";
  const v = getV2(loc);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (String(formData.get("website") ?? "") !== "") return { ok: true, message: v.newsletter.pending }; // robot : réponse neutre
  if (!z.string().email().max(160).safeParse(email).success || formData.get("consent") !== "on") return { ok: false, message: v.newsletter.error };
  const lim = await rateLimit(`newsletter:${await clientIp()}`, 10, 3600);
  if (!lim.ok) return { ok: false, message: v.newsletter.error };

  const token = randomToken();
  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.status === "CONFIRMED") return { ok: true, message: v.newsletter.pending }; // ne révèle pas l'état de l'adresse
  const data = { locale: loc, status: "PENDING", tokenHash: sha256(token), consentText: v.newsletter.consent, consentAt: new Date() };
  if (existing) await db.newsletterSubscriber.update({ where: { email }, data });
  else await db.newsletterSubscriber.create({ data: { email, ...data } });

  const link = `${site.url}/api/newsletter?action=confirm&token=${token}`;
  await sendMail({
    to: email,
    subject: v.newsletter.title,
    html: await emailLayout(
      v.newsletter.title,
      `<p>${escapeHtml(v.newsletter.text)}</p><p><a href="${link}" style="display:inline-block;background:#B96543;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">${escapeHtml(v.newsletter.submit)} ✓</a></p>`,
      loc === "ar" ? "rtl" : "ltr",
    ),
  });
  return { ok: true, message: process.env.SMTP_HOST ? v.newsletter.pending : v.newsletter.pendingNoSmtp };
}
