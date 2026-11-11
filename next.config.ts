import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dossier de compilation configurable (permet une 2e compilation de production sans toucher à .next)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // pas d’en-tête « X-Powered-By: Next.js » (empreinte technique inutile)
  poweredByHeader: false,
  // images servies en AVIF puis WebP par next/image
  images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 2678400 },
  // better-sqlite3 est un module natif : on le laisse hors du bundle serveur
  serverExternalPackages: ["better-sqlite3"],
  // pas d'indicateur « N » de développement en bas de page (captures, vidéos de démo)
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
