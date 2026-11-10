"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, signIn, signOut } from "@/lib/auth";
import { BookingError, changeBookingStatus } from "@/lib/bookings";
import { addDays } from "@/lib/format";

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------
const attempts = new Map<string, { n: number; until: number }>();

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const a = attempts.get(email);
  if (a && a.until > Date.now()) redirect("/admin/login?error=1");
  const ok = await signIn(email, password);
  if (!ok) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(email, { n, until: n >= 5 ? Date.now() + 15 * 60_000 : 0 }); // blocage 15 min après 5 échecs
    redirect("/admin/login?error=1");
  }
  attempts.delete(email);
  redirect("/admin");
}

export async function logout() {
  await signOut();
  redirect("/admin/login");
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === "" ? null : Number(v);
};
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

// ---------------------------------------------------------------------------
// Réservations
// ---------------------------------------------------------------------------
export async function setBookingStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const status = z.enum(["CONFIRMED", "REJECTED", "CANCELLED", "PENDING"]).parse(str(formData, "status"));
  try {
    await changeBookingStatus(id, status, admin.email, str(formData, "note") || undefined);
  } catch (e) {
    if (e instanceof BookingError && e.code === "SOLD_OUT") redirect(`/admin/reservations/${id}?error=soldout`);
    throw e;
  }
  revalidatePath(`/admin/reservations/${id}`);
  redirect(`/admin/reservations/${id}?ok=status`);
}

export async function recordPayment(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const amount = Math.round(Number(str(formData, "amount")));
  const kind = str(formData, "kind") === "REFUND" ? "REFUND" : "PAYMENT";
  if (!amount || amount <= 0) redirect(`/admin/reservations/${id}?error=amount`);
  const b = await db.booking.findUniqueOrThrow({ where: { id }, include: { payments: true } });
  await db.payment.create({ data: { bookingId: id, amountMad: amount, method: str(formData, "method") || "VIREMENT", reference: str(formData, "reference") || null, kind, recordedBy: admin.email } });
  const paid = b.payments.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0) + (kind === "REFUND" ? -amount : amount);
  const paymentStatus = kind === "REFUND" && paid <= 0 ? "REFUNDED" : paid >= b.totalMad ? "PAID" : paid > 0 ? "DEPOSIT_PAID" : "NONE";
  await db.booking.update({ where: { id }, data: { paymentStatus } });
  await db.bookingEvent.create({ data: { bookingId: id, type: "PAYMENT_RECORDED", actor: admin.email, note: `${kind === "REFUND" ? "Remboursement" : "Paiement"} de ${amount} MAD enregistré (${str(formData, "method")})` } });
  redirect(`/admin/reservations/${id}?ok=payment`);
}

export async function addBookingNote(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const note = str(formData, "note");
  if (note) await db.bookingEvent.create({ data: { bookingId: id, type: "NOTE", actor: admin.email, note } });
  redirect(`/admin/reservations/${id}`);
}

/** Modification d'un dossier : coordonnées et/ou changement de date (déplacement atomique des places) */
export async function updateBooking(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const b = await db.booking.findUniqueOrThrow({ where: { id }, include: { circuit: true } });
  const changes: string[] = [];
  const data: Record<string, unknown> = {};
  for (const k of ["firstName", "lastName", "email", "phone", "whatsapp", "country", "departureCity", "specialNeeds"] as const) {
    const v = str(formData, k);
    if (v !== (b[k] ?? "")) {
      data[k] = v || null;
      changes.push(k);
    }
  }
  const newDepartureId = str(formData, "departureId");
  const travelers = b.adults + b.children;
  try {
    await db.$transaction(async (tx) => {
      if (newDepartureId && newDepartureId !== b.departureId) {
        const dep = await tx.departure.findFirstOrThrow({ where: { id: newDepartureId, circuitId: b.circuitId } });
        if (b.status === "PENDING" || b.status === "CONFIRMED") {
          const n = await tx.$executeRaw`UPDATE "Departure" SET "seatsHeld" = "seatsHeld" + ${travelers} WHERE "id" = ${dep.id} AND "seatsHeld" + ${travelers} <= "capacity"`;
          if (n !== 1) throw new BookingError("SOLD_OUT");
          await tx.$executeRaw`UPDATE "Departure" SET "seatsHeld" = CASE WHEN "seatsHeld" >= ${travelers} THEN "seatsHeld" - ${travelers} ELSE 0 END WHERE "id" = ${b.departureId}`;
        }
        data.departureId = dep.id;
        data.startDate = dep.date;
        data.endDate = addDays(dep.date, b.circuit.nights);
        changes.push(`date → ${dep.date.toISOString().slice(0, 10)}`);
      }
      if (changes.length) {
        await tx.booking.update({ where: { id }, data });
        await tx.bookingEvent.create({ data: { bookingId: id, type: "UPDATED", actor: admin.email, note: `Modifié : ${changes.join(", ")}` } });
      }
    });
  } catch (e) {
    if (e instanceof BookingError) redirect(`/admin/reservations/${id}?error=soldout`);
    throw e;
  }
  redirect(`/admin/reservations/${id}?ok=update`);
}

