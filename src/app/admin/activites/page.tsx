import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { updateActivity } from "../actions";
import { Flash, PageTitle } from "../ui";

const L = (v: unknown, l: string) => ((v ?? {}) as Record<string, string>)[l] ?? "";

export default async function ActivitiesAdmin({ searchParams }: PageProps<"/admin/activites">) {
  await requireAdmin();
  const sp = await searchParams;
  const activities = await db.activity.findMany({ include: { destination: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  return (
    <div>
      <PageTitle title="Activités" />
      <Flash sp={sp} />
      <div className="space-y-4">
        {activities.map((a) => (
          <form key={a.id} id={a.slug} action={updateActivity} className="rounded-2xl bg-white p-4 ring-1 ring-night/5">
            <input type="hidden" name="id" value={a.id} />
            <p className="mb-3 text-xs font-semibold uppercase text-terracotta">
              {a.category} · {tr(a.destination.name, "fr")} · <a href={`/fr/activites/${a.slug}`} target="_blank" className="underline">fiche ↗</a>
            </p>
            <div className="grid gap-3 lg:grid-cols-3">
              <input name="title_fr" defaultValue={L(a.title, "fr")} className="field !py-1.5 text-sm" aria-label="Titre FR" />
              <input name="title_en" defaultValue={L(a.title, "en")} className="field !py-1.5 text-sm" aria-label="Titre EN" />
              <input name="title_ar" defaultValue={L(a.title, "ar")} dir="rtl" className="field !py-1.5 text-sm" aria-label="Titre AR" />
              <textarea name="summary_fr" defaultValue={L(a.summary, "fr")} rows={2} className="field !py-1.5 text-sm" aria-label="Résumé FR" />
              <textarea name="summary_en" defaultValue={L(a.summary, "en")} rows={2} className="field !py-1.5 text-sm" aria-label="Résumé EN" />
              <textarea name="summary_ar" defaultValue={L(a.summary, "ar")} rows={2} dir="rtl" className="field !py-1.5 text-sm" aria-label="Résumé AR" />
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="label text-xs">Prix MAD (vide = sur demande)</span>
                <input name="priceMad" type="number" min={0} defaultValue={a.priceMad ?? ""} className="field w-40 !py-1.5 text-sm" />
              </label>
              <label className="block">
                <span className="label text-xs">Unité</span>
                <select name="priceUnit" defaultValue={a.priceUnit} className="field !py-1.5 text-sm">
                  <option value="PER_PERSON">Par personne</option>
                  <option value="PER_GROUP">Par groupe</option>
                </select>
              </label>
              <label className="block">
                <span className="label text-xs">Statut du tarif</span>
                <select name="priceStatus" defaultValue={a.priceStatus === "ON_REQUEST" ? "DEMO" : a.priceStatus} className="field !py-1.5 text-sm">
                  <option value="DEMO">Démonstration</option>
                  <option value="VALIDATED">Validé</option>
                </select>
              </label>
              <label className="block">
                <span className="label text-xs">Âge minimum</span>
                <input name="minAge" type="number" min={0} defaultValue={a.minAge ?? ""} className="field w-24 !py-1.5 text-sm" />
              </label>
              <label className="flex items-center gap-1 pb-2 text-xs">
                <input type="checkbox" name="published" defaultChecked={a.published} className="accent-terracotta" /> Publiée
              </label>
              <button className="btn btn-sand !py-1.5 text-sm">Enregistrer</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
