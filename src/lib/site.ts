/** Configuration technique (non éditable depuis l'admin). L'identité de l'agence est dans src/lib/brand.ts. */
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  osrmUrl: process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org",
};

/** Lien WhatsApp avec message prérempli, ou null si le numéro n'est pas configuré */
export function waLink(number: string | null | undefined, message: string) {
  const n = (number ?? "").replace(/\D/g, "");
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
