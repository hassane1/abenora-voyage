"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mail";
import { hasLocale, type Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { getDictionary } from "@/i18n/get-dictionary";
import { clientIp, rateLimit } from "@/lib/security";
import { site } from "@/lib/site";
import { getComposerDestination } from "@/lib/composer-data";
import { buildProgram, choiceSchema, computePrice, onSiteKey } from "@/lib/composer-engine";

const optInt = (min: number, max: number) => z.coerce.number().int().min(min).max(max).optional().or(z.literal("").transform(() => undefined));
const optStr = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const schema = z.object({
  kind: z.enum(["SUR_MESURE", "CONTACT"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: optStr(40),
  destination: optStr(80),
  departureCity: optStr(80),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  durationDays: optInt(1, 60),
  budgetMad: optInt(0, 1_000_000),
  travelers: optInt(1, 100),
  comfort: z.enum(["STANDARD", "CONFORT", "LUXE"]).optional().or(z.literal("")),
  transport: z.enum(["PRIVE", "PARTAGE", "PROPRE", "AUTRE"]).optional().or(z.literal("")),
  interests: z.string().max(500).optional(),
  needs: optStr(1000),
  message: z.string().trim().min(5).max(4000),
  locale: z.string().max(5),
  consent: z.literal("on"),
  website: z.string().max(0).optional(), // champ piège anti-robot
  composer: z.string().max(2000).optional(), // choix du configurateur (JSON), recalculé côté serveur
});

export type FormState = { ok: boolean; error?: string; reference?: string } | null;

function newReference() {
  const d = new Date();
  const ym = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `SM-${ym}-${Array.from(randomBytes(4), (b) => alphabet[b % alphabet.length]).join("")}`;
}

/** Enregistre une demande de contact ou de voyage sur mesure (dossier numéroté), accuse réception et notifie l'agence */
export async function submitRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const interests = formData.getAll("interests").map(String).join(", ");
  const parsed = schema.safeParse({ ...raw, interests });
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const lim = await rateLimit(`request:${await clientIp()}`, 8, 3600);
  if (!lim.ok) return { ok: false, error: "RATE_LIMIT" };
  const { website: _hp, consent: _c, needs, startDate, comfort, transport, composer, ...data } = parsed.data;
  void _hp;
  void _c;
  const locale: Locale = hasLocale(data.locale) ? data.locale : "fr";
  let message = needs ? `${data.message}\n\n— ${getV2("fr").tailorForm.needs} : ${needs}` : data.message;
  // configurateur : programme et estimation DÉMO recalculés ici, à partir des données en base
  // (le récapitulatif envoyé par le navigateur ne fait pas foi)
  if (composer) {
    let raw: unknown = null;
    try {
      raw = JSON.parse(composer);
    } catch {
      raw = null;
    }
    const choice = choiceSchema.safeParse(raw);
    const dest = choice.success ? await getComposerDestination(choice.data.destination, "fr") : null;
    const price = choice.success && dest ? computePrice(dest.cities, dest.config, dest.pos, choice.data, "fr") : null;
    if (!choice.success || !dest || !price) return { ok: false, error: "INVALID" };
    const program = buildProgram(dest.cities, dest.config, dest.pos, choice.data, "fr");
    const cityName = choice.data.city === onSiteKey ? "Sur place" : (dest.cities.cities.find((c) => c.key === choice.data.city)?.name.fr ?? choice.data.city);
    data.destination = dest.name;
    data.departureCity = cityName;
    data.durationDays = choice.data.days;
    data.travelers = choice.data.travelers;
    const lodging = dest.config.lodging.find((l) => l.key === choice.data.lodging)?.label.fr ?? choice.data.lodging;
    message += [
      "",
      "",
      "— Programme composé en ligne (tarifs DÉMO) —",
      `Hébergement : ${lodging}`,
      ...program.map((p) => `J${p.day} · ${p.title} : ${p.items.map((i) => i.text).join(" ; ")}`),
      ...price.lines.map((l) => `${l.label} : ${l.amount} MAD/pers.`),
      `Estimation DÉMO : ${price.perPerson} MAD/pers. · ${price.total} MAD pour ${choice.data.travelers} pers.`,
    ].join("\n");
  }
  let reference = newReference();
  while (await db.quoteRequest.findUnique({ where: { reference } })) reference = newReference();
  const req = await db.quoteRequest.create({
    data: {
      ...data,
      message,
      reference,
      phone: data.phone || null,
      destination: data.destination || null,
      departureCity: data.departureCity || null,
      startDate: startDate ? new Date(`${startDate}T00:00:00Z`) : null,
      comfort: comfort || null,
      transport: transport || null,
      interests: data.interests || null,
      consentAt: new Date(),
    },
  });

  // accusé de réception au client
  const v = getV2(locale);
  const t = getDictionary(locale);
  await sendMail({
    to: data.email,
    subject: `${data.kind === "CONTACT" ? t.contact.title : t.tailor.title} — ${reference}`,
    html: await emailLayout(
      data.kind === "CONTACT" ? t.contact.title : t.tailor.title,
      `<p>${escapeHtml(data.name)},</p><p>${escapeHtml(data.kind === "CONTACT" ? t.contact.success : v.tailorForm.sent)}</p><p>${escapeHtml(v.tailorForm.reference)} : <strong>${reference}</strong></p>`,
      locale === "ar" ? "rtl" : "ltr",
    ),
  });

  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) {
    await sendMail({
      to,
      subject: `${data.kind === "CONTACT" ? "Nouveau message" : "Nouvelle demande sur mesure"} ${reference} — ${data.name}`,
      html: await emailLayout(
        data.kind === "CONTACT" ? "Nouveau message de contact" : "Demande de voyage sur mesure",
        `<p><strong>${escapeHtml(data.name)}</strong> — ${escapeHtml(data.email)} ${data.phone ? `— ${escapeHtml(data.phone)}` : ""}</p>
         ${data.durationDays ? `<p>Destination : ${escapeHtml(data.destination ?? "—")} · Durée : ${data.durationDays} jours · Budget : ${data.budgetMad ?? "—"} MAD/pers. · Voyageurs : ${data.travelers ?? "—"}</p>` : ""}
         ${data.interests ? `<p>Intérêts : ${escapeHtml(data.interests)}</p>` : ""}
         <p style="white-space:pre-wrap">${escapeHtml(message)}</p><p><a href="${site.url}/admin/demandes/${req.id}">Ouvrir le dossier ${reference}</a></p>`,
      ),
    });
  }
  return { ok: true, reference };
}
