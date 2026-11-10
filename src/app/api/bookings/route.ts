import { NextResponse, type NextRequest } from "next/server";
import { BookingError, createBooking } from "@/lib/bookings";
import { getCustomer } from "@/lib/customer";
import { clientIp, rateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  // 10 demandes / 10 min par IP (limite persistée en base)
  const lim = await rateLimit(`booking:${await clientIp()}`, 10, 600);
  if (!lim.ok) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "retry-after": String(lim.retryAfter) } });
  try {
    const customer = await getCustomer();
    const booking = await createBooking(await req.json().catch(() => null), { customerId: customer?.id ?? null });
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
