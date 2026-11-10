"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkPassword, hashPassword, openSession, requireAdmin } from "@/lib/auth";
import { audit, decrypt, encrypt, newTotpSecret, passwordProblem, verifyTotp } from "@/lib/security";
import { BRAND_KEYS } from "@/lib/brand";
import { isRole } from "@/lib/rbac";
import { LEGAL_SLUGS } from "@/lib/content";
import { sniffImage } from "@/lib/files";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";

async function setSetting(key: string, value: string) {
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

// ---------------------------------------------------------------------------
// Sécurité du compte : MFA (TOTP) et mot de passe
// ---------------------------------------------------------------------------
export async function startMfaSetup() {
  const admin = await requireAdmin(undefined, { allowWithoutMfa: true });
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (user.mfaEnabled) redirect("/admin/securite");
  await db.adminUser.update({ where: { id: admin.id }, data: { mfaSecret: encrypt(newTotpSecret()) } });
  redirect("/admin/securite?setup=1");
}

export async function confirmMfaSetup(formData: FormData) {
  const admin = await requireAdmin(undefined, { allowWithoutMfa: true });
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!user.mfaSecret || user.mfaEnabled) redirect("/admin/securite");
  if (!verifyTotp(decrypt(user.mfaSecret), str(formData, "code"))) redirect("/admin/securite?setup=1&error=code");
  await db.adminUser.update({ where: { id: admin.id }, data: { mfaEnabled: true } });
  await openSession(admin.id, true); // la session courante devient « MFA validée »
  await audit(admin.email, "MFA_ENABLED", admin.id);
  redirect("/admin/securite?ok=mfa");
}

export async function changeOwnPassword(formData: FormData) {
  const admin = await requireAdmin();
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  const next = str(formData, "next");
  if (!(await checkPassword(str(formData, "current"), user.passwordHash))) redirect("/admin/securite?error=current");
  if (passwordProblem(next, user.email) || next !== str(formData, "confirm")) redirect("/admin/securite?error=weak");
  await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } });
  await audit(admin.email, "PASSWORD_CHANGED", admin.id);
  redirect("/admin/securite?ok=password");
}

// ---------------------------------------------------------------------------
// Équipe et rôles
// ---------------------------------------------------------------------------
export async function createAdminUser(formData: FormData) {
  const admin = await requireAdmin("users.manage");
  const email = str(formData, "email").toLowerCase();
  const role = str(formData, "role");
  const password = str(formData, "password");
  if (!z.string().email().safeParse(email).success || !isRole(role) || passwordProblem(password, email)) redirect("/admin/utilisateurs?error=1");
  if (await db.adminUser.findUnique({ where: { email } })) redirect("/admin/utilisateurs?error=exists");
  await db.adminUser.create({ data: { email, name: str(formData, "name") || email, role, passwordHash: await hashPassword(password) } });
  await audit(admin.email, "USER_CREATED", email, { role });
  redirect("/admin/utilisateurs?ok=1");
}

export async function updateAdminUser(formData: FormData) {
  const admin = await requireAdmin("users.manage");
  const id = str(formData, "id");
  const role = str(formData, "role");
  const action = str(formData, "action");
  if (id === admin.id && action !== "save") redirect("/admin/utilisateurs?error=self");
  const target = await db.adminUser.findUniqueOrThrow({ where: { id } });
  if (action === "reset-mfa") {
    await db.adminUser.update({ where: { id }, data: { mfaEnabled: false, mfaSecret: null } });
    await audit(admin.email, "USER_MFA_RESET", target.email);
  } else {
    if (!isRole(role)) redirect("/admin/utilisateurs?error=1");
    const active = id === admin.id ? true : bool(formData, "active");
    // au moins un administrateur actif doit subsister
    if ((role !== "ADMIN" || !active) && target.role === "ADMIN") {
      const others = await db.adminUser.count({ where: { role: "ADMIN", active: true, id: { not: id } } });
      if (others === 0) redirect("/admin/utilisateurs?error=lastadmin");
    }
    await db.adminUser.update({ where: { id }, data: { role, active, name: str(formData, "name") || target.name } });
    await audit(admin.email, "USER_UPDATED", target.email, { role, active });
  }
  redirect("/admin/utilisateurs?ok=1");
}

