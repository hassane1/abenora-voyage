import "server-only";
import path from "node:path";

/** Documents de voyage : stockés hors du dossier public (servis par /api/documents/[id] après contrôle d'accès) */
export const DOCS_DIR = path.join(process.cwd(), "storage", "documents");

/**
 * Contrôle des fichiers téléversés par leur contenu réel (« magic bytes ») et non par l'extension
 * ou le type MIME envoyé par le navigateur (falsifiables). SVG et HTML sont refusés (scripts possibles).
 */
export function sniffImage(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

export function sniffDocument(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return { ext: "pdf", mime: "application/pdf" };
  const img = sniffImage(buf);
  if (img) return { ext: img, mime: img === "jpg" ? "image/jpeg" : `image/${img}` };
  return null;
}

export function sniffVideo(buf: Buffer): "mp4" | null {
  // conteneur ISO BMFF : « ftyp » à l'octet 4
  return buf.length > 12 && buf.subarray(4, 8).toString("ascii") === "ftyp" ? "mp4" : null;
}

/**
 * Suppression des métadonnées d'image (EXIF : position GPS, appareil, auteur…) sans ré-encodage.
 * JPEG : segments APP1..APP15 et COM retirés (APP0/JFIF conservé). PNG : blocs tEXt, zTXt, iTXt, eXIf retirés.
 * WebP : bloc EXIF/XMP retiré.
 */
export function stripImageMetadata(buf: Buffer, ext: string): Buffer {
  try {
    if (ext === "jpg") return stripJpeg(buf);
    if (ext === "png") return stripPng(buf);
    if (ext === "webp") return stripWebp(buf);
  } catch {
    /* structure inattendue : fichier conservé tel quel (déjà validé par sa signature) */
  }
  return buf;
}

function stripJpeg(buf: Buffer): Buffer {
  const parts: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) return buf;
    const marker = buf[i + 1];
    if (marker === 0xda) {
      parts.push(buf.subarray(i));
      return Buffer.concat(parts);
    }
    const len = buf.readUInt16BE(i + 2);
    const isMeta = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMeta) parts.push(buf.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  return buf;
}

function stripPng(buf: Buffer): Buffer {
  const parts: Buffer[] = [buf.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.subarray(i + 4, i + 8).toString("latin1");
    if (!["tEXt", "zTXt", "iTXt", "eXIf"].includes(type)) parts.push(buf.subarray(i, i + 12 + len));
    i += 12 + len;
    if (type === "IEND") break;
  }
  return Buffer.concat(parts);
}

function stripWebp(buf: Buffer): Buffer {
  const parts: Buffer[] = [];
  let i = 12;
  while (i + 8 <= buf.length) {
    const type = buf.subarray(i, i + 4).toString("latin1");
    const len = buf.readUInt32LE(i + 4);
    const total = 8 + len + (len % 2);
    if (type !== "EXIF" && type !== "XMP ") parts.push(buf.subarray(i, i + total));
    i += total;
  }
  const body = Buffer.concat(parts);
  const header = Buffer.from(buf.subarray(0, 12));
  header.writeUInt32LE(body.length + 4, 4);
  // drapeaux EXIF/XMP de l'en-tête VP8X remis à zéro si présent
  if (body.subarray(0, 4).toString("latin1") === "VP8X") body[8] &= ~0x0c;
  return Buffer.concat([header, body]);
}
