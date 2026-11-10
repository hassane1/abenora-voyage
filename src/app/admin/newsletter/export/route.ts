import { NextResponse } from "next/server";
import { adminMfaOk, getAdmin } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { audit } from "@/lib/security";
import { unsubscribeUrl } from "@/lib/newsletter";

export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(new URL("/admin/login", req.url));
  // même règle MFA que requireAdmin
  if (!adminMfaOk(admin) || !can(admin.role, "marketing.write")) return new NextResponse("Forbidden", { status: 403 });
  const subs = await db.newsletterSubscriber.findMany({ where: { status: "CONFIRMED" }, orderBy: { confirmedAt: "asc" } });
  // protection contre l'injection de formules (CSV injection)
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const csv = ["email;langue;consentement;confirmation;lien_desinscription", ...subs.map((s) => [s.email, s.locale, s.consentAt.toISOString(), s.confirmedAt?.toISOString() ?? "", unsubscribeUrl(s.id)].map(cell).join(";"))].join("\r\n");
  await audit(admin.email, "NEWSLETTER_EXPORT", null, { n: subs.length });
  return new NextResponse("﻿" + csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="newsletter.csv"' } });
}
