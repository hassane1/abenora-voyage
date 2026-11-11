"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/security";
import { citiesConfigSchema, destConfigSchema, TIER_KEYS } from "@/lib/composer-engine";

const back = (q: string) => redirect(`/admin/configurateur?${q}`);
const num = (fd: FormData, k: string) => {
  const v = Number(String(fd.get(k) ?? "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
};

/** tarifs et durées d'une destination (formulaire simple) */
export async function saveComposerPrices(formData: FormData) {
  const admin = await requireAdmin("catalog.write");
  const slug = String(formData.get("slug") ?? "");
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) back("error=1");
  const row = await db.setting.findUnique({ where: { key: `composer:${slug}` } });
  const cur = row ? destConfigSchema.safeParse(JSON.parse(row.value)) : null;
  if (!cur?.success) back("error=1");
  const cfg = cur!.data!;
  for (const l of cfg.lodging) l.nightMad = num(formData, `lodging:${l.key}`) ?? l.nightMad;
  for (const o of cfg.options) o.priceMad = num(formData, `option:${o.code}`) ?? o.priceMad;
  if (cfg.flight) {
    cfg.flight.baseMad = num(formData, "flight:base") ?? cfg.flight.baseMad;
    cfg.flight.extraNonCasaMad = num(formData, "flight:extra") ?? cfg.flight.extraNonCasaMad;
  }
  const min = num(formData, "dur:min");
  const max = num(formData, "dur:max");
  const def = num(formData, "dur:default");
  if (min !== null && max !== null && def !== null && min <= def && def <= max) cfg.durations = { min, max, default: def };
  const parsed = destConfigSchema.safeParse(cfg);
  if (!parsed.success) back(`error=1&d=${slug}`);
  await db.setting.update({ where: { key: `composer:${slug}` }, data: { value: JSON.stringify(parsed.data) } });
  await audit(admin.email, "COMPOSER_PRICES", slug);
  revalidatePath("/", "layout");
  back(`ok=1&d=${slug}`);
}

/** édition avancée : programme complet d'une destination (JSON validé) */
export async function saveComposerJson(formData: FormData) {
  const admin = await requireAdmin("catalog.write");
  const slug = String(formData.get("slug") ?? "");
  const key = slug === "cities" ? "composer:cities" : `composer:${slug}`;
  if (slug !== "cities" && !/^[a-z0-9-]{2,80}$/.test(slug)) back("error=1");
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("json") ?? ""));
  } catch {
    back(`error=json&d=${slug}`);
  }
  const parsed = slug === "cities" ? citiesConfigSchema.safeParse(raw) : destConfigSchema.safeParse(raw);
  if (!parsed.success) back(`error=json&d=${slug}&msg=${encodeURIComponent(parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} : ${i.message}`).join(" | "))}`);
  await db.setting.upsert({ where: { key }, update: { value: JSON.stringify(parsed.data) }, create: { key, value: JSON.stringify(parsed.data) } });
  await audit(admin.email, "COMPOSER_JSON", slug);
  revalidatePath("/", "layout");
  back(`ok=1&d=${slug}`);
}

/** libellés des trois gammes d'hébergement (communs à toutes les destinations) */
export async function saveComposerTiers(formData: FormData) {
  const admin = await requireAdmin("catalog.write");
  const row = await db.setting.findUnique({ where: { key: "composer:cities" } });
  const cur = row ? citiesConfigSchema.safeParse(JSON.parse(row.value)) : null;
  if (!cur?.success) back("error=1");
  const cfg = cur!.data!;
  for (const k of TIER_KEYS) for (const l of ["fr", "en", "ar"] as const) {
    const v = String(formData.get(`${k}:${l}`) ?? "").trim().slice(0, 40);
    if (v) cfg.tiers[k][l] = v;
  }
  const pack = num(formData, "packDiscountPercent");
  if (pack !== null && pack >= 0 && pack <= 50) cfg.packDiscountPercent = Math.round(pack);
  await db.setting.update({ where: { key: "composer:cities" }, data: { value: JSON.stringify(citiesConfigSchema.parse(cfg)) } });
  await audit(admin.email, "COMPOSER_TIERS", "composer:cities");
  revalidatePath("/", "layout");
  back("ok=1");
}
