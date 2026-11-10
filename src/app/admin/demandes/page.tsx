import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { setRequestStatus } from "../actions";
import { Badge, PageTitle } from "../ui";

const label: Record<string, string> = { NEW: "Nouvelle", IN_PROGRESS: "En cours", CLOSED: "Traitée" };
const cls: Record<string, string> = { NEW: "bg-amber-100 text-amber-900", IN_PROGRESS: "bg-sky-100 text-sky-900", CLOSED: "bg-slate-200 text-slate-700" };
const qLabel: Record<string, string> = { DRAFT: "Brouillon", SENT: "Envoyé", ACCEPTED: "Accepté", DECLINED: "Refusé", CONVERTED: "Réservé" };

export default async function RequestsAdmin({ searchParams }: PageProps<"/admin/demandes">) {
  await requireAdmin("bookings.read");
  const sp = await searchParams;
  const status = typeof sp.status === "string" && label[sp.status] ? sp.status : undefined;
  const kind = sp.kind === "CONTACT" || sp.kind === "SUR_MESURE" ? sp.kind : undefined;
  const requests = await db.quoteRequest.findMany({
    where: { ...(status ? { status } : {}), ...(kind ? { kind } : {}) },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { quotes: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const chip = (href: string, text: string, on: boolean) => (
    <Link key={href} href={href} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${on ? "bg-night text-white" : "bg-white ring-1 ring-night/10"}`}>
      {text}
    </Link>
  );
  return (
    <div>
      <PageTitle title="Demandes & devis" />
      <div className="mb-4 flex flex-wrap gap-2">
        {chip("/admin/demandes", "Toutes", !status && !kind)}
        {chip("/admin/demandes?kind=SUR_MESURE", "Sur mesure", kind === "SUR_MESURE")}
        {chip("/admin/demandes?kind=CONTACT", "Contacts", kind === "CONTACT")}
        {Object.entries(label).map(([k, v]) => chip(`/admin/demandes?status=${k}`, v, status === k))}
      </div>
      {requests.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-night/5">Aucune demande pour ce filtre.</p>}
      <div className="space-y-3">
        {requests.map((r) => (
          <article key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-night/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/demandes/${r.id}`} className="font-semibold hover:text-terracotta">
                <span className="font-mono text-xs text-muted">{r.reference ?? "—"}</span> · {r.kind === "CONTACT" ? "Contact" : "Sur mesure"} — {r.name}
              </Link>
              <span className="flex items-center gap-2 text-xs text-muted">
                {r.createdAt.toISOString().slice(0, 16).replace("T", " ")} · {r.locale.toUpperCase()}
                {r.quotes[0] && <Badge cls="bg-sand/20 text-night">Devis : {qLabel[r.quotes[0].status]}</Badge>}
                <Badge cls={cls[r.status]}>{label[r.status]}</Badge>
              </span>
            </div>
            {r.kind === "SUR_MESURE" && (
              <p className="mt-1 text-sm text-muted">
                {r.destination ?? "—"} · {r.durationDays ?? "—"} j · {r.budgetMad ? `${r.budgetMad.toLocaleString("fr-FR")} MAD/pers.` : "budget —"} · {r.travelers ?? "—"} voyageur(s)
              </p>
            )}
            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm">{r.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href={`/admin/demandes/${r.id}`} className="btn btn-sand !py-1.5 text-xs">
                {r.kind === "SUR_MESURE" ? "Ouvrir / préparer le devis" : "Ouvrir"}
              </Link>
              <form action={setRequestStatus} className="flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                {Object.entries(label)
                  .filter(([k]) => k !== r.status)
                  .map(([k, v]) => (
                    <button key={k} name="status" value={k} className="rounded-full px-3 py-1 text-xs ring-1 ring-night/15 hover:bg-ivory">
                      → {v}
                    </button>
                  ))}
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
