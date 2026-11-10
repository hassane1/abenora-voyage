import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";

/** Export CSV (séparateur « ; », UTF-8 avec BOM : s'ouvre directement dans Excel) */
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.redirect(new URL("/admin/login", req.url));
  const sp = req.nextUrl.searchParams;
  const where = {
    ...(sp.get("status") ? { status: sp.get("status")! } : {}),
    ...(sp.get("circuit") ? { circuitId: sp.get("circuit")! } : {}),
  };
  const rows = await db.booking.findMany({ where, include: { circuit: true, payments: true }, orderBy: { createdAt: "desc" } });
  const header = ["Dossier", "Statut", "Paiement", "Circuit", "Départ", "Retour", "Adultes", "Enfants", "Âges enfants", "Privé", "Options", "Total MAD", "Acompte MAD", "Encaissé MAD", "Tarif démo", "Prénom", "Nom", "E-mail", "Téléphone", "WhatsApp", "Pays", "Ville de départ", "Besoins", "Commentaires", "Langue", "Créé le"];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((b) =>
    [
      b.reference, b.status, b.paymentStatus, tr(b.circuit.title, "fr"), b.startDate.toISOString().slice(0, 10), b.endDate.toISOString().slice(0, 10),
      b.adults, b.children, (b.childAges as number[]).join(","), b.privateTour ? "oui" : "non", (b.options as { label: string }[]).map((o) => o.label).join(", "),
      b.totalMad, b.depositMad, b.payments.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0), b.pricesAreDemo ? "oui" : "non",
      b.firstName, b.lastName, b.email, b.phone, b.whatsapp, b.country, b.departureCity, b.specialNeeds, b.comments, b.locale, b.createdAt.toISOString(),
    ].map(esc).join(";"),
  );
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
