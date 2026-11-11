import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { moderateReview } from "../actions";
import { inviteReviews } from "../review-actions";
import { MAX_INVITES, reviewInviteCandidates } from "@/lib/review-invites";
import { Badge, PageTitle } from "../ui";

export default async function ReviewsAdmin({ searchParams }: PageProps<"/admin/avis">) {
  await requireAdmin();
  const sp = await searchParams;
  const [reviews, candidates] = await Promise.all([db.review.findMany({ include: { booking: { include: { circuit: true } } }, orderBy: { createdAt: "desc" } }), reviewInviteCandidates()]);
  const invitable = candidates.filter((c) => c.invites < MAX_INVITES);
  return (
    <div>
      <PageTitle title="Avis clients" />
      <p className="mb-4 text-sm text-muted">Seuls les clients dont le séjour est confirmé et terminé peuvent déposer un avis (depuis leur espace client). Rien n&apos;est publié sans votre validation.</p>
      {/* invitations MANUELLES à donner un avis : uniquement les clients ayant consenti (import de l'historique) */}
      <section className="mb-8 rounded-2xl bg-white p-5 ring-1 ring-night/5">
        <h2 className="font-semibold">Inviter à donner un avis</h2>
        <p className="mt-1 text-sm text-muted">
          Dossiers confirmés et terminés, sans avis, dont le client a accepté d&apos;être contacté (colonne « consentement » de l&apos;historique). Une invitation, puis au plus une relance ; chaque e-mail contient un lien de désinscription (loi 09-08). L&apos;agence ne peut pas écrire d&apos;avis à la place du client.
        </p>
        {typeof sp.invited === "string" && (
          <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
            {sp.invited} invitation(s) envoyée(s){sp.refused && sp.refused !== "0" ? ` · ${sp.refused} refusée(s) (conditions non remplies)` : ""}.
          </p>
        )}
        {candidates.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucun dossier éligible pour le moment.</p>
        ) : (
          <form action={inviteReviews} className="mt-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-start text-xs text-muted">
                  <tr>
                    <th className="p-2"><span className="sr-only">Choisir</span></th>
                    <th className="p-2 text-start">Dossier</th>
                    <th className="p-2 text-start">Client</th>
                    <th className="p-2 text-start">Retour</th>
                    <th className="p-2 text-start">Consentement</th>
                    <th className="p-2 text-start">Invitations</th>
                    <th className="p-2"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(({ b, consent, invites, lastInvite }) => {
                    const can = invites < MAX_INVITES;
                    return (
                      <tr key={b.id} className="border-t border-night/5">
                        <td className="p-2">{can && <input type="checkbox" name="bookingId" value={b.id} aria-label={`Inviter ${b.reference}`} className="accent-terracotta" />}</td>
                        <td className="p-2">
                          <Link href={`/admin/reservations/${b.id}`} className="text-terracotta hover:underline">{b.reference}</Link>
                        </td>
                        <td className="p-2">{b.firstName} {b.lastName}<span className="block text-xs text-muted">{b.email}</span></td>
                        <td className="p-2">{b.endDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })}</td>
                        <td className="p-2 text-xs">{consent?.date ? new Date(consent.date).toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "—"} · {consent?.channel ?? "—"}</td>
                        <td className="p-2 text-xs">{invites} / {MAX_INVITES}{lastInvite ? ` · dernière le ${lastInvite.toLocaleDateString("fr-FR")}` : ""}</td>
                        <td className="p-2">
                          {can ? (
                            <button name="single" value={b.id} className="btn btn-sand !py-1 text-xs">{invites ? "Relancer" : "Inviter"}</button>
                          ) : (
                            <span className="text-xs text-muted">Terminé</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {invitable.length > 1 && <button className="btn btn-primary !py-2 text-sm">Inviter la sélection</button>}
          </form>
        )}
      </section>

      {reviews.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-night/5">Aucun avis déposé.</p>}
      <div className="space-y-4">
        {reviews.map((r) => (
          <article key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-night/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {"★".repeat(r.rating)} {r.title}
              </p>
              <Badge cls={r.published ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}>{r.published ? "Publié" : "À modérer"}</Badge>
            </div>
            <p className="mt-2 text-sm">{r.comment}</p>
            <p className="mt-2 text-xs text-muted">
              {r.authorName} · {tr(r.booking.circuit.title, "fr")} ·{" "}
              <Link href={`/admin/reservations/${r.bookingId}`} className="text-terracotta hover:underline">
                {r.booking.reference}
              </Link>
            </p>
            <form action={moderateReview} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={r.id} />
              <button name="action" value={r.published ? "unpublish" : "publish"} className="btn btn-sand !py-1 text-xs">
                {r.published ? "Dépublier" : "Publier"}
              </button>
              <button name="action" value="delete" className="btn !py-1 text-xs text-rose-700 ring-1 ring-rose-200">
                Supprimer
              </button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
