import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/security";

/** Départs d'un circuit (90 jours glissants par défaut) avec places restantes */
export async function GET(req: NextRequest) {
  const lim = await rateLimit(`departures:${await clientIp()}`, 120, 60);
  if (!lim.ok) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "retry-after": String(lim.retryAfter) } });
  const circuitId = req.nextUrl.searchParams.get("circuitId");
  if (!circuitId || circuitId.length > 40) return NextResponse.json({ error: "circuitId requis" }, { status: 400 });
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const departures = await db.departure.findMany({
    where: { circuitId, date: { gte: from }, circuit: { published: true } },
    orderBy: { date: "asc" },
    take: 400,
  });
  return NextResponse.json(
    departures.map((d) => ({
      id: d.id,
      date: d.date.toISOString().slice(0, 10),
      remaining: Math.max(0, d.capacity - d.seatsHeld),
      status: d.status,
      isDemo: d.isDemo,
    })),
    { headers: { "Cache-Control": "no-store" } },
  );
}
