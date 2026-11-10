import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { Badge, Card, PageTitle, paymentLabel } from "../ui";

const mad = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;

/** Ventes, paiements, acomptes, soldes, remboursements — sur une période */
export default async function FinancesPage({ searchParams }: PageProps<"/admin/finances">) {
  await requireAdmin("finance.read");
  const sp = await searchParams;
  const now = new Date();
  const from = typeof sp.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const to = typeof sp.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : now.toISOString().slice(0, 10);
  const range = { gte: new Date(`${from}T00:00:00Z`), lte: new Date(`${to}T23:59:59Z`) };

  const [payments, confirmed, open] = await Promise.all([
    db.payment.findMany({ where: { recordedAt: range }, include: { booking: { select: { id: true, reference: true, firstName: true, lastName: true } } }, orderBy: { recordedAt: "desc" } }),
    db.booking.findMany({ where: { status: "CONFIRMED", createdAt: range }, include: { circuit: true } }),
    db.booking.findMany({ where: { status: "CONFIRMED" }, include: { payments: true } }),
  ]);
  const received = payments.filter((p) => p.kind !== "REFUND").reduce((s, p) => s + p.amountMad, 0);
  const refunds = payments.filter((p) => p.kind === "REFUND").reduce((s, p) => s + p.amountMad, 0);
  const sales = confirmed.reduce((s, b) => s + b.totalMad, 0);
  const balances = open
    .map((b) => {
      const paid = b.payments.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0);
      return { b, paid, due: b.totalMad - paid, depositDue: Math.max(0, b.depositMad - paid) };
    })
    .filter((x) => x.due > 0)
    .sort((a, b) => a.b.startDate.getTime() - b.b.startDate.getTime());
  const byMethod = Object.entries(
    payments.reduce<Record<string, number>>((acc, p) => {
      acc[p.method] = (acc[p.method] ?? 0) + (p.kind === "REFUND" ? -p.amountMad : p.amountMad);
      return acc;
    }, {}),
  );
  const byCircuit = Object.values(
    confirmed.reduce<Record<string, { title: string; n: number; total: number }>>((acc, b) => {
      acc[b.circuitId] ??= { title: tr(b.circuit.title, "fr"), n: 0, total: 0 };
      acc[b.circuitId].n++;
      acc[b.circuitId].total += b.totalMad;
      return acc;
    }, {}),
  ).sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageTitle title="Finances">
        <form className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            <span className="label">Du</span>
            <input type="date" name="from" defaultValue={from} className="field !py-1.5" />
          </label>
          <label>
            <span className="label">Au</span>
            <input type="date" name="to" defaultValue={to} className="field !py-1.5" />
          </label>
          <button className="btn btn-sand !py-2 text-sm">Appliquer</button>
        </form>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Ventes confirmées", mad(sales), `${confirmed.length} dossier(s) confirmés créés sur la période`],
          ["Encaissements", mad(received), `${payments.filter((p) => p.kind !== "REFUND").length} paiement(s)`],
          ["Remboursements", mad(refunds), `${payments.filter((p) => p.kind === "REFUND").length} opération(s)`],
          ["Soldes restant dus (tous dossiers confirmés)", mad(balances.reduce((s, x) => s + x.due, 0)), `${balances.length} dossier(s)`],
        ].map(([k, v, d]) => (
          <div key={k} className="rounded-2xl bg-white p-5 ring-1 ring-night/5">
            <p className="text-sm text-muted">{k}</p>
            <p className="font-display mt-1 text-3xl font-semibold text-night">{v}</p>
            <p className="mt-1 text-xs text-muted">{d}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Montants issus des paiements enregistrés manuellement dans les dossiers. Le paiement en ligne n&apos;est pas encore activé (voir README, « Paiement »).</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card title="Soldes et acomptes à encaisser" className="xl:col-span-2">
          {balances.length === 0 ? (
            <p className="text-sm text-muted">Aucun solde en attente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th className="py-2 text-start">Dossier</th>
                    <th className="py-2 text-start">Départ</th>
                    <th className="py-2 text-end">Total</th>
                    <th className="py-2 text-end">Payé</th>
                    <th className="py-2 text-end">Acompte dû</th>
                    <th className="py-2 text-end">Solde dû</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.slice(0, 50).map(({ b, paid, due, depositDue }) => (
                    <tr key={b.id} className="border-t border-night/5">
                      <td className="py-2">
                        <Link href={`/admin/reservations/${b.id}`} className="font-mono hover:underline">
                          {b.reference}
                        </Link>{" "}
                        <Badge cls="bg-night/10 text-night">{paymentLabel[b.paymentStatus]}</Badge>
                      </td>
                      <td className="py-2">{b.startDate.toISOString().slice(0, 10)}</td>
                      <td className="py-2 text-end">{mad(b.totalMad)}</td>
                      <td className="py-2 text-end">{mad(paid)}</td>
                      <td className={`py-2 text-end ${depositDue > 0 ? "font-semibold text-terracotta" : "text-muted"}`}>{mad(depositDue)}</td>
                      <td className="py-2 text-end font-semibold">{mad(due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Par mode de paiement">
            {byMethod.length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {byMethod.map(([m, n]) => (
                  <li key={m} className="flex justify-between">
                    <span>{m}</span>
                    <strong>{mad(n)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Ventes par circuit">
            {byCircuit.length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {byCircuit.map((c) => (
                  <li key={c.title} className="flex justify-between gap-2">
                    <span className="truncate">
                      {c.title} ({c.n})
                    </span>
                    <strong>{mad(c.total)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card title="Journal des encaissements et remboursements" className="xl:col-span-3">
          {payments.length === 0 ? (
            <p className="text-sm text-muted">Aucune opération sur la période.</p>
          ) : (
            <ul className="divide-y divide-night/5 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="w-36 text-muted">{p.recordedAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                  <Link href={`/admin/reservations/${p.booking.id}`} className="font-mono hover:underline">
                    {p.booking.reference}
                  </Link>
                  <span className="flex-1 truncate px-2">
                    {p.booking.firstName} {p.booking.lastName} · {p.method} {p.reference ? `· ${p.reference}` : ""} · {p.recordedBy}
                  </span>
                  <strong className={p.kind === "REFUND" ? "text-rose-700" : ""}>
                    {p.kind === "REFUND" ? "−" : ""}
                    {mad(p.amountMad)}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
