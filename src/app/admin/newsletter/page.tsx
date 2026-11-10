import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { deleteSubscriber } from "../config-actions";
import { Badge, PageTitle } from "../ui";

const label: Record<string, [string, string]> = {
  PENDING: ["En attente de confirmation", "bg-amber-100 text-amber-900"],
  CONFIRMED: ["Confirmé", "bg-emerald-100 text-emerald-900"],
  UNSUBSCRIBED: ["Désinscrit", "bg-slate-200 text-slate-700"],
};

export default async function NewsletterAdmin() {
  await requireAdmin("marketing.write");
  const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  const confirmed = subs.filter((s) => s.status === "CONFIRMED").length;
  return (
    <div>
      <PageTitle title="Newsletter">
        {/* téléchargement de fichier : lien HTML classique */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/newsletter/export" className="btn btn-sand !py-2 text-sm">
          Exporter les inscrits confirmés (CSV)
        </a>
      </PageTitle>
      <p className="mb-4 text-sm text-muted">
        Double opt-in : une adresse n&apos;est utilisable qu&apos;après confirmation par le lien reçu par e-mail. Le texte de consentement et la date sont conservés comme preuve. {confirmed} inscrit(s) confirmé(s).
        L&apos;envoi des campagnes se fait avec un outil d&apos;e-mailing (Brevo, Mailjet…) à partir de l&apos;export ; chaque e-mail doit contenir le lien de désinscription.
      </p>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-night/5">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-xs uppercase text-muted">
            <tr>
              <th className="p-3 text-start">E-mail</th>
              <th className="p-3 text-start">Langue</th>
              <th className="p-3 text-start">Statut</th>
              <th className="p-3 text-start">Consentement</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-night/5">
                <td className="p-3">{s.email}</td>
                <td className="p-3 uppercase">{s.locale}</td>
                <td className="p-3">
                  <Badge cls={label[s.status]?.[1] ?? ""}>{label[s.status]?.[0] ?? s.status}</Badge>
                </td>
                <td className="p-3 text-xs text-muted">{formatDate(s.consentAt, "fr", { dateStyle: "short", timeStyle: "short" } as Intl.DateTimeFormatOptions)}</td>
                <td className="p-3 text-end">
                  <form action={deleteSubscriber}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs text-rose-700 hover:underline">Supprimer (droit à l&apos;effacement)</button>
                  </form>
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">
                  Aucun inscrit pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
