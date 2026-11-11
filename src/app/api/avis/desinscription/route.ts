import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/security";

/** Lien de désinscription des e-mails d'invitation à donner un avis : retire le consentement du dossier */
export async function GET(req: NextRequest) {
  const lim = await rateLimit(`avis-stop:${await clientIp()}`, 20, 900);
  const ref = req.nextUrl.searchParams.get("ref") ?? "";
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const b = lim.ok && ref && token.length >= 10 ? await db.booking.findFirst({ where: { reference: ref, accessToken: token } }) : null;
  if (b) {
    const pricing = (b.pricing ?? {}) as Record<string, unknown>;
    const consent = (pricing.reviewConsent ?? {}) as Record<string, unknown>;
    if (consent.value !== false) {
      await db.booking.update({ where: { id: b.id }, data: { pricing: { ...pricing, reviewConsent: { ...consent, value: false, withdrawnAt: new Date().toISOString() } } } });
      await db.bookingEvent.create({ data: { bookingId: b.id, type: "NOTE", actor: "client", note: "Le client ne souhaite plus recevoir de demande d'avis (lien de désinscription)." } });
    }
  }
  const msg = b
    ? ["C'est noté : vous ne recevrez plus de demande d'avis.", "Noted: you will no longer receive review requests.", "تم التسجيل: لن تتلقوا طلبات رأي بعد الآن."]
    : ["Lien invalide ou expiré.", "Invalid or expired link.", "رابط غير صالح أو منتهي الصلاحية."];
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Benani Travel</title></head><body style="font-family:Arial,sans-serif;background:#FBF8F2;color:#0E1420;display:grid;place-items:center;min-height:100vh;margin:0"><main style="background:#fff;padding:32px;border-radius:16px;max-width:480px;text-align:center"><p>${msg[0]}</p><p>${msg[1]}</p><p dir="rtl">${msg[2]}</p></main></body></html>`;
  return new Response(html, { status: b ? 200 : 404, headers: { "content-type": "text/html; charset=utf-8" } });
}
