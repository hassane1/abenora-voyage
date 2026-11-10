/**
 * Contenus par défaut de la version « agence » — NON destructif : ne crée que ce qui manque,
 * ne remplace jamais un contenu modifié dans l'administration.
 * Utilisé par le seed et par `npm run db:upgrade` (mise à niveau d'une base existante).
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import { generalFaq, legalPages } from "./seed-data/legal";

const OLD_MERZOUGA_TAGLINE = "Merzouga : une aventure inoubliable au cœur du Sahara";

export async function applyDefaults(db: PrismaClient) {
  for (const p of legalPages) {
    const exists = await db.page.findUnique({ where: { slug: p.slug } });
    if (!exists) await db.page.create({ data: { slug: p.slug, title: p.title, body: p.body, validated: false, published: true } });
  }
  if (!(await db.setting.findUnique({ where: { key: "content.faq" } }))) {
    await db.setting.create({ data: { key: "content.faq", value: JSON.stringify(generalFaq) } });
  }
  if (!(await db.setting.findUnique({ where: { key: "brand.name" } }))) {
    await db.setting.create({ data: { key: "brand.name", value: process.env.NEXT_PUBLIC_BRAND_NAME && process.env.NEXT_PUBLIC_BRAND_NAME !== "Rimal" ? process.env.NEXT_PUBLIC_BRAND_NAME : "Morocco Évasion Travel" } });
  }
  if (!(await db.setting.findUnique({ where: { key: "brand.bookingPrefix" } }))) {
    await db.setting.create({ data: { key: "brand.bookingPrefix", value: "MET" } });
  }
  // titre de la page Merzouga demandé dans le cahier des charges (seulement si l'ancien titre n'a pas été modifié)
  const m = await db.destination.findUnique({ where: { slug: "merzouga" } });
  if (m && (m.tagline as Record<string, string>).fr === OLD_MERZOUGA_TAGLINE) {
    await db.destination.update({
      where: { id: m.id },
      data: { tagline: { fr: "Merzouga, vivez la magie du Sahara.", en: "Merzouga, experience the magic of the Sahara.", ar: "مرزوكة، عِش سحر الصحراء." } },
    });
  }
}
