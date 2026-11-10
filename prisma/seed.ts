/**
 * Seed : crée la destination Merzouga (données de démonstration clairement marquées),
 * les futures destinations (non publiées), le compte administrateur et les réglages.
 * Relançable sans risque : supprime puis recrée le contenu catalogue, sans toucher aux réservations
 * sauf avec l'option --reset.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { activities, bookingOptions, circuits, futureDestinations, merzouga } from "./seed-data/merzouga";
import { merzougaFaq, merzougaSections, merzougaTips, posts } from "./seed-data/editorial";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });
const reset = process.argv.includes("--reset");

function utcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function main() {
  if (reset) {
    await db.booking.deleteMany();
    await db.notification.deleteMany();
    await db.quoteRequest.deleteMany();
  }
  const bookingCount = await db.booking.count();

  // --- Destinations ---------------------------------------------------------
  const dest = await db.destination.upsert({
    where: { slug: merzouga.slug },
    update: {
      name: merzouga.name, tagline: merzouga.tagline, description: merzouga.description, region: merzouga.region,
      latitude: merzouga.latitude, longitude: merzouga.longitude, published: true, sortOrder: merzouga.sortOrder,
      sections: merzougaSections, tips: merzougaTips, faq: merzougaFaq,
    },
    create: {
      slug: merzouga.slug, name: merzouga.name, tagline: merzouga.tagline, description: merzouga.description, region: merzouga.region,
      latitude: merzouga.latitude, longitude: merzouga.longitude, published: true, sortOrder: merzouga.sortOrder,
      sections: merzougaSections, tips: merzougaTips, faq: merzougaFaq,
    },
  });

  for (const [i, f] of futureDestinations.entries()) {
    await db.destination.upsert({
      where: { slug: f.slug },
      update: {},
      create: {
        slug: f.slug, name: f.name, region: f.region, latitude: f.lat, longitude: f.lng, published: false, sortOrder: 10 + i,
        tagline: { fr: "", en: "" }, description: { fr: "", en: "" }, sections: {}, tips: {}, faq: [],
      },
    });
  }

  // --- Catalogue Merzouga (recréé) -------------------------------------------
  await db.activity.deleteMany({ where: { destinationId: dest.id } });
  for (const [i, a] of activities.entries()) {
    await db.activity.create({
      data: {
        slug: a.slug, destinationId: dest.id, category: a.category, icon: a.icon, title: a.title, summary: a.summary,
        description: a.description, duration: a.duration, difficulty: a.difficulty, minAge: a.minAge,
        restrictions: a.restrictions, included: a.included, excluded: a.excluded, safety: a.safety,
        availability: a.availability, priceMad: a.priceMad, priceUnit: a.priceUnit ?? "PER_PERSON",
        priceStatus: a.priceMad === null ? "ON_REQUEST" : "DEMO", bookingOptionCode: a.bookingOptionCode ?? null, sortOrder: i,
      },
    });
  }

  // Les circuits ne sont recréés que s'il n'existe aucune réservation (intégrité des dossiers)
  if (bookingCount === 0) {
    await db.bookingOption.deleteMany();
    await db.circuit.deleteMany({ where: { destinationId: dest.id } });
    for (const [i, o] of bookingOptions.entries()) {
      await db.bookingOption.create({
        data: {
          code: o.code, group: o.group, label: o.label, description: o.description, priceMad: o.priceMad, unit: o.unit,
          exclusiveGroup: "exclusiveGroup" in o ? o.exclusiveGroup : null, isDefault: "isDefault" in o ? o.isDefault : false,
          priceStatus: "DEMO", sortOrder: i,
        },
      });
    }

    const today = utcDay(new Date());
    for (const c of circuits) {
      const circuit = await db.circuit.create({
        data: {
          slug: c.slug, destinationId: dest.id, sortOrder: c.sortOrder, title: c.title, summary: c.summary, days: c.days, nights: c.nights,
          startPoint: c.startPoint, endPoint: c.endPoint, transport: c.transport, accommodation: c.accommodation, meals: c.meals,
          included: c.included, excluded: c.excluded, optionalActivities: c.optionalActivities, cancellationPolicy: c.cancellationPolicy,
          warnings: c.warnings, priceAdultMad: c.priceAdultMad, privateSupplementMad: c.privateSupplementMad,
          defaultCapacity: c.defaultCapacity, priceStatus: "DEMO",
          desertNights: c.stops.filter((s) => s.kind === "NIGHT" && s.name.startsWith("Campement")).length,
          itinerary: { create: c.itinerary.map((d) => ({ dayNumber: d.day, title: d.title, description: d.description, items: d.items })) },
          stops: {
            create: c.stops.map((s, order) => ({
              order, dayNumber: s.day, name: s.name, latitude: s.lat, longitude: s.lng, kind: s.kind, modeToNext: s.mode, description: s.desc,
            })),
          },
        },
      });

      // Disponibilités FICTIVES de démonstration : 120 jours à partir de J+3
      const departures = [];
      for (let d = 3; d <= 120; d++) {
        const date = new Date(today.getTime() + d * 86400000);
        if (c.departureWeekdays && !c.departureWeekdays.includes(date.getUTCDay())) continue;
        // quelques dates fermées / presque complètes pour illustrer le calendrier
        const closed = d % 17 === 0;
        const nearlyFull = d % 11 === 0;
        departures.push({
          circuitId: circuit.id, date, capacity: c.defaultCapacity,
          seatsHeld: nearlyFull ? c.defaultCapacity - 2 : 0, status: closed ? "CLOSED" : "OPEN", isDemo: true,
        });
      }
      await db.departure.createMany({ data: departures });
    }
  } else {
    console.log(`ℹ ${bookingCount} réservation(s) existante(s) : circuits et départs conservés.`);
  }

  // --- Blog --------------------------------------------------------------------
  for (const p of posts) {
    await db.post.upsert({
      where: { slug: p.slug },
      update: { title: p.title, excerpt: p.excerpt, body: p.body, category: p.category },
      create: { ...p, destinationId: dest.id },
    });
  }

  // --- Réglages -------------------------------------------------------------
  const settings: Record<string, string> = {
    taxRatePercent: "0", // à configurer selon le statut fiscal de l'agence
    pricesIncludeTax: "true",
    familyDiscountPercent: "5", // 2 adultes + 2 enfants ou plus (règle de démonstration)
    groupDiscountPercent: "8", // 8 voyageurs ou plus (règle de démonstration)
    groupDiscountMinPeople: "8",
    paymentMode: "ON_REQUEST", // ON_REQUEST (mode A) | ONLINE (mode B, non activé)
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // --- Administrateur --------------------------------------------------------
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.adminUser.upsert({ where: { email }, update: { passwordHash }, create: { email, name: "Administrateur", passwordHash } });
    console.log(`✔ Compte administrateur prêt : ${email} (mot de passe défini dans .env)`);
  } else {
    console.warn("⚠ ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun administrateur créé.");
  }

  console.log("✔ Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
