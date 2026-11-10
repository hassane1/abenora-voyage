import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { db } from "./db";
import type { Locale } from "@/i18n/config";

/**
 * Identité de l'agence : nom, logo, coordonnées, réseaux sociaux, informations légales.
 * Tout est modifiable dans Administration → Identité & coordonnées (table Setting, clés « brand.* »).
 * Les variables d'environnement servent seulement de valeur initiale.
 */
export type Brand = {
  name: string;
  tagline: Partial<Record<Locale, string>>;
  logoUrl: string | null;
  email: string;
  phone: string;
  whatsapp: string; // format international sans « + »
  address: string;
  city: string;
  hours: string;
  socials: { instagram: string; facebook: string; tiktok: string; youtube: string };
  legal: { companyName: string; legalForm: string; rc: string; ice: string; ifNumber: string; patente: string; license: string; capital: string };
  bookingPrefix: string;
  /** taux de conversion INFORMATIFS saisis par l'agence (1 EUR = x MAD) */
  rates: { eur: number | null; usd: number | null; date: string };
};

export const BRAND_KEYS = [
  "name", "tagline.fr", "tagline.en", "tagline.ar", "logoUrl", "email", "phone", "whatsapp", "address", "city", "hours",
  "social.instagram", "social.facebook", "social.tiktok", "social.youtube",
  "legal.companyName", "legal.legalForm", "legal.rc", "legal.ice", "legal.if", "legal.patente", "legal.license", "legal.capital",
  "bookingPrefix", "rate.eur", "rate.usd", "rate.date",
] as const;

export const DEFAULT_BRAND_NAME = "Morocco Évasion Travel";

export const getBrand = cache(async (): Promise<Brand> => {
  await connection();
  const rows = await db.setting.findMany({ where: { key: { startsWith: "brand." } } });
  const s = Object.fromEntries(rows.map((r) => [r.key.slice(6), r.value])) as Record<string, string | undefined>;
  const num = (v?: string) => (v && Number(v) > 0 ? Number(v) : null);
  return {
    name: s.name || process.env.NEXT_PUBLIC_BRAND_NAME || DEFAULT_BRAND_NAME,
    tagline: { fr: s["tagline.fr"] || "", en: s["tagline.en"] || "", ar: s["tagline.ar"] || "" },
    logoUrl: s.logoUrl || null,
    email: s.email || "",
    phone: s.phone || "",
    whatsapp: (s.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
    address: s.address || "",
    city: s.city || "",
    hours: s.hours || "",
    socials: { instagram: s["social.instagram"] || "", facebook: s["social.facebook"] || "", tiktok: s["social.tiktok"] || "", youtube: s["social.youtube"] || "" },
    legal: {
      companyName: s["legal.companyName"] || "",
      legalForm: s["legal.legalForm"] || "",
      rc: s["legal.rc"] || "",
      ice: s["legal.ice"] || "",
      ifNumber: s["legal.if"] || "",
      patente: s["legal.patente"] || "",
      license: s["legal.license"] || "",
      capital: s["legal.capital"] || "",
    },
    bookingPrefix: (s.bookingPrefix || "MET").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "MET",
    rates: { eur: num(s["rate.eur"]), usd: num(s["rate.usd"]), date: s["rate.date"] || "" },
  };
});

/** Version sérialisable transmise aux composants client */
export type PublicBrand = Pick<Brand, "name" | "logoUrl" | "email" | "phone" | "whatsapp" | "address" | "city" | "hours" | "socials" | "rates"> & { tagline: string };

export function publicBrand(b: Brand, locale: Locale): PublicBrand {
  return {
    name: b.name, logoUrl: b.logoUrl, email: b.email, phone: b.phone, whatsapp: b.whatsapp, address: b.address,
    city: b.city, hours: b.hours, socials: b.socials, rates: b.rates, tagline: b.tagline[locale] || "",
  };
}
