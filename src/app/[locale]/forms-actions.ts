"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mail";

const schema = z.object({
  kind: z.enum(["SUR_MESURE", "CONTACT"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  destination: z.string().trim().max(80).optional().or(z.literal("")),
  durationDays: z.coerce.number().int().min(1).max(60).optional().or(z.literal("").transform(() => undefined)),
  budgetMad: z.coerce.number().int().min(0).max(1_000_000).optional().or(z.literal("").transform(() => undefined)),
  travelers: z.coerce.number().int().min(1).max(100).optional().or(z.literal("").transform(() => undefined)),
  interests: z.string().max(500).optional(),
  message: z.string().trim().min(5).max(4000),
  locale: z.string().max(5),
  website: z.string().max(0).optional(), // champ piège anti-robot
});

export type FormState = { ok: boolean; error?: string } | null;

/** Enregistre une demande de contact ou de voyage sur mesure en base et notifie l'agence */
export async function submitRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const interests = formData.getAll("interests").map(String).join(", ");
  const parsed = schema.safeParse({ ...raw, interests });
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { website: _hp, ...data } = parsed.data;
  void _hp;
  const req = await db.quoteRequest.create({ data: { ...data, phone: data.phone || null, destination: data.destination || null, interests: data.interests || null } });
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) {
    await sendMail({
      to,
      subject: `${data.kind === "CONTACT" ? "Nouveau message" : "Nouvelle demande sur mesure"} — ${data.name}`,
      html: await emailLayout(
        data.kind === "CONTACT" ? "Nouveau message de contact" : "Demande de voyage sur mesure",
        `<p><strong>${escapeHtml(data.name)}</strong> — ${escapeHtml(data.email)} ${data.phone ? `— ${escapeHtml(data.phone)}` : ""}</p>
         ${data.durationDays ? `<p>Durée : ${data.durationDays} jours · Budget : ${data.budgetMad ?? "—"} MAD/pers. · Voyageurs : ${data.travelers ?? "—"}</p>` : ""}
         ${data.interests ? `<p>Intérêts : ${escapeHtml(data.interests)}</p>` : ""}
         <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p><p>Réf. interne : ${req.id}</p>`,
      ),
    });
  }
  return { ok: true };
}
