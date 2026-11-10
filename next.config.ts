import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pas d’en-tête « X-Powered-By: Next.js » (empreinte technique inutile)
  poweredByHeader: false,
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
