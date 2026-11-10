import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { Badge, PageTitle, paymentLabel, statusBadge, statusLabel } from "../ui";

export default async function BookingsList({ searchParams }: PageProps<"/admin/reservations">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const circuitId = typeof sp.circuit === "string" ? sp.circuit : "";
  const from = typeof sp.from === "string" ? sp.from : "";
  const to = typeof sp.to === "string" ? sp.to : "";

  const where = {
    ...(status ? { status } : {}),
    ...(circuitId ? { circuitId } : {}),
    ...(from || to ? { startDate: { ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59Z`) } : {}) } } : {}),
    ...(q ? { OR: [{ reference: { contains: q.toUpperCase() } }, { email: { contains: q.toLowerCase() } }, { lastName: { contains: q } }, { firstName: { contains: q } }] } : {}),
  };
  const [bookings, circuits] = await Promise.all([
    db.booking.findMany({ where, include: { circuit: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    db.circuit.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const qs = new URLSearchParams(Object.entries({ status, q, circuit: circuitId, from, to }).filter(([, v]) => v)).toString();

  return (
    <div>
      <PageTitle title="Réservations">
        <div className="flex gap-2">
          <a href={`/admin/reservations/export?${qs}`} className="btn btn-sand !py-2 text-sm">
            Export Excel (CSV)
          </a>
          <Link href={`/admin/reservations/imprimer?${qs}`} className="btn bg-night !py-2 text-sm text-white" target="_blank">
            Export PDF
          </Link>
        </div>
      </PageTitle>
      <form className="mb-6 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-night/5 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Référence, nom, e-mail…" className="field !py-2 text-sm lg:col-span-2" />
        <select name="status" defaultValue={status} className="field !py-2 text-sm">
          <option value="">Tous les statuts</option>
          {Object.entries(statusLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="circuit" defaultValue={circuitId} className="field !py-2 text-sm">
          <option value="">Tous les circuits</option>
          {circuits.map((c) => (
            <option key={c.id} value={c.id}>
              {tr(c.title, "fr")}
            </option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={from} className="field !py-2 text-sm" aria-label="Départ à partir du" />
        <input type="date" name="to" defaultValue={to} className="field !py-2 text-sm" aria-label="Départ jusqu'au" />
        <button className="btn btn-primary !py-2 text-sm lg:col-span-6 lg:w-fit">Filtrer</button>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-night/5">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-start text-xs uppercase tracking-wider text-muted">
            <tr>
              {["Dossier", "Client", "Circuit", "Départ", "Voyageurs", "Total", "Statut", "Paiement", "Créé le"].map((h) => (
                <th key={h} className="px-4 py-3 text-start font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted">
                  Aucune réservation.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-night/5 hover:bg-ivory/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/reservations/${b.id}`} className="font-mono font-semibold text-terracotta hover:underline">
                    {b.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {b.firstName} {b.lastName}
                  <span className="block text-xs text-muted">{b.email}</span>
                </td>
                <td className="px-4 py-3">{tr(b.circuit.title, "fr")}</td>
                <td className="px-4 py-3 whitespace-nowrap">{b.startDate.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3">
                  {b.adults} + {b.children}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {b.totalMad.toLocaleString("fr-FR")} MAD
                  {b.pricesAreDemo && <span className="block text-[10px] text-terracotta">tarif démo</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge cls={statusBadge[b.status]}>{statusLabel[b.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-xs">{paymentLabel[b.paymentStatus]}</td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{b.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
