import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateDestination } from "../actions";
import { Badge, Flash, PageTitle } from "../ui";

const L = (v: unknown, l: string) => ((v ?? {}) as Record<string, string>)[l] ?? "";

export default async function DestinationsAdmin({ searchParams }: PageProps<"/admin/destinations">) {
  await requireAdmin();
  const sp = await searchParams;
  const destinations = await db.destination.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { circuits: true, activities: true } } } });
  return (
    <div>
      <PageTitle title="Destinations" />
      <Flash sp={sp} />
      {sp.warn === "nocircuit" && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Destination publiée sans circuit publié : elle apparaîtra sans offre réservable.</p>}
      <p className="mb-4 text-sm text-muted">Une destination non publiée apparaît uniquement dans la liste « Bientôt », sans offre ni tarif.</p>
      <div className="space-y-4">
        {destinations.map((d) => (
          <details key={d.id} className="rounded-2xl bg-white ring-1 ring-night/5">
            <summary className="flex cursor-pointer items-center justify-between p-4">
              <span className="font-semibold">
                {L(d.name, "fr")} <span className="text-xs text-muted">· {d.region}</span>
              </span>
              <span className="flex items-center gap-2 text-xs">
                {d._count.circuits} circuit(s) · {d._count.activities} activité(s)
                <Badge cls={d.published ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-700"}>{d.published ? "Publiée" : "Bientôt"}</Badge>
              </span>
            </summary>
            <form action={updateDestination} className="grid gap-3 border-t border-night/5 p-4 lg:grid-cols-3">
              <input type="hidden" name="id" value={d.id} />
              {(["fr", "en", "ar"] as const).map((l) => (
                <div key={l} className="space-y-2" dir={l === "ar" ? "rtl" : "ltr"}>
                  <p className="text-xs font-bold uppercase text-terracotta">{l}</p>
                  <input name={`name_${l}`} defaultValue={L(d.name, l)} placeholder="Nom" className="field !py-1.5 text-sm" />
                  <input name={`tagline_${l}`} defaultValue={L(d.tagline, l)} placeholder="Accroche" className="field !py-1.5 text-sm" />
                  <textarea name={`description_${l}`} defaultValue={L(d.description, l)} rows={4} placeholder="Description" className="field !py-1.5 text-sm" />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="published" defaultChecked={d.published} className="accent-terracotta" /> Publiée
              </label>
              <button className="btn btn-sand !py-1.5 text-sm lg:w-fit">Enregistrer</button>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}
