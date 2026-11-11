/**
 * Import des photos sous licence libre (Wikimedia Commons : CC0, domaine public, CC BY, CC BY-SA) listées dans
 * prisma/photos-libres.json, puis génération de docs/CREDITS-PHOTOS.md.
 * Usage : npx tsx prisma/import-photos-libres.ts
 *
 * Chaque photo est téléchargée une fois (vignette Commons de 1600 px), réencodée en WebP sans métadonnées
 * (EXIF, GPS) dans public/uploads/libres/, puis enregistrée dans Médias avec l'étiquette « slot:<clé> »,
 * son auteur, sa licence et sa source. L'agence peut ensuite remplacer chaque photo depuis Administration → Médias
 * (téléverser une photo et la placer sur le même emplacement) sans toucher au code.
 */
import "dotenv/config";
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

type Entry = {
  slot: string;
  title: string; // « File:… » sur Wikimedia Commons
  page: string;
  thumb1600?: string;
  localSvg?: string; // illustration originale versionnée dans le dépôt (rendue en WebP)
  localFile?: string; // image déjà préparée et versionnée dans le dépôt (ex. montage), réencodée en WebP
  file?: string; // nom du fichier dans public/uploads/libres (par défaut : dérivé de l'emplacement)
  credit?: string; // crédit affiché (par défaut : « auteur / Wikimedia Commons »)
  author: string;
  license: string;
  licenseUrl: string;
  place: string;
  alt: { fr: string; en: string; ar: string };
};

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });
const UA = { "User-Agent": "TravelSitePhotoImport/1.0 (licensed photo import)" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string): Promise<Buffer> {
  for (let k = 0; k < 6; k++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    await sleep(4000 * (k + 1)); // limitation de débit de Wikimedia : on patiente
  }
  throw new Error(`téléchargement impossible : ${url}`);
}

const fileName = (e: Entry) => e.file ?? `${e.slot.replace(/[^a-zA-Z0-9-]+/g, "-")}.webp`;

async function main() {
  const entries: Entry[] = JSON.parse(await readFile(path.join(process.cwd(), "prisma", "photos-libres.json"), "utf8"));
  const dir = path.join(process.cwd(), "public", "uploads", "libres");
  await mkdir(dir, { recursive: true });
  const destinations = new Map((await db.destination.findMany({ select: { id: true, slug: true } })).map((d) => [d.slug, d.id]));
  let total = 0;
  for (const e of entries) {
    const name = fileName(e);
    const target = path.join(dir, name);
    const url = `/uploads/libres/${name}`;
    try {
      await access(target);
    } catch {
      const local = e.localSvg ?? e.localFile;
      const raw = local ? await readFile(path.join(process.cwd(), local)) : await download(e.thumb1600!);
      // largeur max 1600 px ; sharp ne recopie aucune métadonnée (EXIF, GPS, XMP) sans demande explicite
      const out = await sharp(raw, e.localSvg ? { density: 72 } : {}).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toBuffer();
      await writeFile(target, out);
      if (!local) await sleep(800);
    }
    // emplacement vide : le média reste disponible dans Médias sans être affiché d'office
    const tag = e.slot ? `slot:${e.slot}` : "";
    const destSlug = e.slot.startsWith("destination:") ? e.slot.slice(12) : null;
    const data = {
      kind: "IMAGE",
      url,
      alt: e.alt,
      credit: e.credit ?? (e.localSvg ? e.author : `${e.author} / Wikimedia Commons`),
      license: e.license,
      sourceUrl: e.page || null,
      rightsConfirmed: true,
      tags: tag,
      destinationId: destSlug ? destinations.get(destSlug) ?? null : null,
    };
    const existing = await db.media.findFirst({ where: { url } });
    if (existing) await db.media.update({ where: { id: existing.id }, data });
    else await db.media.create({ data });
    total++;
    console.log(`✔ ${e.slot || "(sans emplacement)"} ← ${e.title}`);
  }

  // registre des crédits (versionné) : fichier, lieu, auteur, source, licence
  const rows = entries.map((e) => `| \`public/uploads/libres/${fileName(e)}\` | ${e.slot ? `\`${e.slot}\`` : "—"} | ${e.place} | ${e.author.replace(/\|/g, "/")} | ${e.localSvg ? `\`${e.localSvg}\`` : `[${e.title.replace(/^File:/, "").replace(/\|/g, "/")}](${e.page})`} | ${e.localSvg ? e.license : `[${e.license}](${e.licenseUrl || e.page})`} |`);
  const md = `# Crédits photos

Photos utilisées sur le site : issues de **Wikimedia Commons** sous une licence qui autorise l'usage commercial
(CC0, domaine public, CC BY, CC BY-SA), ou illustrations originales créées pour Benani Travel (fichier SVG source dans
\`prisma/illustrations/\`). Aucune ne provient d'une autre agence, d'Instagram ou de Google Images.

- Import : \`npx tsx prisma/import-photos-libres.ts\` (liste : \`prisma/photos-libres.json\`).
- Fichiers : redimensionnés à 1600 px de large au maximum, WebP, métadonnées (EXIF, GPS) retirées.
- Attribution : l'auteur, la licence et un lien vers la source sont affichés sous chaque photo dans la page **Galerie**
  du site (et repris dans Administration → Médias). Les photos CC BY-SA ont été recadrées / réencodées : ces adaptations
  restent sous la même licence.
- Remplacement : dans Administration → Médias, téléverser la nouvelle photo et la placer sur le même emplacement ;
  l'ancienne est alors retirée de cet emplacement automatiquement.
- Les cartes de voyages sans photo propre reprennent la photo de leur destination (\`destination:<identifiant>\`).

| Fichier | Emplacement | Lieu | Auteur | Source | Licence |
|---|---|---|---|---|---|
${rows.join("\n")}

${entries.length} photos.
`;
  await mkdir(path.join(process.cwd(), "docs"), { recursive: true });
  await writeFile(path.join(process.cwd(), "docs", "CREDITS-PHOTOS.md"), md);
  console.log(`${total} photos importées ; docs/CREDITS-PHOTOS.md écrit.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
