import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { computePrice, defaultLabels, resolveGrid, type PricingLabels, type PricingOption } from "./pricing";
import { getPricingSettings } from "./settings";
import { tr } from "./i18n-content";
import { emailLayout, escapeHtml, sendMail } from "./mail";
import { formatDate, formatMad, addDays } from "./format";
import { hasLocale, localeMeta, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "./site";
import { getBrand } from "./brand";

export const bookingSchema = z.object({
  circuitId: z.string().min(1),
  departureId: z.string().min(1),
  adults: z.number().int().min(1).max(30),
  childAges: z.array(z.number().int().min(0).max(17)).max(20),
  privateTour: z.boolean(),
  optionCodes: z.array(z.string()).max(30),
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
  grid: z.object({ row: z.number().int().min(0).max(50), col: z.string().max(30) }).nullable().optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(6).max(40),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(80),
  departureCity: z.string().trim().max(80).optional().or(z.literal("")),
  specialNeeds: z.string().trim().max(1000).optional().or(z.literal("")),
  comments: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true),
  locale: z.string(),
  website: z.string().max(0).optional(), // champ piège anti-robot (doit rester vide)
});
export type BookingInput = z.infer<typeof bookingSchema>;

export class BookingError extends Error {
  constructor(public code: "INVALID" | "SOLD_OUT" | "NOT_FOUND") {
    super(code);
  }
}

function newReference(prefix: string) {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = Array.from(randomBytes(4), (b) => alphabet[b % alphabet.length]).join("");
  return `${prefix}-${ymd}-${rnd}`;
}

export function labelsFor(locale: Locale): PricingLabels {
  if (locale === "fr") return defaultLabels;
  const t = getDictionary(locale);
  if (locale === "en")
    return {
      adults: t.booking.adults,
      groupPrice: "Group package",
      children: (pct) => `Children 4-11 (${pct}%)`,
      babies: (age) => `Children under ${age} (free)`,
      privateTour: "Private trip supplement",
      family: (pct) => `Family discount (${pct}%)`,
      group: (pct) => `Group discount (${pct}%)`,
      promo: (code) => `Promo code ${code}`,
    };
  return {
    adults: t.booking.adults,
    groupPrice: "سعر المجموعة",
    children: (pct) => `الأطفال 4-11 سنة (${pct}٪)`,
    babies: (age) => `الأطفال دون ${age} سنوات (مجاناً)`,
    privateTour: "إضافة الرحلة الخاصة",
    family: (pct) => `تخفيض عائلي (${pct}٪)`,
    group: (pct) => `تخفيض المجموعة (${pct}٪)`,
    promo: (code) => `الرمز الترويجي ${code}`,
  };
}

export async function findPromo(code: string | undefined | null, travelers: number) {
  if (!code) return null;
  const promo = await db.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!promo || !promo.active) return null;
  if (promo.validFrom && promo.validFrom > now) return null;
  if (promo.validTo && promo.validTo < now) return null;
  if (travelers < promo.minPeople) return null;
  return { code: promo.code, percentOff: promo.percentOff };
}

/** Charge circuit, options et réglages puis calcule le prix (fait foi côté serveur) */
export async function quote(input: Pick<BookingInput, "circuitId" | "adults" | "childAges" | "privateTour" | "optionCodes" | "promoCode" | "grid">, locale: Locale) {
  const circuit = await db.circuit.findFirst({ where: { id: input.circuitId, published: true } });
  if (!circuit) throw new BookingError("NOT_FOUND");
  const opts = await db.bookingOption.findMany({
    where: { code: { in: input.optionCodes }, published: true, OR: [{ circuitId: null }, { circuitId: circuit.id }] },
    orderBy: { sortOrder: "asc" },
  });
  // une seule option par groupe exclusif
  const seen = new Set<string>();
  const options: PricingOption[] = [];
  for (const o of opts) {
    if (o.exclusiveGroup) {
      if (seen.has(o.exclusiveGroup)) continue;
      seen.add(o.exclusiveGroup);
    }
    options.push({ code: o.code, label: tr(o.label, locale), priceMad: o.priceMad, unit: o.unit, group: o.group, priceStatus: o.priceStatus });
  }
  const settings = await getPricingSettings();
  const promo = await findPromo(input.promoCode, input.adults + input.childAges.length);
  const priceGrid = resolveGrid(circuit.priceGrid, (v) => tr<string>(v, locale, ""));
  const price = computePrice({ ...circuit, priceGrid }, { adults: input.adults, childAges: input.childAges, privateTour: priceGrid ? false : input.privateTour, options, promo, grid: input.grid ?? null }, settings, labelsFor(locale));
  return { circuit, options, price, promo, settings };
}

