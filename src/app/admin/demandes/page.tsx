import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { setRequestStatus } from "../actions";
import { Badge, PageTitle } from "../ui";

const label: Record<string, string> = { NEW: "Nouvelle", IN_PROGRESS: "En cours", CLOSED: "Traitée" };
const cls: Record<string, string> = { NEW: "bg-amber-100 text-amber-900", IN_PROGRESS: "bg-sky-100 text-sky-900", CLOSED: "bg-slate-200 text-slate-700" };

export default async function RequestsAdmin() {
  await requireAdmin();
  const requests = await db.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <div>
      <PageTitle title="Demandes sur mesure & contacts" />
      {requests.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-night/5">Aucune demande pour l&apos;instant.</p>}
      <div className="space-y-4">
        {requests.map((r) => (
          <article key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-night/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {r.kind === "CONTACT" ? "Contact" : "Sur mesure"} — {r.name}{" "}
                <a href={`mailto:${r.email}`} className="text-sm font-normal text-terracotta hover:underline">
                  {r.email}
                </a>{" "}
                {r.phone && <span className="text-sm font-normal text-muted">· {r.phone}</span>}
              </p>
              <span className="flex items-center gap-2 text-xs text-muted">
                {r.createdAt.toISOString().slice(0, 16).replace("T", " ")} · {r.locale.toUpperCase()}
                <Badge cls={cls[r.status]}>{label[r.status]}</Badge>
              </span>
            </div>
            {r.kind === "SUR_MESURE" && (
              <p className="mt-2 text-sm text-muted">
                {r.durationDays ?? "—"} jours · {r.budgetMad ? `${r.budgetMad.toLocaleString("fr-FR")} MAD/pers.` : "budget —"} · {r.travelers ?? "—"} voyageur(s) {r.interests && `· ${r.interests}`}
              </p>
            )}
            <p className="mt-3 whitespace-pre-wrap text-sm">{r.message}</p>
            <form action={setRequestStatus} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={r.id} />
              {Object.entries(label)
                .filter(([k]) => k !== r.status)
                .map(([k, v]) => (
                  <button key={k} name="status" value={k} className="rounded-full px-3 py-1 text-xs ring-1 ring-night/15 hover:bg-ivory">
                    → {v}
                  </button>
                ))}
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
