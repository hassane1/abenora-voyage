/**
 * Visuel de marque Benani Travel (créé pour le site, libre de droits) : arcades marocaines et étoile à huit branches
 * sur les couleurs de l'agence. Il remplace les photos tant qu'aucune photo avec droits confirmés n'est attribuée.
 * Couleurs uniquement via les variables du système de design.
 */
type Variant = "sunset" | "dawn" | "night" | "noon" | "dusk";

const themes: Record<Variant, { from: string; to: string; line: string; lineOpacity: number }> = {
  sunset: { from: "var(--color-night)", to: "var(--color-night-soft)", line: "var(--color-gold)", lineOpacity: 0.55 },
  dawn: { from: "var(--color-gold-light)", to: "var(--color-ivory)", line: "var(--color-gold-deep)", lineOpacity: 0.35 },
  night: { from: "var(--color-night)", to: "var(--color-night)", line: "var(--color-gold-light)", lineOpacity: 0.35 },
  noon: { from: "var(--color-emerald)", to: "var(--color-emerald-deep)", line: "var(--color-gold-light)", lineOpacity: 0.45 },
  dusk: { from: "var(--color-night-soft)", to: "var(--color-emerald-deep)", line: "var(--color-gold)", lineOpacity: 0.45 },
};

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** arc outrepassé (« fer à cheval ») de largeur w, posé en (x, base) */
function arch(x: number, base: number, w: number, h: number) {
  const r = w / 2;
  const top = base - h;
  return `M${x} ${base} V${top + r} A${r} ${r} 0 1 1 ${x + w} ${top + r} V${base}`;
}

export default function BrandArt({ variant = "sunset", seed = 7, className = "", title }: { variant?: Variant; seed?: number; className?: string; title?: string; caravan?: boolean }) {
  const th = themes[variant] ?? themes.sunset;
  const r = rng(seed + 1);
  const id = `ba-${variant}-${seed}`;
  const count = 3 + Math.floor(r() * 2);
  const w = 800 / count;
  const arches = Array.from({ length: count }, (_, i) => ({ x: i * w + w * 0.18, w: w * 0.64, h: 260 + r() * 140 }));
  const star = { x: 120 + r() * 560, y: 90 + r() * 60 };
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i;
    const rad = i % 2 === 0 ? 34 : 16;
    return `${star.x + Math.cos(a) * rad},${star.y + Math.sin(a) * rad}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className={`block ${className}`} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: th.from }} />
          <stop offset="1" style={{ stopColor: th.to }} />
        </linearGradient>
        <pattern id={`${id}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 4l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" style={{ fill: "none", stroke: th.line }} strokeWidth="0.8" opacity="0.35" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill={`url(#${id}-bg)`} />
      <rect width="800" height="600" fill={`url(#${id}-grid)`} opacity="0.5" />
      <polygon points={pts} style={{ fill: th.line }} opacity={th.lineOpacity} />
      {arches.map((a, i) => (
        <g key={i} style={{ stroke: th.line }} fill="none" opacity={th.lineOpacity}>
          <path d={arch(a.x, 600, a.w, a.h)} strokeWidth="3" />
          <path d={arch(a.x + 14, 600, a.w - 28, a.h - 22)} strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  );
}
