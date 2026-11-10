import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getGeneralFaq } from "@/lib/content";
import { getDictionary } from "@/i18n/get-dictionary";
import { saveBanner, saveFaq, saveHomeContent } from "../config-actions";
import { Badge, Card, PageTitle } from "../ui";

const L = (v: unknown, l: string) => ((v ?? {}) as Record<string, string>)[l] ?? "";
const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function ContentPage({ searchParams }: PageProps<"/admin/contenus">) {
  await requireAdmin("content.write");
  const sp = await searchParams;
  const [s, faq, banners, videos] = await Promise.all([
    getSettings(),
    getGeneralFaq(),
    db.banner.findMany({ orderBy: { createdAt: "desc" } }),
    db.media.findMany({ where: { kind: "VIDEO", rightsConfirmed: true } }),
  ]);
  const faqText = (l: "fr" | "en" | "ar") => faq.map((f) => `Q: ${f.q[l] ?? ""}\nR: ${f.a[l] ?? ""}`).join("\n\n");
  const now = new Date();
  return (
    <div className="max-w-5xl space-y-6">
      <PageTitle title="Accueil, FAQ, bannières" />
      {sp.ok && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Enregistré.</p>}
      {sp.error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Le texte français est obligatoire.</p>}

      <Card title="Page d'accueil — grand titre">
        <form action={saveHomeContent} className="space-y-4">
          {(["fr", "en", "ar"] as const).map((l) => (
            <div key={l} className="grid gap-3 md:grid-cols-[60px_1fr_2fr]" dir={l === "ar" ? "rtl" : "ltr"}>
              <span className="pt-2 text-xs font-bold uppercase text-terracotta">{l}</span>
              <input name={`heroTitle_${l}`} defaultValue={s[`content.home.heroTitle.${l}`] ?? ""} placeholder={getDictionary(l).home.heroTitle} className="field !py-2 text-sm" />
              <textarea name={`heroSubtitle_${l}`} defaultValue={s[`content.home.heroSubtitle.${l}`] ?? ""} placeholder={getDictionary(l).home.heroSubtitle} rows={2} className="field !py-2 text-sm" />
            </div>
          ))}
          <label className="block">
            <span className="label">Vidéo de fond du hero (facultatif)</span>
            <select name="heroVideo" defaultValue={s["content.home.heroVideo"] ?? ""} className="field !py-2 text-sm">
              <option value="">Aucune — photographie</option>
              {videos.map((v) => (
                <option key={v.id} value={v.url}>
                  {L(v.alt, "fr") || v.url} {v.credit ? `© ${v.credit}` : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted">Seules les vidéos MP4 téléversées dans Médias avec droits confirmés sont proposées. La photo reste affichée pendant le chargement et pour les visiteurs qui limitent les animations.</span>
          </label>
          <p className="text-xs text-muted">Champs vides = textes par défaut (affichés en gris).</p>
          <button className="btn btn-primary !py-2 text-sm">Enregistrer</button>
        </form>
      </Card>

      <Card title="Questions fréquentes (accueil)" id="faq">
        <form action={saveFaq} className="space-y-3">
          <p className="text-xs text-muted">Format : un bloc par question, séparé par une ligne vide. « Q: » pour la question, « R: » pour la réponse. Les blocs EN/AR sont associés dans le même ordre que le français.</p>
          <div className="grid gap-3 lg:grid-cols-3">
            {(["fr", "en", "ar"] as const).map((l) => (
              <label key={l} className="block" dir={l === "ar" ? "rtl" : "ltr"}>
                <span className="label uppercase">{l}</span>
                <textarea name={`faq_${l}`} defaultValue={faqText(l)} rows={14} className="field !py-2 font-mono text-xs" />
              </label>
            ))}
          </div>
          <button className="btn btn-primary !py-2 text-sm">Enregistrer la FAQ</button>
        </form>
      </Card>

      <Card title="Bannières promotionnelles / offres saisonnières" id="bannieres">
        <p className="mb-4 text-xs text-muted">Une seule bannière s&apos;affiche à la fois (la plus récente active dans sa période). N&apos;annoncez que des offres réelles et vérifiables.</p>
        <div className="space-y-4">
          {[...banners, null].map((b) => {
            const live = b && b.active && (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now);
            return (
              <form key={b?.id ?? "new"} action={saveBanner} className="rounded-xl border border-night/10 p-4">
                {b && <input type="hidden" name="id" value={b.id} />}
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  {b ? "Bannière" : "Nouvelle bannière"} {b && <Badge cls={live ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-700"}>{live ? "En ligne" : "Hors ligne"}</Badge>}
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  {(["fr", "en", "ar"] as const).map((l) => (
                    <div key={l} className="space-y-2" dir={l === "ar" ? "rtl" : "ltr"}>
                      <input name={`text_${l}`} defaultValue={L(b?.text, l)} placeholder={`Texte (${l})`} className="field !py-1.5 text-sm" />
                      <input name={`label_${l}`} defaultValue={L(b?.linkLabel, l)} placeholder={`Libellé du lien (${l})`} className="field !py-1.5 text-sm" />
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  <input name="linkUrl" defaultValue={b?.linkUrl ?? ""} placeholder="/fr/circuits (lien interne)" className="field !py-1.5 text-sm" />
                  <input type="date" name="startsAt" defaultValue={day(b?.startsAt ?? null)} className="field !py-1.5 text-sm" aria-label="Début" />
                  <input type="date" name="endsAt" defaultValue={day(b?.endsAt ?? null)} className="field !py-1.5 text-sm" aria-label="Fin" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked={b?.active ?? true} className="accent-terracotta" /> Active
                  </label>
                </div>
                <div className="mt-3 flex gap-2">
                  <button name="action" value="save" className="btn btn-sand !py-1.5 text-sm">
                    Enregistrer
                  </button>
                  {b && (
                    <button name="action" value="delete" className="btn !py-1.5 text-sm text-rose-700 ring-1 ring-rose-200">
                      Supprimer
                    </button>
                  )}
                </div>
              </form>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
