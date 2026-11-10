import { NextResponse, type NextRequest } from "next/server";
import { BookingError, createBooking } from "@/lib/bookings";

// Limitation simple du nombre de demandes par IP (mémoire du processus)
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  try {
    const booking = await createBooking(await req.json().catch(() => null));
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
