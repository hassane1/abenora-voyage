import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { BookingError, quote } from "@/lib/bookings";
import { hasLocale } from "@/i18n/config";

const schema = z.object({
  circuitId: z.string(),
  adults: z.number().int().min(1).max(30),
  childAges: z.array(z.number().int().min(0).max(17)).max(20),
  privateTour: z.boolean(),
  optionCodes: z.array(z.string()).max(30),
  promoCode: z.string().max(40).optional(),
  grid: z.object({ row: z.number().int().min(0).max(50), col: z.string().max(30) }).nullable().optional(),
  locale: z.string(),
});

/** Calcul du prix faisant foi (mêmes règles que lors de l'enregistrement) */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const locale = hasLocale(parsed.data.locale) ? parsed.data.locale : "fr";
  try {
    const { price, promo, circuit } = await quote(parsed.data, locale);
    return NextResponse.json({ price, promo, depositPercent: circuit.depositPercent, promoRejected: !!parsed.data.promoCode && !promo });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: 404 });
    throw e;
  }
}
