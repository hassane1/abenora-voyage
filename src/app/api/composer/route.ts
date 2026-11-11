import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "@/i18n/config";
import { getComposerDestination } from "@/lib/composer-data";
import { choiceSchema, computePrice } from "@/lib/composer-engine";
import { clientIp, rateLimit } from "@/lib/security";

/** GET : données d'une destination pour le configurateur (programme, villes, photos) */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const loc = req.nextUrl.searchParams.get("locale") ?? "fr";
  const locale = hasLocale(loc) ? loc : "fr";
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const data = await getComposerDestination(slug, locale);
  if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(data);
}

/** POST : estimation DÉMO faisant foi, recalculée côté serveur à partir des données en base */
export async function POST(req: NextRequest) {
  const lim = await rateLimit(`composer:${await clientIp()}`, 60, 60);
  if (!lim.ok) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const parsed = choiceSchema.safeParse(body?.choice);
  const loc = typeof body?.locale === "string" ? body.locale : "fr";
  const locale = hasLocale(loc) ? loc : "fr";
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const data = await getComposerDestination(parsed.data.destination, locale);
  if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const price = computePrice(data.cities, data.config, data.pos, parsed.data, locale);
  if (!price) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  return NextResponse.json({ price });
}
