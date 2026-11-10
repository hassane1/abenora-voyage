import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/customer";
import { adminMfaOk, getAdmin } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { DOCS_DIR } from "@/lib/files";
import { timingSafeEqual } from "node:crypto";

const sameToken = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));


/**
 * Téléchargement d'un document de voyage. Les fichiers sont stockés HORS du dossier public :
 * accès réservé au titulaire du dossier (compte voyageur ou jeton du dossier) ou à l'équipe.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/documents/[id]">) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const doc = await db.bookingDocument.findUnique({ where: { id }, include: { booking: { select: { customerId: true, accessToken: true } } } });
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const token = req.nextUrl.searchParams.get("token");
  let allowed = !!token && token.length >= 20 && sameToken(token, doc.booking.accessToken);
  if (!allowed) {
    const c = await getCustomer();
    allowed = !!c && c.id === doc.booking.customerId;
  }
  if (!allowed) {
    const a = await getAdmin();
    // même règle MFA que requireAdmin
    allowed = !!a && adminMfaOk(a) && can(a.role, "bookings.read");
  }
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  const file = path.join(DOCS_DIR, path.basename(doc.fileName)); // basename : pas de traversée de répertoire
  const buf = await readFile(file).catch(() => null);
  if (!buf) return new NextResponse("Not found", { status: 404 });
  const safeName = doc.title.replace(/[^\w\-. ]+/g, "_").slice(0, 80) || "document";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": doc.mimeType,
      "content-disposition": `attachment; filename="${safeName}.${doc.fileName.split(".").pop()}"`,
      "x-content-type-options": "nosniff",
      // le document ne peut exécuter aucun script, même ouvert directement dans le navigateur
      "content-security-policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "referrer-policy": "no-referrer",
      "cache-control": "private, no-store",
    },
  });
}
