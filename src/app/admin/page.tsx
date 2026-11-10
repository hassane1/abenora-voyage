import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { getBrand } from "@/lib/brand";
import { tr } from "@/lib/i18n-content";
import { Badge, Card, PageTitle, statusBadge, statusLabel } from "./ui";
import TrendChart from "./TrendChart";
import { Icon } from "@/components/Icon";

const mad = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const yearAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const [
    todayCount, monthCount, monthConfirmed, paymentsMonth, payments12, bookings12, customers, distinctEmails, activeCircuits, upcomingTrips,
    pending, newRequests, acceptedQuotes, cancelRequests, unreadMessages, pendingReviews, demoCircuits, recent, top, brand,
  ] = await Promise.all([
    db.booking.count({ where: { createdAt: { gte: today } } }),
    db.booking.count({ where: { createdAt: { gte: monthStart } } }),
    db.booking.aggregate({ where: { status: "CONFIRMED", createdAt: { gte: monthStart } }, _sum: { totalMad: true }, _count: true }),
    db.payment.findMany({ where: { recordedAt: { gte: monthStart } } }),
    db.payment.findMany({ where: { recordedAt: { gte: yearAgo } }, select: { amountMad: true, kind: true, recordedAt: true } }),
    db.booking.findMany({ where: { createdAt: { gte: yearAgo } }, select: { createdAt: true } }),
    db.customer.count(),
    db.booking.groupBy({ by: ["email"] }).then((r) => r.length),
    db.circuit.count({ where: { published: true, destination: { published: true } } }),
    db.booking.count({ where: { status: "CONFIRMED", startDate: { gte: today } } }),
    db.booking.count({ where: { status: "PENDING" } }),
    db.quoteRequest.count({ where: { status: "NEW" } }),
    db.quote.count({ where: { status: "ACCEPTED" } }),
    db.booking.count({ where: { cancelRequestedAt: { not: null }, status: { in: ["PENDING", "CONFIRMED"] } } }),
    db.message.count({ where: { fromAgency: false, readAt: null } }),
    db.review.count({ where: { published: false } }),
    db.circuit.count({ where: { priceStatus: { not: "VALIDATED" }, published: true } }),
    db.booking.findMany({ include: { circuit: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.booking.groupBy({ by: ["circuitId"], _count: true, orderBy: { _count: { circuitId: "desc" } }, take: 5 }),
    getBrand(),
  ]);
  const net = (ps: { amountMad: number; kind: string }[]) => ps.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0);
  const topCircuits = await db.circuit.findMany({ where: { id: { in: top.map((t) => t.circuitId) } } });
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    const key = d.toISOString().slice(0, 7);
    return {
      label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      bookings: bookings12.filter((b) => b.createdAt.toISOString().startsWith(key)).length,
      revenue: net(payments12.filter((p) => p.recordedAt.toISOString().startsWith(key))),
    };
  });
  const showFinance = can(admin.role, "finance.read");
  const todo = pending + newRequests + acceptedQuotes + cancelRequests + unreadMessages;

  const kpis: [string, string | number, string, string][] = [
    ["Réservations du jour", todayCount, "/admin/reservations", "calendar"],
    ["Réservations du mois", monthCount, "/admin/reservations", "chart"],
    ...(showFinance
      ? ([
          ["Chiffre d'affaires du mois (confirmé)", mad(monthConfirmed._sum.totalMad ?? 0), "/admin/finances", "euro"],
          ["Paiements reçus ce mois", mad(net(paymentsMonth)), "/admin/finances", "shield"],
        ] as [string, string, string, string][])
      : []),
    ["Clients", `${distinctEmails} (${customers} compte${customers > 1 ? "s" : ""})`, "/admin/clients", "users"],
    ["Circuits actifs", activeCircuits, "/admin/circuits", "route"],
    ["Voyages à venir (confirmés)", upcomingTrips, "/admin/calendrier", "sun"],
    ["Demandes à traiter", todo, "/admin/reservations?status=PENDING", "sparkle"],
  ];

  return (
    <div>
      <PageTitle title="Tableau de bord">
        <p className="text-sm text-muted">
          {brand.name} · {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </PageTitle>
      {sp.denied && <p className="mb-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Votre rôle ne donne pas accès à cette page.</p>}
      {(demoCircuits > 0 || !process.env.SMTP_HOST || !brand.whatsapp || !brand.legal.companyName) && (
        <div className="mb-6 space-y-1.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">À configurer avant la mise en production</p>
          {demoCircuits > 0 && (
            <p>
              • {demoCircuits} circuit(s) publié(s) avec un tarif non validé (affiché « démonstration »). <Link href="/admin/circuits" className="underline">Valider les tarifs</Link>
            </p>
          )}
          {!process.env.SMTP_HOST && (
            <p>
              • SMTP non configuré : les e-mails sont journalisés sans être envoyés. <Link href="/admin/notifications" className="underline">Voir les e-mails</Link>
            </p>
          )}
          {!brand.whatsapp && (
            <p>
              • Numéro WhatsApp non renseigné. <Link href="/admin/identite" className="underline">Identité & coordonnées</Link>
            </p>
          )}
          {!brand.legal.companyName && (
            <p>
              • Informations légales de l&apos;agence (raison sociale, RC, ICE, licence) non renseignées. <Link href="/admin/identite" className="underline">Compléter</Link>
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, href, icon]) => (
          <Link key={label} href={href} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-night/5 transition hover:-translate-y-0.5 hover:ring-sand">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{label}</p>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ivory text-terracotta">
                <Icon name={icon} className="h-4 w-4" />
              </span>
            </div>
            <p className="font-display mt-2 text-3xl font-semibold text-night">{value}</p>
          </Link>
        ))}
      </div>
      {showFinance && <p className="mt-2 text-xs text-muted">Chiffre d&apos;affaires = total des dossiers confirmés créés ce mois. Paiements = encaissements réellement enregistrés (remboursements déduits).</p>}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card title="Évolution sur 12 mois" className="xl:col-span-2">
          <TrendChart data={showFinance ? months : months.map((m) => ({ ...m, revenue: 0 }))} />
        </Card>
        <Card title="À traiter">
          <ul className="space-y-3 text-sm">
            {(
              [
                ["Réservations à confirmer", pending, "/admin/reservations?status=PENDING"],
                ["Demandes d'annulation", cancelRequests, "/admin/reservations?cancel=1"],
                ["Nouvelles demandes / contacts", newRequests, "/admin/demandes?status=NEW"],
                ["Devis acceptés à transformer", acceptedQuotes, "/admin/demandes?status=IN_PROGRESS"],
                ["Messages non lus", unreadMessages, "/admin/messages"],
                ["Avis à modérer", pendingReviews, "/admin/avis"],
              ] as const
            ).map(([label, n, href]) => (
              <li key={label} className="flex items-center justify-between">
                <Link href={href} className="hover:underline">
                  {label}
                </Link>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${n > 0 ? "bg-terracotta text-white" : "bg-ivory text-muted"}`}>{n}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Circuits les plus demandés">
          {top.length === 0 ? (
            <p className="text-sm text-muted">Aucune réservation pour l&apos;instant.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {top.map((t) => (
                <li key={t.circuitId} className="flex justify-between gap-3">
                  <span className="truncate">{tr(topCircuits.find((c) => c.id === t.circuitId)?.title, "fr")}</span>
                  <strong>{t._count}</strong>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card title="Dernières réservations" className="xl:col-span-2">
          {recent.length === 0 ? (
            <p className="text-sm text-muted">Les nouvelles demandes de réservation apparaîtront ici.</p>
          ) : (
            <ul className="divide-y divide-night/5 text-sm">
              {recent.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/admin/reservations/${b.id}`} className="font-mono hover:underline">
                    {b.reference}
                  </Link>
                  <span className="flex-1 truncate px-2 text-muted">
                    {b.firstName} {b.lastName} · {tr(b.circuit.title, "fr")}
                  </span>
                  <Badge cls={statusBadge[b.status]}>{statusLabel[b.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
