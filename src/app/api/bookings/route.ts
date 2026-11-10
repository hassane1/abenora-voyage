import { NextResponse, type NextRequest } from "next/server";
import { BookingError, createBooking } from "@/lib/bookings";
import { getCustomer } from "@/lib/customer";
import { clientIp, rateLimit, sha256 } from "@/lib/security";

const tooMany = (retryAfter: number) => NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "retry-after": String(retryAfter) } });

export async function POST(req: NextRequest) {
  // 10 demandes / 10 min par IP (limite persistée en base ; IP non falsifiable par en-tête)
  const lim = await rateLimit(`booking:${await clientIp()}`, 10, 600);
  if (!lim.ok) return tooMany(lim.retryAfter);
  try {
    const customer = await getCustomer();
    const body = await req.json().catch(() => null);
    // + 5 demandes / min par voyageur (compte connecté, sinon adresse e-mail saisie)
    const who = customer?.id ?? (typeof body?.email === "string" ? sha256(body.email.trim().toLowerCase()).slice(0, 32) : "anon");
    const perUser = await rateLimit(`booking:user:${who}`, 5, 60);
    if (!perUser.ok) return tooMany(perUser.retryAfter);
    const booking = await createBooking(body, { customerId: customer?.id ?? null });
    return NextResponse.json({ reference: booking.reference, token: booking.accessToken, status: booking.status }, { status: 201 });
  } catch (e) {
    if (e instanceof BookingError) {
      const status = e.code === "SOLD_OUT" ? 409 : e.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: e.code }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