// ---------------------------------------------------------------------------
// Identité & coordonnées
// ---------------------------------------------------------------------------
export async function saveBrand(formData: FormData) {
  const admin = await requireAdmin("settings.write");
  for (const k of BRAND_KEYS) {
    if (k === "logoUrl") continue;
    let v = str(formData, k).slice(0, 500);
    if (k.startsWith("social.") && v && !/^https:\/\/[^\s"'<>]+$/.test(v)) v = ""; // liens https uniquement
    if (k === "whatsapp") v = v.replace(/\D/g, "");
    if (k === "email" && v && !z.string().email().safeParse(v).success) v = "";
    if (k.startsWith("rate.") && k !== "rate.date" && v && !(Number(v) > 0 && Number(v) < 1000)) v = "";
    await setSetting(`brand.${k}`, v);
  }
  // logo : PNG / JPEG / WebP / SVG refusé (risque XSS) — vérification du contenu réel, 1 Mo max
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = sniffImage(buf);
    if (!ext || buf.length > 1024 * 1024) redirect("/admin/identite?error=logo");
    const name = `logo-${Date.now()}-${randomBytes(3).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "brand");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf);
    await setSetting("brand.logoUrl", `/uploads/brand/${name}`);
  }
  if (bool(formData, "removeLogo")) await setSetting("brand.logoUrl", "");
  await audit(admin.email, "BRAND_UPDATE");
  revalidatePath("/", "layout");
  redirect("/admin/identite?ok=1");
}

// ---------------------------------------------------------------------------
// Contenus : textes d'accueil, FAQ générale, bannières
// ---------------------------------------------------------------------------
export async function saveHomeContent(formData: FormData) {
  const admin = await requireAdmin("content.write");
  for (const l of ["fr", "en", "ar"]) {
    await setSetting(`content.home.heroTitle.${l}`, str(formData, `heroTitle_${l}`).slice(0, 140));
    await setSetting(`content.home.heroSubtitle.${l}`, str(formData, `heroSubtitle_${l}`).slice(0, 400));
  }
  const video = str(formData, "heroVideo");
  await setSetting("content.home.heroVideo", /^\/uploads\/[\w./-]+\.mp4$/.test(video) ? video : "");
  await audit(admin.email, "CONTENT_HOME");
  revalidatePath("/", "layout");
  redirect("/admin/contenus?ok=1");
}

/** FAQ : une entrée par bloc « Q: … / R: … » (une langue par champ) */
export async function saveFaq(formData: FormData) {
  const admin = await requireAdmin("content.write");
  const parse = (txt: string) =>
    txt
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean)
      .map((b) => {
        const m = b.match(/^Q\s*:\s*([\s\S]+?)\n\s*R\s*:\s*([\s\S]+)$/i);
        return m ? { q: m[1].trim(), a: m[2].trim() } : null;
      })
      .filter((x): x is { q: string; a: string } => !!x);
  const fr = parse(str(formData, "faq_fr"));
  const en = parse(str(formData, "faq_en"));
  const ar = parse(str(formData, "faq_ar"));
  const items = fr.map((it, i) => ({ q: { fr: it.q, en: en[i]?.q ?? "", ar: ar[i]?.q ?? "" }, a: { fr: it.a, en: en[i]?.a ?? "", ar: ar[i]?.a ?? "" } }));
  await setSetting("content.faq", JSON.stringify(items));
  await audit(admin.email, "CONTENT_FAQ", null, { n: items.length });
  revalidatePath("/", "layout");
  redirect("/admin/contenus?ok=faq#faq");
}

export async function saveBanner(formData: FormData) {
  const admin = await requireAdmin("marketing.write");
  const id = str(formData, "id");
  if (str(formData, "action") === "delete" && id) {
    await db.banner.delete({ where: { id } });
  } else {
    const link = str(formData, "linkUrl");
    const data = {
      text: { fr: str(formData, "text_fr"), en: str(formData, "text_en"), ar: str(formData, "text_ar") },
      linkLabel: { fr: str(formData, "label_fr"), en: str(formData, "label_en"), ar: str(formData, "label_ar") },
      linkUrl: /^\/[\w\-/?=&#.]*$/.test(link) ? link : null, // liens internes uniquement
      startsAt: str(formData, "startsAt") ? new Date(`${str(formData, "startsAt")}T00:00:00Z`) : null,
      endsAt: str(formData, "endsAt") ? new Date(`${str(formData, "endsAt")}T23:59:59Z`) : null,
      active: bool(formData, "active"),
    };
    if (!data.text.fr) redirect("/admin/contenus?error=1#bannieres");
    if (id) await db.banner.update({ where: { id }, data });
    else await db.banner.create({ data });
  }
  await audit(admin.email, "BANNER_SAVE", id || "new");
  revalidatePath("/", "layout");
  redirect("/admin/contenus?ok=banner#bannieres");
}

export async function savePage(formData: FormData) {
  const admin = await requireAdmin("content.write");
  const slug = str(formData, "slug");
  if (!(LEGAL_SLUGS as readonly string[]).includes(slug)) redirect("/admin/pages?error=1");
  const data = {
    title: { fr: str(formData, "title_fr"), en: str(formData, "title_en"), ar: str(formData, "title_ar") },
    body: { fr: str(formData, "body_fr"), en: str(formData, "body_en"), ar: str(formData, "body_ar") },
    validated: bool(formData, "validated"),
    published: true,
  };
  await db.page.upsert({ where: { slug }, update: data, create: { slug, ...data } });
  await audit(admin.email, "PAGE_UPDATE", slug, { validated: data.validated });
  revalidatePath("/", "layout");
  redirect(`/admin/pages?ok=1&p=${slug}`);
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
export async function deleteSubscriber(formData: FormData) {
  const admin = await requireAdmin("marketing.write");
  const s = await db.newsletterSubscriber.delete({ where: { id: str(formData, "id") } });
  await audit(admin.email, "NEWSLETTER_DELETE", s.email);
  redirect("/admin/newsletter?ok=1");
}

// ---------------------------------------------------------------------------
// Destinations : création et fiche complète
// ---------------------------------------------------------------------------
export async function createDestination(formData: FormData) {
  const admin = await requireAdmin("catalog.write");
  const fr = str(formData, "name_fr");
  const slug = fr.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug || (await db.destination.findUnique({ where: { slug } }))) redirect("/admin/destinations?error=1");
  const lat = Number(str(formData, "latitude"));
  const lng = Number(str(formData, "longitude"));
  const d = await db.destination.create({
    data: {
      slug, name: { fr, en: str(formData, "name_en"), ar: str(formData, "name_ar") }, tagline: { fr: "" }, description: { fr: "" },
      scope: str(formData, "scope") === "INTERNATIONAL" ? "INTERNATIONAL" : "NATIONAL",
      country: str(formData, "scope") === "INTERNATIONAL" ? str(formData, "country") || "—" : "Maroc",
      region: str(formData, "region") || "—", latitude: Number.isFinite(lat) ? lat : 31.8, longitude: Number.isFinite(lng) ? lng : -7.1,
      sections: {}, tips: { fr: [] }, faq: [], published: false, sortOrder: 100,
    },
  });
  await audit(admin.email, "DESTINATION_CREATE", d.slug);
  redirect(`/admin/destinations?ok=1#${d.slug}`);
}

export async function updateDestinationDetails(formData: FormData) {
  const admin = await requireAdmin("catalog.write");
  const id = str(formData, "id");
  const d = await db.destination.findUniqueOrThrow({ where: { id } });
  const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
  const faqParse = (txt: string) =>
    txt.split(/\n\s*\n/).map((b) => b.trim().match(/^Q\s*:\s*([\s\S]+?)\n\s*R\s*:\s*([\s\S]+)$/i)).filter(Boolean).map((m) => ({ q: m![1].trim(), a: m![2].trim() }));
  const fr = faqParse(str(formData, "faq_fr"));
  const en = faqParse(str(formData, "faq_en"));
  const lat = Number(str(formData, "latitude"));
  const lng = Number(str(formData, "longitude"));
  await db.destination.update({
    where: { id },
    data: {
      region: str(formData, "region") || d.region,
      scope: str(formData, "scope") === "INTERNATIONAL" ? "INTERNATIONAL" : "NATIONAL",
      country: str(formData, "scope") === "INTERNATIONAL" ? str(formData, "country") || d.country : "Maroc",
      latitude: Number.isFinite(lat) && lat !== 0 ? lat : d.latitude,
      longitude: Number.isFinite(lng) && lng !== 0 ? lng : d.longitude,
      sortOrder: Number(str(formData, "sortOrder")) || d.sortOrder,
      tips: { fr: lines(str(formData, "tips_fr")), en: lines(str(formData, "tips_en")), ar: lines(str(formData, "tips_ar")) },
      faq: fr.length ? fr.map((it, i) => ({ q: { fr: it.q, en: en[i]?.q ?? "" }, a: { fr: it.a, en: en[i]?.a ?? "" } })) : (d.faq as object),
    },
  });
  await audit(admin.email, "DESTINATION_UPDATE", d.slug);
  revalidatePath("/", "layout");
  redirect(`/admin/destinations?ok=1#${d.slug}`);
}

// ---------------------------------------------------------------------------
// Circuits : duplication (copie non publiée, sans départs ni réservations)
// ---------------------------------------------------------------------------
export async function duplicateCircuit(formData: FormData) {
  const admin = await requireAdmin("catalog.write");
  const src = await db.circuit.findUniqueOrThrow({ where: { id: str(formData, "id") }, include: { itinerary: true, stops: true, options: true } });
  const { id: _id, slug, createdAt: _c, updatedAt: _u, itinerary, stops, options, ...rest } = src;
  void _id;
  void _c;
  void _u;
  const title = { ...(src.title as Record<string, string>) };
  title.fr = `${title.fr ?? ""} (copie)`;
  const copy = await db.circuit.create({
    data: {
      ...rest,
      title,
      slug: `${slug}-copie-${randomBytes(2).toString("hex")}`,
      published: false,
      transport: rest.transport as object, accommodation: rest.accommodation as object, meals: rest.meals as object, included: rest.included as object,
      excluded: rest.excluded as object, optionalActivities: rest.optionalActivities as object, cancellationPolicy: rest.cancellationPolicy as object,
      warnings: rest.warnings as object, summary: rest.summary as object,
      itinerary: { create: itinerary.map((d) => ({ dayNumber: d.dayNumber, title: d.title as object, description: d.description as object, items: d.items as object })) },
      stops: { create: stops.map((s) => ({ order: s.order, dayNumber: s.dayNumber, name: s.name, latitude: s.latitude, longitude: s.longitude, kind: s.kind, modeToNext: s.modeToNext, description: s.description as object })) },
      options: {
        create: options.map((o) => ({ code: o.code, group: o.group, label: o.label as object, description: o.description as object, priceMad: o.priceMad, unit: o.unit, exclusiveGroup: o.exclusiveGroup, isDefault: o.isDefault, priceStatus: o.priceStatus, published: o.published, sortOrder: o.sortOrder })),
      },
    },
  });
  await audit(admin.email, "CIRCUIT_DUPLICATE", src.slug, { copy: copy.slug });
  redirect(`/admin/circuits/${copy.id}?ok=created`);
}
