/**
 * Emplacements génériques de photos (étiquette « slot:<clé> » posée dans Administration → Médias).
 * S'y ajoutent destination:<slug>, circuit:<slug> et activity:<slug>.
 * Une carte de circuit sans photo propre reprend celle de sa destination.
 */
export const MEDIA_SLOTS = [
  { key: "homeHero", label: "Accueil : hero (1re image ; vide = visuel de marque)" },
  { key: "homeHeroAlt", label: "Accueil : hero (2e image du diaporama)" },
  { key: "hero", label: "Pages destination : photo de présentation" },
  { key: "heroAlt", label: "Page Circuits : bannière ; bas des pages destination" },
  { key: "omra", label: "Accueil : fond du bloc Omra & Hajj" },
  { key: "dunes", label: "Dunes (Merzouga, galerie, conseils)" },
  { key: "merzouga", label: "Page Destinations : bannière" },
  { key: "camel", label: "Page Activités : bannière" },
  { key: "camp", label: "Bivouac (Merzouga, sur-mesure, conseils)" },
  { key: "campLuxe", label: "Campement de luxe (Merzouga)" },
  { key: "contact", label: "Page Contact : bannière" },
  { key: "tea", label: "Thé / art de vivre (conseils ; secours de la bannière Contact)" },
  { key: "valley", label: "Vallée du Sud (services, comparateur)" },
  { key: "palm", label: "Palmeraie (page Conseils)" },
  { key: "aitbenhaddou", label: "Aït-Ben-Haddou (page Voyages Maroc)" },
  { key: "about", label: "Page À propos : bannière" },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ key: `engagement-${n}`, label: `Accueil : engagements, vignette ${n}` })),
  { key: "aitGuide", label: "Page À propos : bannière de secours (si « about » est vide)" },
  { key: "aitPalm", label: "Page Avis : bannière" },
] as const;

export const MEDIA_SLOT_KEYS = MEDIA_SLOTS.map((s) => s.key);
