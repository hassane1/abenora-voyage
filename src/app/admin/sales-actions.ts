"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/security";
import { DOCS_DIR, sniffDocument } from "@/lib/files";
import { convertQuoteToBooking, newQuoteNumber, newQuoteToken, parseQuoteLines, quoteTotal, sendQuoteEmail } from "@/lib/quotes";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mail";
import { site } from "@/lib/site";
import { getV2 } from "@/i18n/v2";
import { hasLocale } from "@/i18n/config";

const str = (f: FormData, k: string, max = 20000) => String(f.get(k) ?? "").trim().slice(0, max);

// ---------------------------------------------------------------------------
// Devis sur mesure
// ---------------------------------------------------------------------------
export async function saveQuote(formData: FormData) {
  const admin = await requireAdmin("quotes.write");
  const requestId = str(formData, "requestId");
  const id = str(formData, "id");
  const lines = parseQuoteLines(str(formData, "lines"));
  const validUntil = new Date(`${str(formData, "validUntil") || new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10)}T23:59:59Z`);
  const start = str(formData, "startDate");
  const data = {
    title: str(formData, "title", 200) || "Voyage sur mesure",
    program: str(formData, "program"),
    lines,
    totalMad: quoteTotal(lines),
    depositPercent: Math.max(0, Math.min(100, Number(str(formData, "depositPercent")) || 30)),
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(start) ? new Date(`${start}T00:00:00Z`) : null,
    travelers: Math.max(1, Math.min(100, Number(str(formData, "travelers")) || 1)),
    validUntil,
    conditions: str(formData, "conditions", 4000),
  };
  let quoteId = id;
  if (id) {
    const q = await db.quote.findUniqueOrThrow({ where: { id } });
    if (q.status !== "DRAFT" && q.status !== "SENT") redirect(`/admin/demandes/${requestId}?error=locked`);
    await db.quote.update({ where: { id }, data: { ...data, status: "DRAFT" } }); // toute modification repasse en brouillon
  } else {
    const q = await db.quote.create({ data: { ...data, number: await newQuoteNumber(), accessToken: newQuoteToken(), requestId, createdBy: admin.email } });
    quoteId = q.id;
  }
  await db.quoteRequest.update({ where: { id: requestId }, data: { status: "IN_PROGRESS" } });
  if (str(formData, "send") === "1") {
    const q = await db.quote.findUniqueOrThrow({ where: { id: quoteId } });
    if (q.lines && (q.lines as unknown[]).length && q.totalMad > 0) {
      await db.quote.update({ where: { id: quoteId }, data: { status: "SENT", sentAt: new Date() } });
      await sendQuoteEmail(quoteId);
      await audit(admin.email, "QUOTE_SENT", q.number, { total: q.totalMad });
      redirect(`/admin/demandes/${requestId}?ok=sent`);
    }
    redirect(`/admin/demandes/${requestId}?error=empty`);
  }
  redirect(`/admin/demandes/${requestId}?ok=saved`);
}

export async function convertQuote(formData: FormData) {
  const admin = await requireAdmin("quotes.write");
  const id = str(formData, "id");
  const q = await db.quote.findUniqueOrThrow({ where: { id } });
  let bookingId: string;
  try {
    bookingId = (await convertQuoteToBooking(id, admin.email)).id;
  } catch (e) {
    redirect(`/admin/demandes/${q.requestId}?error=${encodeURIComponent(e instanceof Error ? e.message : "conversion")}`);
  }
  await audit(admin.email, "QUOTE_CONVERTED", q.number, { bookingId });
  redirect(`/admin/reservations/${bookingId}?ok=fromquote`);
}

// ---------------------------------------------------------------------------
// Messagerie et documents de dossier
// ---------------------------------------------------------------------------
export async function replyMessage(formData: FormData) {
  const admin = await requireAdmin("bookings.write");
  const bookingId = str(formData, "bookingId");
  const body = str(formData, "body", 4000);
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });
  if (body) {
    await db.message.create({ data: { bookingId, customerId: b.customerId, fromAgency: true, author: admin.name || admin.email, body } });
    await db.message.updateMany({ where: { bookingId, fromAgency: false, readAt: null }, data: { readAt: new Date() } });
    const locale = hasLocale(b.locale) ? b.locale : "fr";
    const v = getV2(locale);
    const link = b.customerId ? `${site.url}/${locale}/compte/dossier/${b.reference}#messages` : `${site.url}/${locale}/espace-client?ref=${b.reference}&token=${b.accessToken}#messages`;
    await sendMail({
      to: b.email,
      bookingId,
      subject: `${v.account.messages} — ${b.reference}`,
      html: await emailLayout(v.account.messages, `<p style="white-space:pre-wrap">${escapeHtml(body)}</p><p><a href="${link}">${escapeHtml(v.account.open)} ${b.reference}</a></p>`, locale === "ar" ? "rtl" : "ltr"),
    });
  }
  redirect(`${str(formData, "back") === "inbox" ? "/admin/messages" : `/admin/reservations/${bookingId}`}?ok=msg#messages`);
}

const DOC_KINDS = new Set(["VOUCHER", "INVOICE", "RECEIPT", "PROGRAM", "OTHER"]);

export async function uploadBookingDocument(formData: FormData) {
  const admin = await requireAdmin("bookings.write");
  const bookingId = str(formData, "bookingId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) redirect(`/admin/reservations/${bookingId}?error=file#documents`);
  const buf = Buffer.from(await file.arrayBuffer());
  const sniff = sniffDocument(buf); // PDF / JPEG / PNG / WebP uniquement, vérifiés sur le contenu
  if (!sniff) redirect(`/admin/reservations/${bookingId}?error=file#documents`);
  await mkdir(DOCS_DIR, { recursive: true });
  const fileName = `${Date.now()}-${randomBytes(8).toString("hex")}.${sniff.ext}`;
  await writeFile(path.join(DOCS_DIR, fileName), buf);
  const kind = DOC_KINDS.has(str(formData, "kind")) ? str(formData, "kind") : "OTHER";
  await db.bookingDocument.create({ data: { bookingId, kind, title: str(formData, "title", 120) || file.name.slice(0, 120), fileName, mimeType: sniff.mime, size: buf.length, uploadedBy: admin.email } });
  await audit(admin.email, "DOCUMENT_UPLOAD", bookingId, { kind, size: buf.length });
  redirect(`/admin/reservations/${bookingId}?ok=doc#documents`);
}

export async function deleteBookingDocument(formData: FormData) {
  const admin = await requireAdmin("bookings.write");
  const d = await db.bookingDocument.delete({ where: { id: str(formData, "id") } });
  await audit(admin.email, "DOCUMENT_DELETE", d.bookingId, { title: d.title });
  redirect(`/admin/reservations/${d.bookingId}?ok=doc#documents`);
}

/** Clôture d'une demande d'annulation sans annuler (ex. client rassuré, report de date) */
export async function dismissCancelRequest(formData: FormData) {
  const admin = await requireAdmin("bookings.write");
  const id = str(formData, "id");
  await db.booking.update({ where: { id }, data: { cancelRequestedAt: null } });
  await db.bookingEvent.create({ data: { bookingId: id, type: "NOTE", actor: admin.email, note: `Demande d'annulation close sans annulation : ${str(formData, "note", 500) || "—"}` } });
  await audit(admin.email, "CANCEL_REQUEST_DISMISSED", id);
  revalidatePath(`/admin/reservations/${id}`);
  redirect(`/admin/reservations/${id}?ok=1`);
}
