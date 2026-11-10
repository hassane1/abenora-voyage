/** Jeu d'icônes fines (trait 1.6) cohérent pour tout le site */
const paths: Record<string, string> = {
  heart: "M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.5 4.5c2 0 3.3 1.1 4 2.3h3c.7-1.2 2-2.3 4-2.3 3.5 0 5.3 3.7 3.7 6.9C19 15.6 12 20 12 20z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
  clock: "M12 7v5l3 2M12 21a9 9 0 110-18 9 9 0 010 18z",
  users: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM21 19v-1a4 4 0 00-3-3.9M16 4.1a3 3 0 010 5.8",
  pin: "M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M7 7l10 10M17 7L7 17",
  shield: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z",
  sun: "M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z",
  tent: "M3 20L12 4l9 16M12 4v16M8 20l4-6 4 6",
  camel: "M3 18v-4c0-2 1-3 3-3l2-3c1-1 2-1 3 0l1 2 2-2c1-1 2-1 3 0l1 3h1l1-3 2 1-2 4v5M7 18v-3M11 18v-3M17 18v-3",
  quad: "M6 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8.5 14.5h7M9 9h6l2 3M11 9l1-3h2",
  buggy: "M5.5 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 12l3-5h9l4 5M8 7v5M14 7v5",
  jeep: "M3 15V9l2-3h10l2 3h3v6M6.5 17.5a2 2 0 100-4 2 2 0 000 4zM17.5 17.5a2 2 0 100-4 2 2 0 000 4zM3 9h18",
  board: "M4 18L18 4M7 21l14-14M6 20c-2 0-3-1-3-3",
  hike: "M13 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 22l2-7 3 3v4M12 15l1-6 3 3 3 1M13 9l-4 2-1 4M18 10l1 12",
  drum: "M12 9c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 6v10c0 1.7 3.6 3 8 3s8-1.3 8-3V6",
  market: "M3 9l2-5h14l2 5M3 9h18v2a3 3 0 01-6 0 3 3 0 01-6 0 3 3 0 01-6 0zM5 13v7h14v-7M10 20v-4h4v4",
  tea: "M5 8h11v6a5 5 0 01-5 5h-1a5 5 0 01-5-5zM16 10h2a2 2 0 010 4h-2M9 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3",
  palm: "M12 22V10M12 10c-2-3-6-4-9-3 3 0 6 1 7 4M12 10c2-3 6-4 9-3-3 0-6 1-7 4M12 10c-1-3 0-6 2-8M12 10c1-3 0-6-2-8",
  food: "M4 12h16a8 8 0 01-16 0zM12 4v2M8 5l1 2M16 5l-1 2",
  telescope: "M3 14l12-6 2 4-12 6zM12 16l-2 6M13 16l3 6M17 7l3-1 1 3-3 1",
  sunrise: "M3 18h18M7 18a5 5 0 0110 0M12 3v6M9 6l3-3 3 3M4 13l1.5 1M20 13l-1.5 1",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z",
  sparkle: "M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z",
  whatsapp: "M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-4-1.1zM9 8.5c0 3 2.5 6.5 6.5 6.5l1-1.5-2-1-1 1c-1-.5-2.5-2-3-3l1-1-1-2z",
  car: "M5 16h14M6 16v2M18 16v2M4 16v-4l2-5h12l2 5v4M4 12h16",
  route: "M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a4 4 0 014-4h2M18 9v6a4 4 0 01-4 4h-2",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.5",
  print: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  mail: "M3 6h18v12H3zM3 6l9 7 9-7",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z",
};

export function Icon({ name, className = "h-5 w-5", filled = false }: { name: string; className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name] ?? paths.sparkle} />
    </svg>
  );
}
