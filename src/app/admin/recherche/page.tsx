import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { Badge, Card, PageTitle, statusBadge, statusLabel } from "../ui";

/** Recherche globale (en-tête) : dossiers, demandes / devis, circuits */
export default async function SearchPage({ searchParams }: PageProps<"/admin/recherche">) {
  await requireAdmin("bookings.read");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  if (!q) return <PageTitle title="Recherche" />;
  const [bookings, requests, quotes, circuits] = await Promise.all([
    db.booking.findMany({
      where: { OR: [{ reference: { contains: q.toUpperCase() } }, { email: { contains: q.toLowerCase() } }, { lastName: { contains: q } }, { firstName: { contains: q } }, { phone: { contains: q } }] },
      include: { circuit: true },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    db.quoteRequest.findMany({ where: { OR: [{ reference: { contains: q.toUpperCase() } }, { email: { contains: q.toLowerCase() } }, { name: { contains: q } }] }, take: 20, orderBy: { createdAt: "desc" } }),
    db.quote.findMany({ where: { number: { contains: q.toUpperCase() } }, take: 10 }),
    db.circuit.findMany({ where: { slug: { contains: q.toLowerCase() } }, take: 10 }),
  ]);
  const none = !bookings.length && !requests.length && !quotes.length && !circuits.length;
  return (
    <div className="space-y-6">
      <PageTitle title={`Recherche : « ${q} »`} />
      {none && <p className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-night/5">Aucun résultat.</p>}
      {bookings.length > 0 && (
        <Card title={`Réservations (${bookings.length})`}>
          <ul className="divide-y divide-night/5 text-sm">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-2">
                <Link href={`/admin/reservations/${b.id}`} className="font-mono font-semibold hover:underline">
                  {b.reference}
                </Link>
                <span className="flex-1">
                  {b.firstName} {b.lastName} · {b.email} · {tr(b.circuit.title, "fr")} · {b.startDate.toISOString().slice(0, 10)}
                </span>
                <Badge cls={statusBadge[b.status]}>{statusLabel[b.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {(requests.length > 0 || quotes.length > 0) && (
        <Card title="Demandes et devis">
          <ul className="divide-y divide-night/5 text-sm">
            {requests.map((r) => (
              <li key={r.id} className="py-2">
                <Link href={`/admin/demandes/${r.id}`} className="hover:underline">
                  <span className="font-mono">{r.reference ?? "—"}</span> · {r.name} · {r.email}
                </Link>
              </li>
            ))}
            {quotes.map((x) => (
              <li key={x.id} className="py-2">
                <Link href={`/admin/demandes/${x.requestId}`} className="hover:underline">
                  Devis <span className="font-mono">{x.number}</span> · {x.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {circuits.length > 0 && (
        <Card title="Circuits">
          <ul className="text-sm">
            {circuits.map((c) => (
              <li key={c.id} className="py-1">
                <Link href={`/admin/circuits/${c.id}`} className="hover:underline">
                  {tr(c.title, "fr")}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
