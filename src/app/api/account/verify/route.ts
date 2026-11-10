import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { consumeCustomerToken } from "@/lib/customer";

/** Vérification de l'adresse e-mail d'un compte voyageur (lien reçu par e-mail, usage unique, 48 h) */
export async function GET(req: NextRequest) {
  const id = await consumeCustomerToken(req.nextUrl.searchParams.get("token") ?? "", "VERIFY_EMAIL");
  if (!id) return NextResponse.redirect(new URL("/fr/compte?verify=invalid", req.url));
  const c = await db.customer.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
  // rattachement automatique des réservations faites sans compte avec la même adresse
  await db.booking.updateMany({ where: { email: c.email, customerId: null }, data: { customerId: c.id } });
  return NextResponse.redirect(new URL(`/${c.locale}/compte?verify=ok`, req.url));
}
