/**
 * Chargement des programmes (publiés et simulés) — relançable : `npm run db:programmes`.
 * Un programme qui a déjà des réservations n'est jamais supprimé (seuls ses textes et tarifs sont mis à jour).
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import { progDestinations, publishNational, published, simulated, type Programme } from "./seed-data/programmes";

function utcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function departureDates(p: Programme): Date[] {
  if (p.departures.dates) return p.departures.dates.map((s) => new Date(`${s}T00:00:00Z`)).filter((d) => d > new Date());
  if (p.departures.weekly) {
    const out: Date[] = [];
    const d = utcDay(new Date());
    d.setUTCDate(d.getUTCDate() + 3);
    while (out.length < p.departures.weekly.weeks) {
      if (d.getUTCDay() === p.departures.weekly.weekday) out.push(new Date(d));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  }
  return [];
}

const list = (a: string[]) => ({ fr: a });

export async function applyProgrammes(db: PrismaClient) {
  for (const d of progDestinations) {
    await db.destination.upsert({
      where: { slug: d.slug },
      update: { scope: d.scope, country: d.country },
      create: {
        slug: d.slug, name: d.name, tagline: d.tagline, description: d.description, region: d.region, scope: d.scope, country: d.country,
        latitude: d.lat, longitude: d.lng, sections: {}, tips: { fr: [] }, faq: [], published: true, sortOrder: d.sortOrder,
      },
    });
  }
  await db.destination.updateMany({ where: { slug: { in: publishNational } }, data: { published: true } });

  let n = 0;
  for (const [i, p] of [...published, ...simulated].entries()) {
    const dest = await db.destination.findUnique({ where: { slug: p.destination } });
    if (!dest) {
      console.warn(`⚠ destination inconnue ${p.destination} pour ${p.slug}`);
      continue;
    }
    const data = {
      destinationId: dest.id, title: p.title, summary: p.summary, days: p.days, nights: p.nights, desertNights: p.slug.includes("merzouga") ? 1 : 0,
      startPoint: p.start, endPoint: p.end, transport: p.transport, accommodation: p.accommodation, meals: p.meals,
      included: list(p.included), excluded: list(p.excluded), optionalActivities: { fr: [] }, cancellationPolicy: p.cancellation, warnings: list(p.warnings ?? []),
      pricingMode: "PER_PERSON", priceAdultMad: p.priceFrom, childPricePercent: p.type === "OMRA" ? 100 : 50, childFreeUnderAge: p.type === "OMRA" ? 0 : 4,
      privateSupplementMad: 0, depositPercent: p.deposit, priceStatus: p.status, priceGrid: p.grid ?? undefined, programType: p.type, sourceNote: p.source,
      defaultCapacity: p.capacity, published: true, sortOrder: 100 + i,
    };
    const existing = await db.circuit.findUnique({ where: { slug: p.slug }, include: { _count: { select: { bookings: true } } } });
    if (existing && existing._count.bookings > 0) {
      await db.circuit.update({ where: { id: existing.id }, data });
      continue;
    }
    if (existing) await db.circuit.delete({ where: { id: existing.id } });
    const c = await db.circuit.create({
      data: {
        ...data,
        slug: p.slug,
        itinerary: { create: p.itinerary.map((d, k) => ({ dayNumber: k + 1, title: { fr: d.title }, description: { fr: d.description }, items: { fr: [] } })) },
        stops: {
          create: p.stops.map((s, k) => ({
            order: k + 1, dayNumber: Math.min(s.day, p.days), name: s.name, latitude: s.lat, longitude: s.lng,
            kind: k === p.stops.length - 1 ? "STAGE" : "STAGE", modeToNext: k === p.stops.length - 1 ? null : s.mode, description: { fr: "" },
          })),
        },
        options: { create: (p.options ?? []).map((o, k) => ({ code: o.code, group: "TRANSFERT", label: o.label, description: { fr: "" }, priceMad: o.price, unit: "PER_PERSON", priceStatus: p.status, sortOrder: k })) },
      },
    });
    const dates = departureDates(p);
    if (dates.length) await db.departure.createMany({ data: dates.map((date) => ({ circuitId: c.id, date, capacity: p.capacity, isDemo: true, status: "OPEN" })) });
    n++;
  }
  console.log(`✔ Programmes chargés : ${n} (${published.length} publiés, ${simulated.length} exemples)`);
}
