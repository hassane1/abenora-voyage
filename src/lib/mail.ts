import "server-only";
import nodemailer from "nodemailer";
import { db } from "./db";
import { getBrand } from "./brand";

/**
 * Envoi d'e-mails.
 * - Si SMTP_HOST est configuré : envoi réel via SMTP (statut SENT ou FAILED).
 * - Sinon : l'e-mail est uniquement journalisé (statut LOGGED), consultable dans
 *   Administration → Notifications. Il n'est PAS envoyé.
 */
export async function sendMail(opts: { to: string; subject: string; html: string; bookingId?: string }) {
  const host = process.env.SMTP_HOST;
  let status: "SENT" | "LOGGED" | "FAILED" = "LOGGED";
  let error: string | null = null;

  if (host) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      });
      await transporter.sendMail({ from: process.env.MAIL_FROM, to: opts.to, subject: opts.subject, html: opts.html });
      status = "SENT";
    } catch (e) {
      status = "FAILED";
      error = e instanceof Error ? e.message : String(e);
      console.error("[mail] échec d'envoi", error);
    }
  } else {
    console.info(`[mail] SMTP non configuré — e-mail journalisé : « ${opts.subject} » → ${opts.to}`);
  }

  return db.notification.create({
    data: { to: opts.to, subject: opts.subject, body: opts.html, status, error, bookingId: opts.bookingId ?? null },
  });
}

export async function emailLayout(title: string, body: string, dir: "ltr" | "rtl" = "ltr") {
  const b = await getBrand();
  const brand = escapeHtml(b.name);
  const contact = [b.phone, b.email].filter(Boolean).map(escapeHtml).join(" · ");
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:#FAF7F1;font-family:Arial,Helvetica,sans-serif;color:#0B1A2E">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#0B1A2E;color:#D4A845;padding:24px 32px;font-size:22px;letter-spacing:2px">${brand.toUpperCase()}</td></tr>
  <tr><td style="padding:32px"><h1 style="font-size:20px;margin:0 0 16px">${title}</h1>${body}</td></tr>
  <tr><td style="padding:16px 32px;background:#FAF7F1;font-size:12px;color:#6b7280">${brand} — Maroc${contact ? `<br/>${contact}` : ""}</td></tr>
  </table></td></tr></table></body></html>`;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
