import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, PageTitle } from "../ui";

/** Clients : voyageurs ayant un compte ou au moins une réservation (regroupés par e-mail) */
export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  await requireAdmin("bookings.read");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const [bookings, customers] = await Promise.all([
    db.booking.findMany({
      where: q ? { OR: [{ email: { contains: q.toLowerCase() } }, { lastName: { contains: q } }, { firstName: { contains: q } }, { phone: { contains: q } }] } : {},
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, country: true, totalMad: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    db.customer.findMany({ where: q ? { OR: [{ email: { contains: q.toLowerCase() } }, { lastName: { contains: q } }] } : {}, select: { email: true, emailVerifiedAt: true, createdAt: true, firstName: true, lastName: true, phone: true, country: true } }),
  ]);
  type Row = { email: string; name: string; phone: string; country: string; bookings: number; confirmedTotal: number; last: Date; account: "VERIFIED" | "UNVERIFIED" | null };
  const rows = new Map<string, Row>();
  for (const c of customers)
    rows.set(c.email, { email: c.email, name: `${c.firstName} ${c.lastName}`, phone: c.phone ?? "", country: c.country ?? "", bookings: 0, confirmedTotal: 0, last: c.createdAt, account: c.emailVerifiedAt ? "VERIFIED" : "UNVERIFIED" });
  for (const b of bookings) {
    const r = rows.get(b.email) ?? { email: b.email, name: `${b.firstName} ${b.lastName}`, phone: b.phone, country: b.country, bookings: 0, confirmedTotal: 0, last: b.createdAt, account: null };
    r.bookings++;
    if (b.status === "CONFIRMED") r.confirmedTotal += b.totalMad;
    if (b.createdAt > r.last) r.last = b.createdAt;
    rows.set(b.email, r);
  }
  const list = [...rows.values()].sort((a, b) => b.last.getTime() - a.last.getTime());
  return (
    <div>
      <PageTitle title="Clients">
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Nom, e-mail, téléphone" className="field !w-64 !py-2 text-sm" />
          <button className="btn btn-sand !py-2 text-sm">Rechercher</button>
        </form>
      </PageTitle>
      <p className="mb-4 text-xs text-muted">Données personnelles : accès réservé à l&apos;équipe, à utiliser uniquement pour le traitement des voyages (loi 09-08). {list.length} client(s).</p>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-night/5">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-xs uppercase text-muted">
            <tr>
              <th className="p-3 text-start">Client</th>
              <th className="p-3 text-start">Contact</th>
              <th className="p-3 text-start">Compte</th>
              <th className="p-3 text-end">Dossiers</th>
              <th className="p-3 text-end">Confirmé (MAD)</th>
              <th className="p-3 text-start">Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.email} className="border-t border-night/5">
                <td className="p-3">
                  <Link href={`/admin/reservations?q=${encodeURIComponent(r.email)}`} className="font-semibold hover:text-terracotta">
                    {r.name}
                  </Link>
                  <p className="text-xs text-muted">{r.country}</p>
                </td>
                <td className="p-3 text-xs">
                  {r.email}
                  <br />
                  {r.phone}
                </td>
                <td className="p-3">{r.account ? <Badge cls={r.account === "VERIFIED" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}>{r.account === "VERIFIED" ? "Vérifié" : "Non vérifié"}</Badge> : <span className="text-xs text-muted">Sans compte</span>}</td>
                <td className="p-3 text-end">{r.bookings}</td>
                <td className="p-3 text-end">{r.confirmedTotal.toLocaleString("fr-FR")}</td>
                <td className="p-3 text-xs text-muted">{r.last.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  Aucun client.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
