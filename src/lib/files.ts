import "server-only";

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