// ---------------------------------------------------------------------------
// Circuits, départs, options, activités, destinations
// ---------------------------------------------------------------------------
const PRICE_STATUS = z.enum(["DEMO", "VALIDATED", "ON_REQUEST"]);

export async function updateCircuit(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const c = await db.circuit.findUniqueOrThrow({ where: { id } });
  const loc = (field: string, current: unknown) => {
    const base = (current ?? {}) as Record<string, string>;
    return { ...base, fr: str(formData, `${field}_fr`) || base.fr, en: str(formData, `${field}_en`), ar: str(formData, `${field}_ar`) };
  };
  const locList = (field: string, current: unknown) => {
    const base = (current ?? {}) as Record<string, string>;
    return { ...base, fr: lines(str(formData, `${field}_fr`)), en: lines(str(formData, `${field}_en`)), ar: lines(str(formData, `${field}_ar`)) };
  };
  await db.circuit.update({
    where: { id },
    data: {
      title: loc("title", c.title),
      summary: loc("summary", c.summary),
      included: locList("included", c.included),
      excluded: locList("excluded", c.excluded),
      warnings: locList("warnings", c.warnings),
      cancellationPolicy: loc("cancellation", c.cancellationPolicy),
      pricingMode: str(formData, "pricingMode") === "PER_GROUP" ? "PER_GROUP" : "PER_PERSON",
      priceAdultMad: num(formData, "priceAdultMad"),
      childPricePercent: num(formData, "childPricePercent") ?? 50,
      childFreeUnderAge: num(formData, "childFreeUnderAge") ?? 4,
      privateSupplementMad: num(formData, "privateSupplementMad") ?? 0,
      depositPercent: num(formData, "depositPercent") ?? 30,
      defaultCapacity: num(formData, "defaultCapacity") ?? 12,
      priceStatus: PRICE_STATUS.parse(str(formData, "priceStatus")),
      published: bool(formData, "published"),
    },
  });
  revalidatePath("/", "layout");
  redirect(`/admin/circuits/${id}?ok=1`);
}

export async function updateItineraryDay(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const day = await db.circuitDay.findUniqueOrThrow({ where: { id } });
  const t = (day.title ?? {}) as Record<string, string>;
  const d = (day.description ?? {}) as Record<string, string>;
  const it = (day.items ?? {}) as Record<string, string>;
  await db.circuitDay.update({
    where: { id },
    data: {
      title: { ...t, fr: str(formData, "title_fr"), en: str(formData, "title_en"), ar: str(formData, "title_ar") },
      description: { ...d, fr: str(formData, "description_fr"), en: str(formData, "description_en") },
      items: { ...it, fr: lines(str(formData, "items_fr")), en: lines(str(formData, "items_en")) },
    },
  });
  redirect(`/admin/circuits/${day.circuitId}?ok=day#programme`);
}

export async function generateDepartures(formData: FormData) {
  await requireAdmin();
  const circuitId = str(formData, "circuitId");
  const from = new Date(`${str(formData, "from")}T00:00:00Z`);
  const to = new Date(`${str(formData, "to")}T00:00:00Z`);
  const capacity = num(formData, "capacity") ?? 12;
  const weekdays = formData.getAll("weekday").map(Number);
  const isDemo = bool(formData, "isDemo");
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) redirect(`/admin/circuits/${circuitId}?error=dates#departs`);
  let created = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (weekdays.length && !weekdays.includes(d.getUTCDay())) continue;
    const exists = await db.departure.findUnique({ where: { circuitId_date: { circuitId, date: d } } });
    if (!exists) {
      await db.departure.create({ data: { circuitId, date: d, capacity, isDemo } });
      created++;
    }
  }
  redirect(`/admin/circuits/${circuitId}?ok=deps&n=${created}#departs`);
}

