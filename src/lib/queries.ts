import "server-only";
import { connection } from "next/server";
import { db } from "./db";
import { cached } from "./cache";

/** Lecture du catalogue public (toujours à la requête : les données sont éditées dans l'admin) */

export async function getPublishedDestinations() {
  await connection();
  return cached("dest:pub", 60, () => db.destination.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }));
}

export async function getUpcomingDestinations() {
  await connection();
  return cached("dest:soon", 60, () => db.destination.findMany({ where: { published: false, slug: { not: "voyages-sur-mesure" } }, orderBy: { sortOrder: "asc" } }));
}

export async function getDestination(slug: string) {
  await connection();
  return cached(`dest:${slug}`, 60, () => db.destination.findFirst({
    where: { slug, published: true },
    include: {
      circuits: { where: { published: true }, orderBy: { sortOrder: "asc" }, include: { stops: { orderBy: { order: "asc" } } } },
      activities: { where: { published: true }, orderBy: { sortOrder: "asc" } },
      media: { where: { rightsConfirmed: true } },
    },
  }));
}

export async function getCircuits(filter?: { destination?: string; maxPrice?: number; minDays?: number; maxDays?: number; scope?: "NATIONAL" | "INTERNATIONAL" }) {
  await connection();
  return cached(`circuits:${JSON.stringify(filter ?? {})}`, 60, () => db.circuit.findMany({
    where: {
      published: true,
      destination: { published: true, ...(filter?.destination ? { slug: filter.destination } : {}), ...(filter?.scope ? { scope: filter.scope } : {}) },
      ...(filter?.maxPrice ? { OR: [{ priceAdultMad: { lte: filter.maxPrice } }, { priceAdultMad: null }] } : {}),
      ...(filter?.minDays || filter?.maxDays ? { days: { gte: filter?.minDays ?? 0, lte: filter?.maxDays ?? 99 } } : {}),
    },
    orderBy: [{ destination: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { destination: true },
  }));
}

export async function getCircuit(slug: string) {
  await connection();
  return cached(`circuit:${slug}`, 60, () => db.circuit.findFirst({
    where: { slug, published: true, destination: { published: true } },
    include: {
      destination: true,
      itinerary: { orderBy: { dayNumber: "asc" } },
      stops: { orderBy: { order: "asc" } },
    },
  }));
}

export async function getActivities(destinationSlug?: string) {
  await connection();
  return cached(`acts:${destinationSlug ?? ""}`, 60, () =>
    db.activity.findMany({
      where: { published: true, destination: { published: true, ...(destinationSlug ? { slug: destinationSlug } : {}) } },
      orderBy: { sortOrder: "asc" },
      include: { destination: true },
    }),
  );
}

export async function getActivity(slug: string) {
  await connection();
  return db.activity.findFirst({ where: { slug, published: true, destination: { published: true } }, include: { destination: true } });
}

export async function getPublishedReviews(destinationId?: string) {
  await connection();
  return cached(`reviews:${destinationId ?? ""}`, 60, () => db.review.findMany({
    where: { published: true, ...(destinationId ? { booking: { circuit: { destinationId } } } : {}) },
    orderBy: { createdAt: "desc" },
    include: { booking: { select: { startDate: true, circuit: { select: { title: true } } } } },
  }));
}

export type NextDeparture = { id: string; circuitId: string; date: Date; remaining: number; isDemo: boolean };

/** Prochain départ ouvert (avec places) pour chaque circuit */
export async function getNextDepartures(): Promise<Map<string, NextDeparture>> {
  await connection();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // disponibilités : cache de 10 s (la réservation est toujours contrôlée en base)
  const deps = await cached("deps:next", 10, () =>
    db.departure.findMany({ where: { status: "OPEN", date: { gt: today }, circuit: { published: true } }, orderBy: { date: "asc" }, take: 400 }),
  );
  const map = new Map<string, NextDeparture>();
  for (const d of deps) {
    const remaining = d.capacity - d.seatsHeld;
    if (remaining > 0 && !map.has(d.circuitId)) map.set(d.circuitId, { id: d.id, circuitId: d.circuitId, date: d.date, remaining, isDemo: d.isDemo });
  }
  return map;
}

/** Liste des prochains départs (tous circuits) pour le bandeau commercial */
export async function getUpcomingDepartures(limit = 8) {
  await connection();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const deps = await cached("deps:upcoming", 10, () =>
    db.departure.findMany({
      where: { status: "OPEN", date: { gt: today }, circuit: { published: true, destination: { published: true } } },
      orderBy: { date: "asc" },
      include: { circuit: true },
      take: 60,
    }),
  );
  const perCircuit = new Map<string, number>();
  return deps
    .filter((d) => d.capacity - d.seatsHeld > 0)
    .filter((d) => {
      const n = perCircuit.get(d.circuitId) ?? 0;
      perCircuit.set(d.circuitId, n + 1);
      return n < 3; // 3 dates max par circuit pour varier
    })
    .slice(0, limit);
}

export async function getPosts() {
  await connection();
  return cached("posts", 60, () => db.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } }));
}

export async function getPost(slug: string) {
  await connection();
  return db.post.findFirst({ where: { slug, published: true } });
}

export async function getPublicMedia() {
  await connection();
  return db.media.findMany({ where: { rightsConfirmed: true }, orderBy: { createdAt: "desc" }, include: { destination: true } });
}