export async function createBooking(raw: unknown, opts: { customerId?: string | null } = {}) {
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) throw new BookingError("INVALID");
  const input = parsed.data;
  const locale: Locale = hasLocale(input.locale) ? input.locale : "fr";
  const travelers = input.adults + input.childAges.length;

  const { circuit, options, price, promo } = await quote(input, locale);
  // programme à grille : le choix hébergement / chambre est obligatoire et doit exister dans la grille
  if (circuit.priceGrid && price.onRequest) throw new BookingError("INVALID");
  const departure = await db.departure.findFirst({ where: { id: input.departureId, circuitId: circuit.id } });
  if (!departure) throw new BookingError("NOT_FOUND");
  const prefix = (await getBrand()).bookingPrefix;

  const booking = await db.$transaction(async (tx) => {
    // Réservation atomique des places : échoue si la capacité serait dépassée (anti double réservation)
    const updated = await tx.$executeRaw`UPDATE "Departure" SET "seatsHeld" = "seatsHeld" + ${travelers}
      WHERE "id" = ${departure.id} AND "status" = 'OPEN' AND "seatsHeld" + ${travelers} <= "capacity"`;
    if (updated !== 1) throw new BookingError("SOLD_OUT");

    let reference = newReference(prefix);
    while (await tx.booking.findUnique({ where: { reference } })) reference = newReference(prefix);

    return tx.booking.create({
      data: {
        reference,
        accessToken: randomBytes(24).toString("hex"),
        circuitId: circuit.id,
        departureId: departure.id,
        startDate: departure.date,
        endDate: addDays(departure.date, circuit.nights),
        adults: input.adults,
        children: input.childAges.length,
        childAges: input.childAges,
        privateTour: input.privateTour,
        options: options.map((o) => ({ code: o.code, label: o.label, priceMad: o.priceMad, unit: o.unit, priceStatus: o.priceStatus })),
        pricing: { ...price, priceStatusAtBooking: circuit.priceStatus, departureIsDemo: departure.isDemo },
        totalMad: price.total,
        depositMad: price.deposit,
        pricesAreDemo: price.isDemo || departure.isDemo,
        promoCode: promo?.code ?? null,
        status: "PENDING",
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        phone: input.phone,
        whatsapp: input.whatsapp || null,
        country: input.country,
        departureCity: input.departureCity || null,
        specialNeeds: input.specialNeeds || null,
        comments: input.comments || null,
        locale,
        consentAt: new Date(),
        customerId: opts.customerId ?? null,
        events: { create: { type: "CREATED", toStatus: "PENDING", actor: "client", note: "Demande de réservation en ligne" } },
      },
    });
  });

  await notifyBookingCreated(booking.id);
  return booking;
}

// ---------------------------------------------------------------------------
// Changements de statut (administration)
// ---------------------------------------------------------------------------
const HOLDS_SEATS = new Set(["PENDING", "CONFIRMED"]);

export async function changeBookingStatus(bookingId: string, toStatus: "CONFIRMED" | "REJECTED" | "CANCELLED" | "PENDING", actor: string, note?: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new BookingError("NOT_FOUND");
  if (booking.status === toStatus) return booking;
  const travelers = booking.adults + booking.children;

  const updated = await db.$transaction(async (tx) => {
    const wasHolding = HOLDS_SEATS.has(booking.status);
    const willHold = HOLDS_SEATS.has(toStatus);
    if (wasHolding && !willHold) {
      await tx.$executeRaw`UPDATE "Departure" SET "seatsHeld" = CASE WHEN "seatsHeld" >= ${travelers} THEN "seatsHeld" - ${travelers} ELSE 0 END WHERE "id" = ${booking.departureId}`;
    } else if (!wasHolding && willHold) {
      const n = await tx.$executeRaw`UPDATE "Departure" SET "seatsHeld" = "seatsHeld" + ${travelers}
        WHERE "id" = ${booking.departureId} AND "seatsHeld" + ${travelers} <= "capacity"`;
      if (n !== 1) throw new BookingError("SOLD_OUT");
    }
    const b = await tx.booking.update({ where: { id: bookingId }, data: { status: toStatus } });
    await tx.bookingEvent.create({ data: { bookingId, type: "STATUS_CHANGED", fromStatus: booking.status, toStatus, actor, note: note || null } });
    return b;
  });

  if (toStatus !== "PENDING") await notifyStatusChanged(updated.id, note);
  return updated;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
async function loadForMail(bookingId: string) {
  return db.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { circuit: { include: { destination: true } } } });
}

