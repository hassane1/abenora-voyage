import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { getBrand } from "./brand";
import { addDays } from "./format";
import { emailLayout, escapeHtml, sendMail } from "./mail";
import { site } from "./site";
import { randomToken } from "./security";
import type { PriceResult } from "./pricing";
import { hasLocale, type Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";

export type QuoteLine = { label: string; qty: number; unitMad: number };

export const quoteTotal = (lines: QuoteLine[]) => lines.reduce((s, l) => s + Math.round(l.qty * l.unitMad), 0);

export function parseQuoteLines(txt: string): QuoteLine[] {
  // une ligne par prestation : « Libellé | quantité | prix unitaire MAD »
  return txt
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((p) => p[0])
    .map(([label, qty, unit]) => ({ label: label.slice(0, 200), qty: Math.max(0, Math.min(999, Number(qty) || 1)), unitMad: Math.max(0, Math.min(10_000_000, Math.round(Number(unit) || 0))) }))
    .slice(0, 50);
}

export async function newQuoteNumber() {
  const d = new Date();
  const ym = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    const n = `DV-${ym}-${Array.from(randomBytes(4), (b) => alphabet[b % alphabet.length]).join("")}`;
    if (!(await db.quote.findUnique({ where: { number: n } }))) return n;
  }
}

export const newQuoteToken = () => randomToken(24);

export function quoteUrl(q: { number: string; accessToken: string }, locale: string) {
  return `${site.url}/${locale}/devis/${q.number}?token=${q.accessToken}`;
}

export async function sendQuoteEmail(quoteId: string) {
  const q = await db.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { request: true } });
  const locale: Locale = hasLocale(q.request.locale) ? q.request.locale : "fr";
  const v = getV2(locale);
  const brand = await getBrand();
  await sendMail({
    to: q.request.email,
    subject: `${v.quote.title} ${q.number} — ${brand.name}`,
    html: await emailLayout(
      v.quote.title,
      `<p>${escapeHtml(q.request.name)},</p><p><strong>${escapeHtml(q.title)}</strong></p>
       <p>${v.quote.total} : <strong>${q.totalMad.toLocaleString("fr-FR")} MAD</strong> · ${v.quote.validUntil} ${q.validUntil.toISOString().slice(0, 10)}</p>
       <p><a href="${quoteUrl(q, locale)}" style="display:inline-block;background:#8C6420;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">${escapeHtml(v.quote.title)}</a></p>
       <p style="font-size:12px;color:#6b7280">${escapeHtml(v.quote.notBinding)}</p>`,
      locale === "ar" ? "rtl" : "ltr",
    ),
  });
}

/**
 * Transforme un devis ACCEPTÉ en réservation « En attente » (l'agence la confirme ensuite comme les autres).
 * Le dossier est rattaché à un circuit technique non publié « Voyage sur mesure » de la destination,
 * avec un départ dédié à la date du devis : la capacité est bloquée de façon atomique.
 */
