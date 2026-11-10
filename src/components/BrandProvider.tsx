"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicBrand } from "@/lib/brand";
import { waLink } from "@/lib/site";

const BrandContext = createContext<PublicBrand | null>(null);

export function BrandProvider({ brand, children }: { brand: PublicBrand; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): PublicBrand {
  const b = useContext(BrandContext);
  if (!b) throw new Error("useBrand() hors de <BrandProvider>");
  return b;
}

/** Lien WhatsApp de l'agence (null si non configuré) */
export function useWhatsApp() {
  const b = useBrand();
  return (message: string) => waLink(b.whatsapp, message);
}
