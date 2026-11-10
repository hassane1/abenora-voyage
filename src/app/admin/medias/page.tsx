import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { updateMedia, uploadMedia } from "../actions";
import { Badge, Card, Flash, Input, PageTitle } from "../ui";

export default async function MediaAdmin({ searchParams }: PageProps<"/admin/medias">) {
  await requireAdmin();
  const sp = await searchParams;
  const [media, destinations] = await Promise.all([db.media.findMany({ orderBy: { createdAt: "desc" }, include: { destination: true } }), db.destination.findMany({ orderBy: { sortOrder: "asc" } })]);
  return (
    <div>
      <PageTitle title="Médias & droits d'utilisation" />
      <Flash sp={sp} />
      <Card title="Ajouter une photo ou une vidéo">
        <form action={uploadMedia} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="label">Fichier (JPG, PNG, WebP, MP4 — 20 Mo max.)</span>
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,video/mp4" required className="field !py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="label">Destination</span>
            <select name="destinationId" className="field !py-2 text-sm">
              <option value="">—</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {tr(d.name, "fr")}
                </option>
              ))}
            </select>
          </label>
          <Input label="Texte alternatif FR (lieu exact)" name="alt_fr" required placeholder="Dunes de l'Erg Chebbi au lever du soleil" />
          <Input label="Texte alternatif EN" name="alt_en" />
          <Input label="Crédit / auteur" name="credit" required />
          <Input label="Licence / autorisation" name="license" required placeholder="Cession de droits, CC BY-SA 4.0…" />
          <Input label="Source (URL)" name="sourceUrl" type="url" />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="rightsConfirmed" className="accent-terracotta" /> Je confirme disposer des droits d&apos;utilisation commerciale (sinon le média reste privé)
          </label>
          <button className="btn btn-primary !py-2 text-sm">Téléverser</button>
        </form>
        <p className="mt-3 text-xs text-muted">Stockage local (dossier public/uploads) en développement. En production, utilisez un stockage objet (Supabase Storage, S3) — voir README.</p>
      </Card>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {media.length === 0 && <p className="text-sm text-muted">Aucun média. Le site affiche des illustrations vectorielles en attendant.</p>}
        {media.map((m) => (
          <figure key={m.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-night/5">
            {m.kind === "VIDEO" ? (
              <video src={m.url} className="h-40 w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={tr(m.alt, "fr")} className="h-40 w-full object-cover" />
            )}
            <figcaption className="space-y-1 p-3 text-xs">
              <Badge cls={m.rightsConfirmed ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}>{m.rightsConfirmed ? "Public" : "Privé : droits non confirmés"}</Badge>
              <p>{tr(m.alt, "fr")}</p>
              <p className="text-muted">
                © {m.credit} · {m.license} {m.destination && `· ${tr(m.destination.name, "fr")}`}
              </p>
              <form action={updateMedia} className="flex gap-2 pt-1">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="rightsConfirmed" value={m.rightsConfirmed ? "false" : "true"} />
                <button name="action" value="toggle" className="text-terracotta hover:underline">
                  {m.rightsConfirmed ? "Rendre privé" : "Publier"}
                </button>
                <button name="action" value="delete" className="text-rose-700 hover:underline">
                  Supprimer
                </button>
              </form>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
