import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { LEGAL_SLUGS } from "@/lib/content";
import { getV2 } from "@/i18n/v2";
import { savePage } from "../config-actions";
import { Badge, Card, PageTitle } from "../ui";

const L = (v: unknown, l: string) => ((v ?? {}) as Record<string, string>)[l] ?? "";

export default async function LegalPagesAdmin({ searchParams }: PageProps<"/admin/pages">) {
  await requireAdmin("content.write");
  const sp = await searchParams;
  const pages = await db.page.findMany();
  const current = typeof sp.p === "string" && (LEGAL_SLUGS as readonly string[]).includes(sp.p) ? sp.p : LEGAL_SLUGS[0];
  const page = pages.find((p) => p.slug === current);
  const v = getV2("fr");
  return (
    <div className="max-w-6xl">
      <PageTitle title="Pages légales" />
      {sp.ok && <p className="mb-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Page enregistrée.</p>}
      <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        Les textes fournis sont des <strong>modèles</strong> à adapter et à faire valider par un juriste (loi 31-08 sur la protection du consommateur, loi 09-08 et CNDP pour les données
        personnelles, réglementation des agences de voyages). Tant que la case « Validé » n&apos;est pas cochée, un avertissement est affiché sur la page publique.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {LEGAL_SLUGS.map((s) => {
          const p = pages.find((x) => x.slug === s);
          return (
            <Link key={s} href={`/admin/pages?p=${s}`} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${s === current ? "bg-night text-white" : "bg-white ring-1 ring-night/10"}`}>
              {v.legalPages[s]} <Badge cls={p?.validated ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}>{p?.validated ? "Validé" : "Modèle"}</Badge>
            </Link>
          );
        })}
      </div>
      <Card>
        <form action={savePage} className="space-y-4">
          <input type="hidden" name="slug" value={current} />
          <div className="grid gap-4 lg:grid-cols-3">
            {(["fr", "en", "ar"] as const).map((l) => (
              <div key={l} className="space-y-2" dir={l === "ar" ? "rtl" : "ltr"}>
                <p className="text-xs font-bold uppercase text-terracotta">{l}</p>
                <input name={`title_${l}`} defaultValue={L(page?.title, l) || (l === "fr" ? v.legalPages[current] : "")} placeholder="Titre" className="field !py-2 text-sm" />
                <textarea name={`body_${l}`} defaultValue={L(page?.body, l)} rows={22} className="field !py-2 font-mono text-xs" placeholder="## Titre de section&#10;Paragraphe…&#10;- élément de liste" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">Mise en forme : « ## » pour un titre de section, « - » pour une liste. Les variables {"{{nom}}"}, {"{{raison_sociale}}"}, {"{{adresse}}"}, {"{{email}}"}, {"{{telephone}}"}, {"{{rc}}"}, {"{{ice}}"}, {"{{licence}}"} sont remplacées par les informations de la page Identité.</p>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="validated" defaultChecked={page?.validated} className="accent-terracotta" /> Texte validé par un professionnel du droit
          </label>
          <button className="btn btn-primary !py-2 text-sm">Enregistrer</button>
        </form>
      </Card>
    </div>
  );
}