export async function convertQuoteToBooking(quoteId: string, actor: string) {
  const q = await db.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { request: true } });
  if (q.status !== "ACCEPTED" || q.bookingId) throw new Error("Le devis doit être accepté et non encore transformé.");
  if (!q.startDate) throw new Error("Renseignez la date de début du devis avant de le transformer.");
  const dest =
    (q.request.destination && (await db.destination.findUnique({ where: { slug: q.request.destination } }))) ||
    // demande sans destination du catalogue (international, Omra…) : destination technique non publiée
    (await db.destination.upsert({
      where: { slug: "voyages-sur-mesure" },
      update: {},
      create: {
        slug: "voyages-sur-mesure", name: { fr: "Voyages sur mesure", en: "Tailor-made trips" }, tagline: { fr: "" }, description: { fr: "Destination technique des devis hors catalogue (non publiée)." },
        region: "—", scope: "INTERNATIONAL", country: "—", latitude: 31.8, longitude: -7.1, sections: {}, tips: { fr: [] }, faq: [], published: false, sortOrder: 999,
      },
    }));
  const days = Math.max(1, q.request.durationDays ?? 1);
  const slug = `sur-mesure-${dest.slug}`;
  const circuit =
    (await db.circuit.findUnique({ where: { slug } })) ??
    (await db.circuit.create({
      data: {
        slug, destinationId: dest.id, title: { fr: `Voyage sur mesure — ${(dest.name as Record<string, string>).fr}`, en: "Tailor-made trip" }, summary: { fr: "Circuit technique pour les devis sur mesure (non publié)." },
        days, nights: days - 1, desertNights: 0, startPoint: "—", endPoint: "—", transport: { fr: "" }, accommodation: { fr: "" }, meals: { fr: "" },
        included: { fr: [] }, excluded: { fr: [] }, optionalActivities: { fr: [] }, cancellationPolicy: { fr: "Conditions précisées dans le devis." }, warnings: { fr: [] },
        priceAdultMad: null, priceStatus: "ON_REQUEST", published: false, defaultCapacity: 0, sortOrder: 999,
      },
    }));
  const brand = await getBrand();
  const travelers = Math.max(1, q.travelers);
  const lines = (q.lines as QuoteLine[]).map((l, i) => ({ key: `q${i}`, label: l.label, detail: `${l.qty} × ${l.unitMad} MAD`, amount: Math.round(l.qty * l.unitMad) }));
  const deposit = Math.round((q.totalMad * q.depositPercent) / 100);
  const pricing: PriceResult & { quoteNumber: string } = {
    onRequest: false, isDemo: false, lines, discounts: [], subtotal: q.totalMad, total: q.totalMad, taxIncluded: 0, taxRatePercent: 0,
    deposit, balance: q.totalMad - deposit, travelers, quoteNumber: q.number,
  };
  const [firstName, ...rest] = q.request.name.split(" ");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const ymd = q.startDate.toISOString().slice(2, 10).replace(/-/g, "");

  return db.$transaction(async (tx) => {
    // départ dédié : on augmente la capacité du nombre de voyageurs puis on bloque les places (même logique que les autres réservations)
    const dep = await tx.departure.upsert({
      where: { circuitId_date: { circuitId: circuit.id, date: q.startDate! } },
      update: { capacity: { increment: travelers } },
      create: { circuitId: circuit.id, date: q.startDate!, capacity: travelers, isDemo: false, status: "OPEN" },
    });
    const n = await tx.$executeRaw`UPDATE "Departure" SET "seatsHeld" = "seatsHeld" + ${travelers} WHERE "id" = ${dep.id} AND "seatsHeld" + ${travelers} <= "capacity"`;
    if (n !== 1) throw new Error("Capacité insuffisante");
    let reference = "";
    do reference = `${brand.bookingPrefix}-${ymd}-${Array.from(randomBytes(4), (b) => alphabet[b % alphabet.length]).join("")}`;
    while (await tx.booking.findUnique({ where: { reference } }));
    const customer = await tx.customer.findUnique({ where: { email: q.request.email.toLowerCase() } });
    const booking = await tx.booking.create({
      data: {
        reference, accessToken: randomBytes(24).toString("hex"), circuitId: circuit.id, departureId: dep.id,
        startDate: q.startDate!, endDate: addDays(q.startDate!, Math.max(0, days - 1)), adults: travelers, children: 0, childAges: [],
        privateTour: true, options: [], pricing, totalMad: q.totalMad, depositMad: deposit, pricesAreDemo: false, status: "PENDING",
        firstName: firstName || q.request.name, lastName: rest.join(" ") || "—", email: q.request.email.toLowerCase(), phone: q.request.phone ?? "—",
        country: "—", departureCity: q.request.departureCity, comments: `Issu du devis ${q.number}`, locale: q.request.locale, consentAt: q.respondedAt ?? new Date(),
        quoteId: q.id, customerId: customer?.emailVerifiedAt ? customer.id : null,
        events: { create: { type: "CREATED", toStatus: "PENDING", actor, note: `Créée depuis le devis ${q.number} accepté par le client` } },
      },
    });
    await tx.quote.update({ where: { id: q.id }, data: { status: "CONVERTED", bookingId: booking.id } });
    await tx.quoteRequest.update({ where: { id: q.requestId }, data: { status: "CLOSED" } });
    return booking;
  });
}