function bookingSummaryHtml(b: Awaited<ReturnType<typeof loadForMail>>, locale: Locale) {
  const t = getDictionary(locale);
  const rows: [string, string][] = [
    [t.booking.reference, `<strong>${b.reference}</strong>`],
    [t.booking.status, t.status[b.status]],
    [t.nav.circuits, `${escapeHtml(tr(b.circuit.title, locale))} — ${escapeHtml(tr(b.circuit.destination.name, locale))}`],
    [t.booking.chooseDate, `${formatDate(b.startDate, locale)} → ${formatDate(b.endDate, locale)}`],
    [t.home.searchTravelers, `${b.adults} + ${b.children}`],
    [t.booking.total, formatMad(b.totalMad, locale) + (b.pricesAreDemo ? ` (${t.common.demoPrice})` : "")],
  ];
  return `<table cellpadding="6" style="border-collapse:collapse;width:100%;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="color:#6b7280;border-bottom:1px solid #eee">${k}</td><td style="border-bottom:1px solid #eee">${v}</td></tr>`)
    .join("")}</table>`;
}

async function notifyBookingCreated(bookingId: string) {
  const b = await loadForMail(bookingId);
  const locale = (hasLocale(b.locale) ? b.locale : "fr") as Locale;
  const t = getDictionary(locale);
  const link = `${site.url}/${locale}/espace-client?ref=${b.reference}&token=${b.accessToken}`;

  await sendMail({
    to: b.email,
    bookingId: b.id,
    subject: `${t.booking.successTitle} — ${b.reference}`,
    html: await emailLayout(
      t.booking.successTitle,
      `<p>${escapeHtml(b.firstName)},</p><p>${t.booking.successText}</p>${bookingSummaryHtml(b, locale)}
       ${b.pricesAreDemo ? `<p style="font-size:12px;color:#8C6420">${t.common.demoPriceLong}</p>` : ""}
       <p><a href="${link}" style="display:inline-block;background:#8C6420;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">${t.booking.viewFile}</a></p>`,
      localeMeta[locale].dir,
    ),
  });

  const adminTo = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminTo) {
    await sendMail({
      to: adminTo,
      bookingId: b.id,
      subject: `Nouvelle demande de réservation ${b.reference}`,
      html: await emailLayout(
        `Nouvelle demande ${b.reference}`,
        `<p>${escapeHtml(b.firstName)} ${escapeHtml(b.lastName)} — ${escapeHtml(b.email)} — ${escapeHtml(b.phone)}</p>${bookingSummaryHtml(b, "fr")}
         <p><a href="${site.url}/admin/reservations/${b.id}">Ouvrir le dossier dans l'administration</a></p>`,
      ),
    });
  }
}

async function notifyStatusChanged(bookingId: string, note?: string) {
  const b = await loadForMail(bookingId);
  const locale = (hasLocale(b.locale) ? b.locale : "fr") as Locale;
  const t = getDictionary(locale);
  const link = `${site.url}/${locale}/espace-client?ref=${b.reference}&token=${b.accessToken}`;
  await sendMail({
    to: b.email,
    bookingId: b.id,
    subject: `${b.reference} — ${t.status[b.status]}`,
    html: await emailLayout(
      t.status[b.status],
      `<p>${escapeHtml(b.firstName)},</p>${note ? `<p>${escapeHtml(note)}</p>` : ""}${bookingSummaryHtml(b, locale)}
       <p><a href="${link}">${t.booking.viewFile}</a></p>`,
      localeMeta[locale].dir,
    ),
  });
}
