import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getV2 } from "@/i18n/v2";
import { quoteUrl, type QuoteLine } from "@/lib/quotes";
import { convertQuote, saveQuote } from "../../sales-actions";
import { Badge, Card, PageTitle } from "../../ui";

/** date du jour + n jours (validité par défaut d'un devis) */
const inDays = (n: number) => new Date(Date.now() + n * 86400_000);

const qLabel: Record<string, [string, string]> = {
  DRAFT: ["Brouillon", "bg-slate-200 text-slate-700"],
  SENT: ["Envoyé au client", "bg-sky-100 text-sky-900"],
  ACCEPTED: ["Accepté par le client", "bg-emerald-100 text-emerald-900"],
  DECLINED: ["Refusé par le client", "bg-rose-100 text-rose-900"],
  CONVERTED: ["Transformé en réservation", "bg-night text-white"],
};

export default async function RequestDetail({ params, searchParams }: PageProps<"/admin/demandes/[id]">) {
  await requireAdmin("bookings.read");
  const { id } = await params;
  const sp = await searchParams;
  const r = await db.quoteRequest.findUnique({ where: { id }, include: { quotes: { orderBy: { createdAt: "desc" } } } });
  if (!r) notFound();
  const v = getV2("fr");
  const editable = r.quotes.find((q) => q.status === "DRAFT" || q.status === "SENT");
  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const defaultLines = editable
    ? (editable.lines as QuoteLine[]).map((l) => `${l.label} | ${l.qty} | ${l.unitMad}`).join("\n")
    : `Circuit privé ${r.durationDays ?? 3} jours (transport, guide) | 1 | 0\nHébergement (${r.comfort ? v.tailorForm.comforts[r.comfort] : "confort"}) | ${Math.max(1, (r.durationDays ?? 3) - 1)} | 0\nActivités | ${r.travelers ?? 2} | 0`;
  const fields = [
    ["E-mail", r.email],
    ["Téléphone", r.phone],
    ["Destination", r.destination],
    ["Ville de départ", r.departureCity],
    ["Date souhaitée", day(r.startDate)],
    ["Durée", r.durationDays ? `${r.durationDays} jours` : null],
    ["Voyageurs", r.travelers],
    ["Budget / pers.", r.budgetMad ? `${r.budgetMad.toLocaleString("fr-FR")} MAD` : null],
    ["Confort", r.comfort ? v.tailorForm.comforts[r.comfort] : null],
    ["Transport", r.transport ? v.tailorForm.transports[r.transport] : null],
    ["Intérêts", r.interests],
    ["Consentement", r.consentAt ? r.consentAt.toISOString().slice(0, 16).replace("T", " ") : "—"],
  ].filter(([, val]) => val !== null && val !== undefined && val !== "");

  return (
    <div className="max-w-6xl">
      <Link href="/admin/demandes" className="text-sm text-terracotta hover:underline">
        ← Demandes
      </Link>
      <PageTitle title={`${r.reference ?? "Demande"} — ${r.name}`} />
      {sp.ok && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{sp.ok === "sent" ? "Devis envoyé au client (voir E-mails envoyés)." : "Devis enregistré."}</p>}
      {sp.error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{sp.error === "empty" ? "Ajoutez au moins une ligne avec un montant avant d'envoyer." : sp.error === "locked" ? "Ce devis a déjà reçu une réponse : créez-en un nouveau." : String(sp.error)}</p>}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card title="Demande du client">
          <dl className="space-y-2 text-sm">
            {fields.map(([k, val]) => (
              <div key={String(k)} className="flex justify-between gap-3">
                <dt className="text-muted">{k}</dt>
                <dd className="text-end font-medium">{String(val)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-ivory p-3 text-sm">{r.message}</p>
        </Card>

        <div className="space-y-6">
          {r.kind === "SUR_MESURE" && (
            <Card title={editable ? `Devis ${editable.number}` : "Préparer un devis"}>
              <form action={saveQuote} className="space-y-4">
                <input type="hidden" name="requestId" value={r.id} />
                {editable && <input type="hidden" name="id" value={editable.id} />}
                <label className="block">
                  <span className="label">Titre</span>
                  <input name="title" defaultValue={editable?.title ?? `${r.durationDays ?? ""} jours sur mesure — ${r.destination ?? "Maroc"}`} className="field !py-2 text-sm" />
                </label>
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="block">
                    <span className="label">Date de début</span>
                    <input type="date" name="startDate" defaultValue={day(editable?.startDate ?? r.startDate)} className="field !py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="label">Voyageurs</span>
                    <input type="number" name="travelers" min={1} defaultValue={editable?.travelers ?? r.travelers ?? 2} className="field !py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="label">Acompte (%)</span>
                    <input type="number" name="depositPercent" min={0} max={100} defaultValue={editable?.depositPercent ?? 30} className="field !py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="label">Valable jusqu&apos;au</span>
                    <input type="date" name="validUntil" defaultValue={day(editable?.validUntil ?? inDays(14))} className="field !py-2 text-sm" />
                  </label>
                </div>
                <label className="block">
                  <span className="label">Programme (une ligne par élément, « ## Jour 1 — … » pour un titre de jour)</span>
                  <textarea name="program" rows={10} defaultValue={editable?.program ?? "## Jour 1 — \n\n## Jour 2 — \n"} className="field !py-2 font-mono text-xs" />
                </label>
                <label className="block">
                  <span className="label">Lignes de prix : « Libellé | quantité | prix unitaire MAD »</span>
                  <textarea name="lines" rows={6} defaultValue={defaultLines} className="field !py-2 font-mono text-xs" />
                  <span className="mt-1 block text-xs text-muted">Le total est calculé par le serveur à partir de ces lignes. Saisissez vos tarifs réels : aucun prix n&apos;est proposé automatiquement.</span>
                </label>
                <label className="block">
                  <span className="label">Conditions (annulation, inclus / exclus, paiement)</span>
                  <textarea name="conditions" rows={4} defaultValue={editable?.conditions ?? ""} className="field !py-2 text-sm" />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-sand !py-2 text-sm">Enregistrer le brouillon</button>
                  <button name="send" value="1" className="btn btn-primary !py-2 text-sm">
                    Enregistrer et envoyer au client
                  </button>
                </div>
              </form>
            </Card>
          )}

          {r.quotes.length > 0 && (
            <Card title="Historique des devis">
              <ul className="space-y-3">
                {r.quotes.map((q) => (
                  <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-night/10 p-3 text-sm">
                    <span className="font-mono font-semibold">{q.number}</span>
                    <span className="flex-1">{q.title}</span>
                    <span className="font-semibold">{q.totalMad.toLocaleString("fr-FR")} MAD</span>
                    <Badge cls={qLabel[q.status][1]}>{qLabel[q.status][0]}</Badge>
                    <a href={quoteUrl(q, r.locale)} target="_blank" className="text-xs text-terracotta hover:underline">
                      Voir / PDF ↗
                    </a>
                    {q.status === "ACCEPTED" && (
                      <form action={convertQuote}>
                        <input type="hidden" name="id" value={q.id} />
                        <button className="btn btn-primary !py-1.5 text-xs">Transformer en réservation</button>
                      </form>
                    )}
                    {q.bookingId && (
                      <Link href={`/admin/reservations/${q.bookingId}`} className="text-xs text-terracotta hover:underline">
                        Dossier →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