export async function updateDeparture(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const dep = await db.departure.findUniqueOrThrow({ where: { id } });
  const capacity = Math.max(dep.seatsHeld, num(formData, "capacity") ?? dep.capacity); // jamais sous les places déjà prises
  await db.departure.update({
    where: { id },
    data: { capacity, status: str(formData, "status") === "CLOSED" ? "CLOSED" : "OPEN", isDemo: bool(formData, "isDemo") },
  });
  redirect(`/admin/circuits/${dep.circuitId}?ok=dep#departs`);
}

export async function bulkDepartures(formData: FormData) {
  await requireAdmin();
  const circuitId = str(formData, "circuitId");
  const action = str(formData, "action");
  if (action === "validate") await db.departure.updateMany({ where: { circuitId }, data: { isDemo: false } });
  if (action === "close-all") await db.departure.updateMany({ where: { circuitId, seatsHeld: 0 }, data: { status: "CLOSED" } });
  if (action === "delete-demo") await db.departure.deleteMany({ where: { circuitId, isDemo: true, seatsHeld: 0, bookings: { none: {} } } });
  redirect(`/admin/circuits/${circuitId}?ok=bulk#departs`);
}

export async function updateOption(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const o = await db.bookingOption.findUniqueOrThrow({ where: { id } });
  const label = (o.label ?? {}) as Record<string, string>;
  await db.bookingOption.update({
    where: { id },
    data: {
      label: { ...label, fr: str(formData, "label_fr") || label.fr, en: str(formData, "label_en"), ar: str(formData, "label_ar") },
      priceMad: num(formData, "priceMad") ?? 0,
      unit: z.enum(["PER_PERSON", "PER_BOOKING", "PER_PERSON_NIGHT"]).parse(str(formData, "unit")),
      priceStatus: PRICE_STATUS.parse(str(formData, "priceStatus")),
      published: bool(formData, "published"),
    },
  });
  redirect("/admin/options?ok=1");
}

export async function updateActivity(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const a = await db.activity.findUniqueOrThrow({ where: { id } });
  const loc = (field: string, current: unknown) => {
    const base = (current ?? {}) as Record<string, string>;
    return { ...base, fr: str(formData, `${field}_fr`) || base.fr, en: str(formData, `${field}_en`), ar: str(formData, `${field}_ar`) };
  };
  const price = num(formData, "priceMad");
  await db.activity.update({
    where: { id },
    data: {
      title: loc("title", a.title),
      summary: loc("summary", a.summary),
      priceMad: price,
      priceUnit: str(formData, "priceUnit") === "PER_GROUP" ? "PER_GROUP" : "PER_PERSON",
      priceStatus: price === null ? "ON_REQUEST" : PRICE_STATUS.parse(str(formData, "priceStatus")),
      minAge: num(formData, "minAge"),
      published: bool(formData, "published"),
    },
  });
  revalidatePath("/", "layout");
  redirect(`/admin/activites?ok=1#${a.slug}`);
}

export async function updateDestination(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const d = await db.destination.findUniqueOrThrow({ where: { id }, include: { circuits: { where: { published: true } } } });
  const loc = (field: string, current: unknown) => {
    const base = (current ?? {}) as Record<string, string>;
    return { ...base, fr: str(formData, `${field}_fr`), en: str(formData, `${field}_en`), ar: str(formData, `${field}_ar`) };
  };
  const wantPublish = bool(formData, "published");
  await db.destination.update({
    where: { id },
    data: { name: loc("name", d.name), tagline: loc("tagline", d.tagline), description: loc("description", d.description), published: wantPublish },
  });
  revalidatePath("/", "layout");
  redirect(`/admin/destinations?ok=1${wantPublish && d.circuits.length === 0 ? "&warn=nocircuit" : ""}`);
}

