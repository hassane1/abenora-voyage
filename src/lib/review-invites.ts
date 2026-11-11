import "server-only";
import { db } from "./db";
import { emailLayout, escapeHtml, sendMail } from "./mail";
import { site } from "./site";
import { tr } from "./i18n-content";

/**
 * Invitations à donner un avis — toujours déclenchées À LA MAIN par l'agence (Administration → Avis).
 * Conditions : dossier confirmé, voyage terminé, aucun avis déposé, consentement explicite du client
 * (« reviewConsent » enregistré à l'import de l'historique), au plus 1 invitation + 1 relance.
 * Le lien mène au formulaire d'avis existant du dossier (un seul avis possible par dossier) ;
 * l'e-mail contient un lien de désinscription. L'agence ne peut jamais écrire un avis à la place du client.
 */
export const MAX_INVITES = 2;

type Consent = { value?: boolean; date?: string | null; channel?: string | null };
export const consentOf = (pricing: unknown): Consent | null => {
  const c = (pricing as { reviewConsent?: Consent } | null)?.reviewConsent;
  return c && typeof c === "object" ? c : null;
};

export async function reviewInviteCandidates() {
  const bookings = await db.booking.findMany({
    where: { status: "CONFIRMED", endDate: { lt: new Date() }, review: null },
    include: { circuit: { select: { title: true } }, events: { where: { type: "REVIEW_INVITE" }, orderBy: { createdAt: "desc" } } },
    orderBy: { endDate: "desc" },
  });
  return bookings
    .map((b) => ({ b, consent: consentOf(b.pricing), invites: b.events.length, lastInvite: b.events[0]?.createdAt ?? null }))
    .filter((x) => x.consent?.value === true);
}

const T = {
  fr: { subject: "Votre avis sur votre voyage avec nous", hello: (n: string) => `Bonjour ${n},`, body: (trip: string, d: string) => `Vous avez voyagé avec nous (${trip}, retour le ${d}). Votre avis aide d'autres voyageurs à choisir : il ne vous prendra que deux minutes.`, cta: "Donner mon avis", note: "Seuls les voyageurs ayant réellement voyagé avec nous peuvent déposer un avis. Il est relu avant publication.", stop: "Ne plus recevoir de demande d'avis" },
  en: { subject: "Your review of your trip with us", hello: (n: string) => `Hello ${n},`, body: (trip: string, d: string) => `You travelled with us (${trip}, back on ${d}). Your review helps other travellers choose: it only takes two minutes.`, cta: "Leave my review", note: "Only travellers who actually travelled with us can leave a review. It is checked before publication.", stop: "Stop review requests" },
  ar: { subject: "رأيك في رحلتك معنا", hello: (n: string) => `مرحباً ${n}،`, body: (trip: string, d: string) => `سافرت معنا (${trip}، العودة في ${d}). رأيك يساعد مسافرين آخرين على الاختيار، ولن يستغرق سوى دقيقتين.`, cta: "أعطِ رأيي", note: "لا يمكن ترك رأي إلا لمن سافر معنا فعلاً، ويُراجَع قبل النشر.", stop: "عدم تلقي طلبات الرأي مستقبلاً" },
};

/** envoie (ou refuse) une invitation ; renvoie le motif en cas de refus */
export async function sendReviewInvite(bookingId: string, actor: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { circuit: true, review: true, events: { where: { type: "REVIEW_INVITE" } } } });
  if (!b) return { ok: false, reason: "dossier introuvable" };
  if (b.status !== "CONFIRMED" || b.endDate >= new Date()) return { ok: false, reason: "voyage non terminé ou dossier non confirmé" };
  if (b.review) return { ok: false, reason: "avis déjà déposé" };
  if (consentOf(b.pricing)?.value !== true) return { ok: false, reason: "pas de consentement du client" };
  if (b.events.length >= MAX_INVITES) return { ok: false, reason: "invitation et relance déjà envoyées" };
  const locale = (["fr", "en", "ar"].includes(b.locale) ? b.locale : "fr") as "fr" | "en" | "ar";
  const t = T[locale];
  const program = (b.pricing as { program?: string | null }).program;
  const trip = program && !/^[a-z0-9-]+$/.test(program) ? program : tr<string>(b.circuit.title, locale, b.circuit.slug);
  const date = b.endDate.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-GB" : "fr-FR", { timeZone: "UTC" });
  const link = `${site.url}/${locale}/espace-client?ref=${encodeURIComponent(b.reference)}&token=${encodeURIComponent(b.accessToken)}#avis`;
  const stop = `${site.url}/api/avis/desinscription?ref=${encodeURIComponent(b.reference)}&token=${encodeURIComponent(b.accessToken)}`;
  await sendMail({
    to: b.email,
    bookingId: b.id,
    subject: `${t.subject}${b.events.length ? " (rappel)" : ""}`,
    html: await emailLayout(
      t.subject,
      `<p>${escapeHtml(t.hello(b.firstName))}</p><p>${escapeHtml(t.body(trip, date))}</p>
       <p style="margin:24px 0"><a href="${link}" style="background:#C9A24B;color:#0E1420;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${escapeHtml(t.cta)}</a></p>
       <p style="font-size:12px;color:#6b7280">${escapeHtml(t.note)}</p>
       <p style="font-size:12px"><a href="${stop}" style="color:#6b7280">${escapeHtml(t.stop)}</a></p>`,
      locale === "ar" ? "rtl" : "ltr",
    ),
  });
  await db.bookingEvent.create({ data: { bookingId: b.id, type: "REVIEW_INVITE", actor, note: b.events.length ? "Relance : invitation à donner un avis" : "Invitation à donner un avis envoyée" } });
  return { ok: true };
}
