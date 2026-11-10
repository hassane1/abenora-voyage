export const site = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Rimal",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
  osrmUrl: process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org",
};

/** Lien WhatsApp avec message prérempli, ou null si le numéro n'est pas configuré */
export function whatsappLink(message: string) {
  if (!site.whatsapp) return null;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
