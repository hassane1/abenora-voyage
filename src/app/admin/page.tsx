import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { Badge, Card, PageTitle, statusBadge, statusLabel } from "./ui";

export default async function Dashboard() {
  await requireAdmin();
  const [byStatus, bookings, payments, destinations, newRequests, pendingReviews, notifications, demoCircuits] = await Promise.all([
    db.booking.groupBy({ by: ["status"], _count: true }),
    db.booking.findMany({ include: { circuit: { include: { destination: true } } }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany(),
    db.destination.findMany({ where: { published: true } }),
    db.quoteRequest.count({ where: { status: "NEW" } }),
    db.review.count({ where: { published: false } }),
    db.notification.groupBy({ by: ["status"], _count: true }),
    db.circuit.count({ where: { priceStatus: { not: "VALIDATED" }, published: true } }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const total = bookings.length;
  const travelers = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING").reduce((s, b) => s + b.adults + b.children, 0);
  const revenue = payments.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0);

  // circuits les plus demandés
  const top = Object.values(
    bookings.reduce<Record<string, { title: string; n: number }>>((acc, b) => {
      acc[b.circuitId] ??= { title: tr(b.circuit.title, "fr"), n: 0 };
      acc[b.circuitId].n++;
      return acc;
    }, {}),
  ).sort((a, b) => b.n - a.n);

  // évolution mensuelle (6 derniers mois, date de demande)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });
  const perMonth = months.map((m) => ({ m, n: bookings.filter((b) => b.createdAt.toISOString().startsWith(m)).length }));
  const maxMonth = Math.max(1, ...perMonth.map((p) => p.n));

  const byDest = destinations.map((d) => ({ name: tr(d.name, "fr"), n: bookings.filter((b) => b.circuit.destinationId === d.id).length }));
  const logged = notifications.find((n) => n.status === "LOGGED")?._count ?? 0;

  const kpis = [
    ["Réservations", total, "/admin/reservations"],
    ["En attente", count("PENDING"), "/admin/reservations?status=PENDING"],
    ["Confirmées", count("CONFIRMED"), "/admin/reservations?status=CONFIRMED"],
    ["Annulées / refusées", count("CANCELLED") + count("REJECTED"), "/admin/reservations?status=CANCELLED"],
    ["Voyageurs (en attente + confirmés)", travelers, "/admin/reservations"],
    ["Encaissé (paiements enregistrés)", `${revenue.toLocaleString("fr-FR")} MAD`, "/admin/reservations"],
  ] as const;

  return (
    <div>
      <PageTitle title="Tableau de bord" />
      {(demoCircuits > 0 || logged > 0 || !process.env.SMTP_HOST) && (
        <div className="mb-6 space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">À configurer avant la mise en production</p>
          {demoCircuits > 0 && (
            <p>
              • {demoCircuits} circuit(s) publié(s) avec un tarif non validé (affiché « démonstration »). <Link href="/admin/circuits" className="underline">Valider les tarifs</Link>
            </p>
          )}
          {!process.env.SMTP_HOST && (
            <p>
              • SMTP non configuré : les e-mails sont journalisés sans être envoyés ({logged}). <Link href="/admin/notifications" className="underline">Voir les notifications</Link>
            </p>
          )}
          {!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && <p>• Numéro WhatsApp non configuré (NEXT_PUBLIC_WHATSAPP_NUMBER) : le bouton renvoie vers la page Contact.</p>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-night/5 transition hover:ring-sand">
            <p className="text-sm text-muted">{label}</p>
            <p className="font-display mt-1 text-4xl font-semibold text-night">{value}</p>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Le chiffre d&apos;affaires ne prend en compte que les paiements réellement enregistrés dans les dossiers (pas les montants des demandes).</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card title="Évolution mensuelle (demandes)" className="xl:col-span-2">
          <div className="flex h-48 items-end gap-3">
            {perMonth.map((p) => (
              <div key={p.m} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-night">{p.n}</span>
                <div className="w-full rounded-t-lg bg-terracotta/80" style={{ height: `${(p.n / maxMonth) * 140}px`, minHeight: 2 }} />
                <span className="text-xs text-muted">{p.m.slice(5)}/{p.m.slice(2, 4)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="À traiter">
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <Link href="/admin/reservations?status=PENDING" className="hover:underline">Réservations en attente</Link>
              <strong>{count("PENDING")}</strong>
            </li>
            <li className="flex justify-between">
              <Link href="/admin/demandes" className="hover:underline">Nouvelles demandes</Link>
              <strong>{newRequests}</strong>
            </li>
            <li className="flex justify-between">
              <Link href="/admin/avis" className="hover:underline">Avis à modérer</Link>
              <strong>{pendingReviews}</strong>
            </li>
          </ul>
        </Card>
        <Card title="Circuits les plus demandés">
          {top.length === 0 ? (
            <p className="text-sm text-muted">Aucune réservation pour l&apos;instant.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {top.map((t) => (
                <li key={t.title} className="flex justify-between">
                  <span>{t.title}</span>
                  <strong>{t.n}</strong>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card title="Répartition par destination">
          <ul className="space-y-2 text-sm">
            {byDest.map((d) => (
              <li key={d.name}>
                <div className="flex justify-between">
                  <span>{d.name}</span>
                  <strong>{d.n}</strong>
                </div>
                <div className="mt-1 h-2 rounded bg-ivory">
                  <div className="h-2 rounded bg-sand" style={{ width: `${total ? (d.n / total) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Dernières demandes">
          <ul className="space-y-3 text-sm">
            {bookings.slice(0, 6).map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/reservations/${b.id}`} className="font-mono hover:underline">
                  {b.reference}
                </Link>
                <Badge cls={statusBadge[b.status]}>{statusLabel[b.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
