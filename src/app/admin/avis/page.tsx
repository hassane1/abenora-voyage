import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { moderateReview } from "../actions";
import { Badge, PageTitle } from "../ui";

export default async function ReviewsAdmin() {
  await requireAdmin();
  const reviews = await db.review.findMany({ include: { booking: { include: { circuit: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageTitle title="Avis clients" />
      <p className="mb-4 text-sm text-muted">Seuls les clients dont le séjour est confirmé et terminé peuvent déposer un avis (depuis leur espace client). Rien n&apos;est publié sans votre validation.</p>
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
