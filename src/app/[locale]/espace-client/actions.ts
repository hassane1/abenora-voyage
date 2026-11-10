"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hasLocale } from "@/i18n/config";
import { clientIp, rateLimit } from "@/lib/security";

export async function lookupBooking(formData: FormData) {
  const locale = String(formData.get("locale"));
  const loc = hasLocale(locale) ? locale : "fr";
  const ref = String(formData.get("ref") ?? "").trim().toUpperCase().slice(0, 40);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  // anti-énumération des dossiers : 10 recherches / 15 min par IP
  const lim = await rateLimit(`lookup:${await clientIp()}`, 10, 900);
  if (!lim.ok) redirect(`/${loc}/espace-client?notfound=locked`);
  const b = ref && email ? await db.booking.findFirst({ where: { reference: ref, email } }) : null;
  if (!b) redirect(`/${loc}/espace-client?notfound=1`);
  redirect(`/${loc}/espace-client?ref=${b.reference}&token=${b.accessToken}`);
}

const reviewSchema = z.object({
  ref: z.string(),
  token: z.string().min(10),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  comment: z.string().trim().min(10).max(2000),
  authorName: z.string().trim().min(2).max(60),
  locale: z.string(),
});

/** Un avis n'est accepté que pour un séjour confirmé et terminé ; il est publié après modération */
export async function submitReview(formData: FormData) {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { ref, token, locale, ...data } = parsed.data;
  const loc = hasLocale(locale) ? locale : "fr";
  const b = await db.booking.findFirst({ where: { reference: ref, accessToken: token }, include: { review: true } });
  if (!b || b.status !== "CONFIRMED" || b.endDate > new Date() || b.review) redirect(`/${loc}/espace-client?ref=${ref}&token=${token}`);
  await db.review.create({ data: { ...data, bookingId: b.id, published: false } });
  await db.bookingEvent.create({ data: { bookingId: b.id, type: "NOTE", actor: "client", note: "Avis déposé (en attente de modération)" } });
  redirect(`/${loc}/espace-client?ref=${ref}&token=${token}&review=1`);
}
