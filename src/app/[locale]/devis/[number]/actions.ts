"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasLocale } from "@/i18n/config";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mail";
import { site } from "@/lib/site";

export async function respondToQuote(formData: FormData) {
  const l = String(formData.get("locale") ?? "fr");
  const locale = hasLocale(l) ? l : "fr";
  const number = String(formData.get("number") ?? "").slice(0, 40);
  const token = String(formData.get("token") ?? "").slice(0, 100);
  const accept = formData.get("answer") === "accept";
  const q = token.length >= 20 ? await db.quote.findFirst({ where: { number, accessToken: token } }) : null;
  if (!q) redirect(`/${locale}`);
  // transition atomique : seul un devis « envoyé » et non expiré peut recevoir une réponse
  const n = await db.quote.updateMany({
    where: { id: q.id, status: "SENT", validUntil: { gte: new Date() } },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });
  if (n.count === 1) {
    const to = process.env.ADMIN_NOTIFY_EMAIL;
    if (to)
      await sendMail({
        to,
        subject: `Devis ${q.number} ${accept ? "ACCEPTÉ" : "refusé"} par le client`,
        html: await emailLayout(`Devis ${escapeHtml(q.number)}`, `<p>Le client a ${accept ? "accepté" : "refusé"} le devis.</p><p><a href="${site.url}/admin/demandes/${q.requestId}">Ouvrir la demande</a></p>`),
      });
  }
  redirect(`/${locale}/devis/${q.number}?token=${encodeURIComponent(token)}&r=${accept ? "accepted" : "declined"}`);
}