/** Création d'une nouvelle destination (non publiée) avec un circuit vierge à compléter */
export async function createCircuit(formData: FormData) {
  await requireAdmin();
  const destinationId = str(formData, "destinationId");
  const fr = str(formData, "title_fr");
  const slug = `${fr.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${randomBytes(2).toString("hex")}`;
  const days = Math.max(1, num(formData, "days") ?? 2);
  const empty = { fr: [], en: [] };
  const c = await db.circuit.create({
    data: {
      slug, destinationId, title: { fr, en: "" }, summary: { fr: "", en: "" }, days, nights: days - 1, desertNights: 0,
      startPoint: str(formData, "startPoint") || "—", endPoint: str(formData, "startPoint") || "—",
      transport: { fr: "" }, accommodation: { fr: "" }, meals: { fr: "" }, included: empty, excluded: empty, optionalActivities: empty,
      cancellationPolicy: { fr: "" }, warnings: empty, priceAdultMad: null, priceStatus: "ON_REQUEST", published: false,
      itinerary: { create: Array.from({ length: days }, (_, i) => ({ dayNumber: i + 1, title: { fr: `Jour ${i + 1}` }, description: { fr: "" }, items: empty })) },
    },
  });
  redirect(`/admin/circuits/${c.id}?ok=created`);
}

// ---------------------------------------------------------------------------
// Commercial : codes promo, demandes, avis
// ---------------------------------------------------------------------------
export async function savePromo(formData: FormData) {
  await requireAdmin();
  const code = str(formData, "code").toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const percentOff = Math.min(90, Math.max(1, num(formData, "percentOff") ?? 0));
  if (!code) redirect("/admin/promos?error=1");
  const data = {
    description: str(formData, "description") || null,
    percentOff,
    validFrom: str(formData, "validFrom") ? new Date(`${str(formData, "validFrom")}T00:00:00Z`) : null,
    validTo: str(formData, "validTo") ? new Date(`${str(formData, "validTo")}T23:59:59Z`) : null,
    minPeople: num(formData, "minPeople") ?? 1,
    active: bool(formData, "active"),
  };
  await db.promoCode.upsert({ where: { code }, update: data, create: { code, ...data } });
  redirect("/admin/promos?ok=1");
}

export async function deletePromo(formData: FormData) {
  await requireAdmin();
  await db.promoCode.delete({ where: { id: str(formData, "id") } });
  redirect("/admin/promos");
}

export async function setRequestStatus(formData: FormData) {
  await requireAdmin();
  await db.quoteRequest.update({ where: { id: str(formData, "id") }, data: { status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]).parse(str(formData, "status")) } });
  redirect("/admin/demandes");
}

export async function moderateReview(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (str(formData, "action") === "delete") await db.review.delete({ where: { id } });
  else await db.review.update({ where: { id }, data: { published: str(formData, "action") === "publish" } });
  revalidatePath("/", "layout");
  redirect("/admin/avis");
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  for (const key of ["taxRatePercent", "familyDiscountPercent", "groupDiscountPercent", "groupDiscountMinPeople"]) {
    const v = num(formData, key);
    if (v !== null && v >= 0) await db.setting.upsert({ where: { key }, update: { value: String(v) }, create: { key, value: String(v) } });
  }
  const incl = bool(formData, "pricesIncludeTax") ? "true" : "false";
  await db.setting.upsert({ where: { key: "pricesIncludeTax" }, update: { value: incl }, create: { key: "pricesIncludeTax", value: incl } });
  redirect("/admin/parametres?ok=1");
}

// ---------------------------------------------------------------------------
// Médias (stockage local dans public/uploads ; à remplacer par Supabase Storage / S3 en production)
// ---------------------------------------------------------------------------
const ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4" } as Record<string, string>;

export async function uploadMedia(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || !ALLOWED[file.type] || file.size > 20 * 1024 * 1024) redirect("/admin/medias?error=file");
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ALLOWED[file.type]}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  await db.media.create({
    data: {
      kind: file.type.startsWith("video") ? "VIDEO" : "IMAGE",
      url: `/uploads/${name}`,
      alt: { fr: str(formData, "alt_fr"), en: str(formData, "alt_en") },
      credit: str(formData, "credit") || null,
      license: str(formData, "license") || null,
      sourceUrl: str(formData, "sourceUrl") || null,
      rightsConfirmed: bool(formData, "rightsConfirmed"),
      destinationId: str(formData, "destinationId") || null,
    },
  });
  revalidatePath("/", "layout");
  redirect("/admin/medias?ok=1");
}

export async function updateMedia(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (str(formData, "action") === "delete") {
    const m = await db.media.delete({ where: { id } });
    if (m.url.startsWith("/uploads/")) await unlink(path.join(process.cwd(), "public", m.url)).catch(() => {});
  } else {
    await db.media.update({ where: { id }, data: { rightsConfirmed: bool(formData, "rightsConfirmed") } });
  }
  revalidatePath("/", "layout");
  redirect("/admin/medias");
}
