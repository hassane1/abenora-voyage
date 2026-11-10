import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/security";
import { unsubscribeSig } from "@/lib/newsletter";

/** Confirmation (double opt-in) et désinscription en un clic depuis les e-mails */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const action = p.get("action");
  let sub = null;
  if (action === "confirm") {
    const token = p.get("token") ?? "";
    sub = token.length >= 20 ? await db.newsletterSubscriber.findUnique({ where: { tokenHash: sha256(token) } }) : null;
  } else if (action === "unsubscribe") {
    const id = p.get("id") ?? "";
    sub = id && p.get("sig") === unsubscribeSig(id) ? await db.newsletterSubscriber.findUnique({ where: { id } }) : null;
  }
  const locale = sub?.locale ?? "fr";
  const back = (state: string) => NextResponse.redirect(new URL(`/${locale}?newsletter=${state}#newsletter`, req.url));
  if (!sub) return back("invalid");
  if (action === "confirm" && sub.status === "PENDING") {
    if (Date.now() - sub.consentAt.getTime() > 7 * 86400_000) return back("invalid"); // lien valable 7 jours
    // le jeton de confirmation est invalidé (usage unique)
    await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { status: "CONFIRMED", confirmedAt: new Date(), tokenHash: sha256(randomToken()) } });
    return back("confirmed");
  }
  if (action === "unsubscribe") {
    await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { status: "UNSUBSCRIBED" } });
    return back("unsubscribed");
  }
  return back("invalid");
}
