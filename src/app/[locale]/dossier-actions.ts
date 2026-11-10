"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasLocale, type Locale } from "@/i18n/config";
import { findAccessibleBooking, getCustomer } from "@/lib/customer";
import { clientIp, rateLimit } from "@/lib/security";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mail";
import { site } from "@/lib/site";

const loc = (f: FormData): Locale => {
  const l = String(f.get("locale") ?? "fr");
  return hasLocale(l) ? l : "fr";
};

/** URL de retour vers le dossier : espace voyageur si connecté, sinon lien sécurisé par jeton */
function back(locale: Locale, ref: string, token: string | null, extra: string) {
  return token ? `/${locale}/espace-client?ref=${encodeURIComponent(ref)}&token=${encodeURIComponent(token)}&${extra}` : `/${locale}/compte/dossier/${encodeURIComponent(ref)}?${extra}`;
}

export async function sendBookingMessage(formData: FormData) {
  const locale = loc(formData);
  const ref = String(formData.get("ref") ?? "");
  const token = String(formData.get("token") ?? "") || null;
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  const b = await findAccessibleBooking(ref, token);
  if (!b) redirect(`/${locale}/compte`);
  const lim = await rateLimit(`msg:${b.id}:${await clientIp()}`, 20, 3600);
  if (!body || !lim.ok) redirect(back(locale, b.reference, token, "msg=error#messages"));
  const customer = await getCustomer();
  await db.message.create({ data: { bookingId: b.id, customerId: customer?.id ?? b.customerId, fromAgency: false, author: `${b.firstName} ${b.lastName}`, body } });
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to)
    await sendMail({
      to,
      bookingId: b.id,
      subject: `Message client — ${b.reference}`,
      html: await emailLayout(`Message sur le dossier ${b.reference}`, `<p style="white-space:pre-wrap">${escapeHtml(body)}</p><p><a href="${site.url}/admin/reservations/${b.id}#messages">Répondre dans l'administration</a></p>`),
    });
  redirect(back(locale, b.reference, token, "msg=sent#messages"));
}

/** Demande d'annulation : n'annule pas automatiquement, l'agence applique les conditions du circuit */
export async function requestCancellation(formData: FormData) {
  const locale = loc(formData);
  const ref = String(formData.get("ref") ?? "");
  const token = String(formData.get("token") ?? "") || null;
  const b = await findAccessibleBooking(ref, token);
  if (!b || !["PENDING", "CONFIRMED"].includes(b.status) || b.cancelRequestedAt) redirect(back(locale, ref, token, "cancel=error"));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000) || null;
  await db.booking.update({ where: { id: b.id }, data: { cancelRequestedAt: new Date(), cancelReason: reason } });
  await db.bookingEvent.create({ data: { bookingId: b.id, type: "NOTE", actor: "client", note: `Demande d'annulation${reason ? ` : ${reason}` : ""}` } });
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to)
    await sendMail({
      to,
      bookingId: b.id,
      subject: `Demande d'annulation — ${b.reference}`,
      html: await emailLayout(`Demande d'annulation ${b.reference}`, `<p>${reason ? escapeHtml(reason) : "Sans motif."}</p><p><a href="${site.url}/admin/reservations/${b.id}">Traiter la demande</a></p>`),
    });
  redirect(back(locale, b.reference, token, "cancel=sent"));
}
