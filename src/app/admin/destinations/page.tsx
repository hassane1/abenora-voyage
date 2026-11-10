import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateDestination } from "../actions";
import { createDestination, updateDestinationDetails } from "../config-actions";
import { Badge, Card, Flash, PageTitle } from "../ui";

const L = (v: unknown, l: string) => ((v ?? {}) as Record<string, string>)[l] ?? "";
const list = (v: unknown, l: string) => (((v ?? {}) as Record<string, string[]>)[l] ?? []).join("\n");
type Faq = { q: Record<string, string>; a: Record<string, string> }[];
const faqText = (v: unknown, l: string) => ((v ?? []) as Faq).map((f) => `Q: ${f.q?.[l] ?? ""}\nR: ${f.a?.[l] ?? ""}`).join("\n\n");

export default async function DestinationsAdmin({ searchParams }: PageProps<"/admin/destinations">) {
  await requireAdmin("catalog.write");
  const sp = await searchParams;
  const destinations = await db.destination.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { circuits: true, activities: true, media: true } } } });
  return (
    <div className="max-w-6xl">
      <PageTitle title="Destinations" />
      <Flash sp={sp} />
      {sp.warn === "nocircuit" && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Destination publiée sans circuit publié : elle apparaîtra sans offre réservable.</p>}
      <p className="mb-4 text-sm text-muted">
        Une destination non publiée apparaît en « Bientôt », sans offre ni tarif. Photo de bannière : dans Médias, ajoutez l&apos;étiquette <code className="rounded bg-ivory px-1">slot:destination:&lt;identifiant&gt;</code> à une photo dont les droits sont confirmés.
      </p>
      <div className="space-y-4">
        {destinations.map((d) => (
          <details key={d.id} id={d.slug} className="rounded-2xl bg-white ring-1 ring-night/5">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4">
              <span className="font-semibold">
                {L(d.name, "fr")} <span className="text-xs text-muted">· {d.region} · /{d.slug}</span>
              </span>
              <span className="flex items-center gap-2 text-xs">
                {d._count.circuits} circuit(s) · {d._count.activities} activité(s) · {d._count.media} média(s)
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
                  <textarea name={`description_${l}`} defaultValue={L(d.description, l)} rows={4} placeholder="Présentation touristique" className="field !py-1.5 text-sm" />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="published" defaultChecked={d.published} className="accent-terracotta" /> Publiée
              </label>
              <button className="btn btn-sand !py-1.5 text-sm lg:w-fit">Enregistrer les textes</button>
            </form>
            <form action={updateDestinationDetails} className="grid gap-3 border-t border-night/5 p-4 lg:grid-cols-4">
              <input type="hidden" name="id" value={d.id} />
              <label className="block">
                <span className="label">Région</span>
                <input name="region" defaultValue={d.region} className="field !py-1.5 text-sm" />
              </label>
              <label className="block">
                <span className="label">Latitude (carte)</span>
                <input name="latitude" defaultValue={d.latitude} className="field !py-1.5 text-sm" />
              </label>
              <label className="block">
                <span className="label">Longitude (carte)</span>
                <input name="longitude" defaultValue={d.longitude} className="field !py-1.5 text-sm" />
              </label>
              <label className="block">
                <span className="label">Ordre d&apos;affichage</span>
                <input name="sortOrder" type="number" defaultValue={d.sortOrder} className="field !py-1.5 text-sm" />
              </label>
              {(["fr", "en", "ar"] as const).map((l) => (
                <label key={l} className="block lg:col-span-1" dir={l === "ar" ? "rtl" : "ltr"}>
                  <span className="label">Conseils pratiques ({l}) — un par ligne</span>
                  <textarea name={`tips_${l}`} defaultValue={list(d.tips, l)} rows={5} className="field !py-1.5 text-xs" />
                </label>
              ))}
              <div />
              {(["fr", "en"] as const).map((l) => (
                <label key={l} className="block lg:col-span-2">
                  <span className="label">FAQ ({l}) — blocs « Q: … / R: … »</span>
                  <textarea name={`faq_${l}`} defaultValue={faqText(d.faq, l)} rows={6} className="field !py-1.5 font-mono text-xs" />
                </label>
              ))}
              <button className="btn btn-sand !py-1.5 text-sm lg:w-fit">Enregistrer la fiche</button>
            </form>
          </details>
        ))}
      </div>
      <Card title="Nouvelle destination" className="mt-6">
        <form action={createDestination} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <input name="name_fr" required placeholder="Nom (FR)" className="field !py-2 text-sm" />
          <input name="name_en" placeholder="Name (EN)" className="field !py-2 text-sm" />
          <input name="name_ar" placeholder="الاسم (AR)" dir="rtl" className="field !py-2 text-sm" />
          <input name="region" placeholder="Région" className="field !py-2 text-sm" />
          <input name="latitude" placeholder="Latitude" className="field !py-2 text-sm" />
          <input name="longitude" placeholder="Longitude" className="field !py-2 text-sm" />
          <button className="btn btn-primary !py-2 text-sm sm:w-fit">Créer (non publiée)</button>
        </form>
      </Card>
    </div>
  );
}
