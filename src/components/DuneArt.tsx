/**
 * Illustration vectorielle des dunes de l'Erg Chebbi (créée pour le site, libre de droits).
 * Elle remplace les photos tant que la photothèque (droits vérifiés) n'est pas constituée.
 */
type Variant = "sunset" | "dawn" | "night" | "noon" | "dusk";

const palettes: Record<Variant, { sky: [string, string, string]; sun: string; dunes: [string, string, string, string]; stars?: boolean }> = {
  sunset: { sky: ["#14283f", "#b96543", "#ecbf7a"], sun: "#f6d58e", dunes: ["#c98a46", "#b5733a", "#9a5a2c", "#7a4422"] },
  dawn: { sky: ["#3c4f74", "#d99a84", "#f3d3a6"], sun: "#fff1cf", dunes: ["#e0b27a", "#cf9a5f", "#b98049", "#9a6537"] },
  night: { sky: ["#070f1c", "#14283f", "#2a4466"], sun: "#f1ede1", dunes: ["#2f3f57", "#26354b", "#1d2a3d", "#141f2f"], stars: true },
  noon: { sky: ["#6f9cc4", "#a9c7df", "#efe2c8"], sun: "#fff9e6", dunes: ["#e8c08a", "#dcab6c", "#cc9655", "#b57e40"] },
  dusk: { sky: ["#1c2a4a", "#6b3f5c", "#d27a54"], sun: "#f3b37a", dunes: ["#a66a3f", "#8d5533", "#734428", "#55311d"] },
};

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export default function DuneArt({
  variant = "sunset",
  seed = 7,
  className = "",
  caravan = false,
  title,
}: {
  variant?: Variant;
  seed?: number;
  className?: string;
  caravan?: boolean;
  title?: string;
}) {
  const p = palettes[variant];
  const r = rng(seed * 97 + 13);
  const id = `d${variant}${seed}`;
  const sunX = 300 + r() * 600;
  const sunY = variant === "noon" ? 120 : variant === "night" ? 140 : 330 + r() * 60;

  const ridge = (base: number, amp: number) => {
    const pts: string[] = [`M0 ${base}`];
    let x = 0;
    while (x < 1200) {
      const w = 180 + r() * 260;
      const peak = base - amp * (0.4 + r() * 0.8);
      pts.push(`Q ${x + w * 0.55} ${peak} ${Math.min(1200, x + w)} ${base - r() * amp * 0.3}`);
      x += w;
    }
    pts.push("L1200 800 L0 800 Z");
    return pts.join(" ");
  };

  const stars = p.stars
    ? Array.from({ length: 90 }, () => ({ x: r() * 1200, y: r() * 420, o: 0.3 + r() * 0.7, s: r() < 0.1 ? 1.8 : 0.9 }))
    : [];

  return (
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={title ?? "Illustration des dunes du Sahara"}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="0.55" stopColor={p.sky[1]} />
          <stop offset="1" stopColor={p.sky[2]} />
        </linearGradient>
        <radialGradient id={`${id}sun`}>
          <stop offset="0" stopColor={p.sun} stopOpacity="1" />
          <stop offset="0.25" stopColor={p.sun} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        {p.dunes.map((c, i) => (
          <linearGradient key={i} id={`${id}d${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c} />
            <stop offset="1" stopColor={p.dunes[Math.min(3, i + 1)]} />
          </linearGradient>
        ))}
      </defs>
      <rect width="1200" height="800" fill={`url(#${id}sky)`} />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} />
      ))}
      <circle cx={sunX} cy={sunY} r="220" fill={`url(#${id}sun)`} />
      <circle cx={sunX} cy={sunY} r={variant === "night" ? 26 : 42} fill={p.sun} opacity="0.95" />
      <path d={ridge(470, 120)} fill={`url(#${id}d0)`} opacity="0.85" />
      <path d={ridge(540, 150)} fill={`url(#${id}d1)`} />
      {caravan && (
        <g fill={p.dunes[3]} opacity="0.9" transform={`translate(${380 + r() * 200} 500) scale(0.9)`}>
          {[0, 46, 92].map((dx) => (
            <g key={dx} transform={`translate(${dx} ${dx * 0.12})`}>
              <path d="M0 0 q6 -14 14 -14 q4 -10 12 -6 q10 -6 14 6 l2 10 q4 0 6 -10 l4 0 q0 12 -6 18 l0 14 l-3 0 l-1 -12 l-14 0 l-1 12 l-3 0 l-1 -12 q-6 0 -10 -4 l-1 16 l-3 0 l-1 -16 q-6 -2 -8 -6 z" />
              <rect x="20" y="-28" width="4" height="12" rx="2" />
              <circle cx="22" cy="-30" r="3.5" />
            </g>
          ))}
        </g>
      )}
      <path d={ridge(620, 170)} fill={`url(#${id}d2)`} />
      <path d={ridge(720, 140)} fill={`url(#${id}d3)`} />
    </svg>
  );
}
