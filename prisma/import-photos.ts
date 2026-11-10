/**
 * Import des photos fournies avec l'autorisation du client (supermoroccotravels.com).
 * Usage : npx tsx prisma/import-photos.ts
 * Les fichiers sont copiés dans public/uploads/smt/ et enregistrés dans la table Media
 * avec leur source, la mention d'autorisation et des tags utilisés par le site.
 */
import "dotenv/config";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });
const BASE = "https://supermoroccotravels.com/wp-content/uploads/";
const LICENSE = "Autorisation déclarée par le client le 09/11/2026 (accord écrit à conserver)";
const CREDIT = "Super Morocco Travels";

const photos: { file: string; tags: string; fr: string; en: string; dest: string | null }[] = [
  { file: "2024/03/Design-sans-titre-8-1.webp", tags: "hero,dunes,merzouga", fr: "Voyageurs contemplant les dunes de l'Erg Chebbi", en: "Travellers gazing over the Erg Chebbi dunes", dest: "merzouga" },
  // ⚠ vue en bord de mer (pas Merzouga) : ne pas l'associer au désert
  { file: "2024/03/Design-sans-titre-11-1.webp", tags: "sunset,lounge,coast", fr: "Coin détente au coucher du soleil", en: "Lounge corner at sunset", dest: null },
  { file: "2024/03/Merzouga.png", tags: "caravan,camel,dunes,merzouga", fr: "Caravane de dromadaires dans les dunes de Merzouga", en: "Camel caravan in the Merzouga dunes", dest: "merzouga" },
  { file: "2021/09/5.png", tags: "camel,merzouga", fr: "Dromadaires au repos, prêts pour la balade", en: "Camels resting before the ride", dest: "merzouga" },
  { file: "2021/09/5-6.webp", tags: "camp,luxe,sunset,merzouga", fr: "Bivouac au coucher du soleil", en: "Desert camp at sunset", dest: "merzouga" },
  { file: "2021/09/4-6.webp", tags: "dunes,merzouga", fr: "Ondulations de sable dans l'erg", en: "Sand ripples in the erg", dest: "merzouga" },
  { file: "2021/09/4.png", tags: "tea,food,sunset", fr: "Thé à la menthe au coucher du soleil", en: "Mint tea at sunset", dest: "merzouga" },
  { file: "2021/09/5-5.webp", tags: "oasis,palm,valley", fr: "Palmeraie au pied des montagnes", en: "Palm grove at the foot of the mountains", dest: null },
  { file: "2021/09/6-4.webp", tags: "valley,dades,carpets", fr: "Vallée et tapis berbères sur la route du Sud", en: "Valley and Berber rugs on the southern road", dest: null },
  { file: "2024/03/Super-morocco-travels-10.jpg", tags: "aitbenhaddou,kasbah", fr: "Le ksar d'Aït Ben Haddou", en: "The ksar of Aït Ben Haddou", dest: null },
  { file: "2021/09/2-5.webp", tags: "aitbenhaddou,kasbah", fr: "Aït Ben Haddou se reflétant dans l'oued", en: "Aït Ben Haddou reflected in the river", dest: null },
  { file: "2021/09/3-5.webp", tags: "aitbenhaddou,palm", fr: "Aït Ben Haddou et sa palmeraie", en: "Aït Ben Haddou and its palm grove", dest: null },
  { file: "2021/09/4-5.webp", tags: "aitbenhaddou,guide", fr: "Guide devant la kasbah", en: "Guide in front of the kasbah", dest: null },
  { file: "2021/09/2-6.webp", tags: "aitbenhaddou,kasbah", fr: "Vue sur les maisons en pisé du ksar", en: "View over the ksar's earthen houses", dest: null },
];

async function main() {
  const dir = path.join(process.cwd(), "public", "uploads", "smt");
  await mkdir(dir, { recursive: true });
  const merzouga = await db.destination.findUnique({ where: { slug: "merzouga" } });
  for (const p of photos) {
    const name = p.file.replace(/\//g, "-");
    const target = path.join(dir, name);
    const url = `/uploads/smt/${name}`;
    try {
      await access(target);
    } catch {
      const res = await fetch(BASE + p.file, { headers: { "User-Agent": "Mozilla/5.0 (site import, authorised)" } });
      if (!res.ok) {
        console.warn(`✘ ${p.file} : HTTP ${res.status}`);
        continue;
      }
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
    }
    const existing = await db.media.findFirst({ where: { url } });
    const data = {
      kind: "IMAGE",
      url,
      alt: { fr: p.fr, en: p.en },
      credit: CREDIT,
      license: LICENSE,
      sourceUrl: BASE + p.file,
      rightsConfirmed: true,
      tags: p.tags,
      destinationId: p.dest === "merzouga" ? merzouga?.id ?? null : null,
    };
    if (existing) await db.media.update({ where: { id: existing.id }, data });
    else await db.media.create({ data });
    console.log(`✔ ${name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
