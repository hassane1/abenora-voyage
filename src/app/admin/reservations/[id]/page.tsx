import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import type { PriceResult } from "@/lib/pricing";
import { site } from "@/lib/site";
import { addBookingNote, recordPayment, setBookingStatus, updateBooking } from "../../actions";
import { Badge, Card, Flash, Input, PageTitle, paymentLabel, statusBadge, statusLabel } from "../../ui";
import PrintButton from "@/components/PrintButton";
import { deleteBookingDocument, dismissCancelRequest, replyMessage, uploadBookingDocument } from "../../sales-actions";

export default async function BookingDetail({ params, searchParams }: PageProps<"/admin/reservations/[id]">) {
  await requireAdmin("bookings.read");
  const { id } = await params;
  const sp = await searchParams;
  const b = await db.booking.findUnique({
    where: { id },
    include: { circuit: { include: { destination: true } }, departure: true, events: { orderBy: { createdAt: "desc" } }, payments: { orderBy: { recordedAt: "desc" } }, review: true, documents: { orderBy: { createdAt: "desc" } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!b) notFound();
  const notifications = await db.notification.findMany({ where: { bookingId: id }, orderBy: { createdAt: "desc" } });
  const otherDeps = await db.departure.findMany({ where: { circuitId: b.circuitId, date: { gte: new Date() }, status: "OPEN" }, orderBy: { date: "asc" }, take: 120 });
  const price = b.pricing as unknown as PriceResult;
  const paid = b.payments.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amountMad : p.amountMad), 0);
  const travelers = b.adults + b.children;
  const waNumber = (b.whatsapp || b.phone).replace(/\D/g, "");

  return (
    <div>
      <Link href="/admin/reservations" className="no-print text-sm text-terracotta hover:underline">
        ← Réservations
      </Link>
      <PageTitle title={`Dossier ${b.reference}`}>
        <div className="flex items-center gap-2">
          <Badge cls={statusBadge[b.status]}>{statusLabel[b.status]}</Badge>
          <Badge cls="bg-night/10 text-night">{paymentLabel[b.paymentStatus]}</Badge>
          <PrintButton label="PDF" className="btn bg-night !py-1.5 text-sm text-white no-print" />
        </div>
      </PageTitle>
      <Flash sp={sp} />
      {b.pricesAreDemo && (
        <p className="mb-6 rounded-xl border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-terracotta">
          Ce dossier a été calculé avec au moins un tarif ou une disponibilité de démonstration. Communiquez le prix réel au client avant toute confirmation.
        </p>
      )}

      {b.cancelRequestedAt && ["PENDING", "CONFIRMED"].includes(b.status) && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">Demande d&apos;annulation du client le {b.cancelRequestedAt.toISOString().slice(0, 16).replace("T", " ")}</p>
          {b.cancelReason && <p className="mt-1">« {b.cancelReason} »</p>}
          <p className="mt-2 text-xs">Pour annuler : bloc « Décision » → Annulée (le client est notifié, les places sont libérées). Appliquez les conditions d&apos;annulation du circuit et enregistrez un éventuel remboursement dans « Paiements ».</p>
          <form action={dismissCancelRequest} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="id" value={b.id} />
            <input name="note" placeholder="Motif (ex. report de date convenu)" className="field !w-auto flex-1 !py-1.5 text-sm" />
            <button className="btn !py-1.5 text-sm ring-1 ring-rose-300">Clore sans annuler</button>
          </form>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Voyage">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <D k="Circuit" v={`${tr(b.circuit.title, "fr")} — ${tr(b.circuit.destination.name, "fr")}`} />
              <D k="Dates" v={`${b.startDate.toISOString().slice(0, 10)} → ${b.endDate.toISOString().slice(0, 10)}`} />
              <D k="Voyageurs" v={`${b.adults} adulte(s), ${b.children} enfant(s)${b.children ? ` — âges : ${(b.childAges as number[]).join(", ")}` : ""}`} />
              <D k="Formule" v={b.privateTour ? "Voyage privé" : "Partagé"} />
              <D k="Options" v={(b.options as { label: string }[]).map((o) => o.label).join(", ") || "—"} />
              <D k="Code promo" v={b.promoCode ?? "—"} />
              <D k="Départ (places)" v={`${b.departure.seatsHeld}/${b.departure.capacity} occupées${b.departure.isDemo ? " — disponibilité démo" : ""}`} />
              <D k="Langue du client" v={b.locale.toUpperCase()} />
            </dl>
          </Card>

          <Card title="Prix">
            <table className="w-full text-sm">
              <tbody>
                {[...(price.lines ?? []), ...(price.discounts ?? [])].map((l) => (
                  <tr key={l.key} className="border-b border-night/5">
                    <td className="py-1.5">{l.label}</td>
                    <td className="text-xs text-muted">{l.detail}</td>
                    <td className="text-end">{l.amount.toLocaleString("fr-FR")} MAD</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="pt-3">Total</td>
                  <td />
                  <td className="pt-3 text-end">{b.totalMad.toLocaleString("fr-FR")} MAD</td>
                </tr>
                <tr>
                  <td>Acompte prévu</td>
                  <td />
                  <td className="text-end">{b.depositMad.toLocaleString("fr-FR")} MAD</td>
                </tr>
                <tr>
                  <td>Encaissé</td>
                  <td />
                  <td className="text-end text-emerald-700">{paid.toLocaleString("fr-FR")} MAD</td>
                </tr>
                <tr>
                  <td>Reste dû</td>
                  <td />
                  <td className="text-end">{(b.totalMad - paid).toLocaleString("fr-FR")} MAD</td>
                </tr>
              </tbody>
            </table>
          </Card>

          <Card title="Client">
            <form action={updateBooking} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={b.id} />
              <Input label="Prénom" name="firstName" defaultValue={b.firstName} required />
              <Input label="Nom" name="lastName" defaultValue={b.lastName} required />
              <Input label="E-mail" name="email" type="email" defaultValue={b.email} required />
              <Input label="Téléphone" name="phone" defaultValue={b.phone} required />
              <Input label="WhatsApp" name="whatsapp" defaultValue={b.whatsapp} />
              <Input label="Pays" name="country" defaultValue={b.country} />
              <Input label="Ville de départ" name="departureCity" defaultValue={b.departureCity} />
              <Input label="Besoins particuliers" name="specialNeeds" defaultValue={b.specialNeeds} />
              <label className="block sm:col-span-2">
                <span className="label">Changer la date de départ</span>
                <select name="departureId" defaultValue={b.departureId} className="field !py-2 text-sm">
                  <option value={b.departureId}>{b.startDate.toISOString().slice(0, 10)} (actuelle)</option>
                  {otherDeps
                    .filter((d) => d.id !== b.departureId)
                    .map((d) => (
                      <option key={d.id} value={d.id} disabled={d.capacity - d.seatsHeld < travelers}>
                        {d.date.toISOString().slice(0, 10)} — {d.capacity - d.seatsHeld} place(s) libre(s)
                      </option>
                    ))}
                </select>
              </label>
              {b.comments && <p className="rounded-xl bg-ivory p-3 text-sm sm:col-span-2">Commentaire du client : {b.comments}</p>}
              <button className="btn btn-sand !py-2 text-sm sm:w-fit">Enregistrer les modifications</button>
            </form>
          </Card>

          <Card title="Messagerie avec le client" id="messages">
            {b.messages.length === 0 ? (
              <p className="text-sm text-muted">Aucun message. Le client peut écrire depuis son dossier ; votre réponse lui est envoyée par e-mail.</p>
            ) : (
              <ul className="space-y-3">
                {b.messages.map((m) => (
                  <li key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.fromAgency ? "ms-auto bg-night text-white" : "bg-sand/20"}`}>
                    <p className="text-[11px] opacity-70">
                      {m.author} · {m.createdAt.toISOString().slice(0, 16).replace("T", " ")} {!m.fromAgency && !m.readAt && "· non lu"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <form action={replyMessage} className="mt-4 space-y-2">
              <input type="hidden" name="bookingId" value={b.id} />
              <textarea name="body" required rows={3} maxLength={4000} placeholder="Répondre au client…" className="field !py-2 text-sm" />
              <button className="btn btn-primary !py-2 text-sm">Envoyer</button>
            </form>
          </Card>

          <Card title="Documents de voyage" id="documents">
            {b.documents.length === 0 ? (
              <p className="text-sm text-muted">Aucun document. Les documents déposés ici sont visibles par le client dans son dossier (stockage privé, hors du site public).</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {b.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-xl bg-ivory px-3 py-2">
                    <a href={`/api/documents/${d.id}`} target="_blank" className="flex-1 font-medium hover:text-terracotta">
                      {d.title}
                    </a>
                    <span className="text-xs text-muted">
                      {d.kind} · {Math.round(d.size / 1024)} Ko
                    </span>
                    <form action={deleteBookingDocument}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="text-xs text-rose-700 hover:underline">Supprimer</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={uploadBookingDocument} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
              <input type="hidden" name="bookingId" value={b.id} />
              <input name="title" required maxLength={120} placeholder="Titre (ex. Bon d'échange bivouac)" className="field !py-2 text-sm" />
              <select name="kind" className="field !py-2 text-sm">
                <option value="VOUCHER">Bon d&apos;échange</option>
                <option value="PROGRAM">Programme</option>
                <option value="INVOICE">Facture</option>
                <option value="RECEIPT">Reçu</option>
                <option value="OTHER">Autre</option>
              </select>
              <input type="file" name="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="text-xs" />
              <button className="btn btn-sand !py-2 text-sm">Déposer</button>
            </form>
            <p className="mt-2 text-xs text-muted">PDF, JPEG, PNG ou WebP, 10 Mo maximum (le contenu réel du fichier est vérifié).</p>
          </Card>

          <Card title="Historique des changements">
            <ol className="space-y-3 text-sm">
              {b.events.map((e) => (
                <li key={e.id} className="border-s-2 border-sand ps-3">
                  <p>
                    <strong>{e.type === "STATUS_CHANGED" ? `${statusLabel[e.fromStatus ?? ""] ?? e.fromStatus} → ${statusLabel[e.toStatus ?? ""]}` : e.type === "CREATED" ? "Création de la demande" : e.note}</strong>
                  </p>
                  {e.type === "STATUS_CHANGED" && e.note && <p className="text-muted">« {e.note} »</p>}
                  <p className="text-xs text-muted">
                    {e.createdAt.toISOString().slice(0, 16).replace("T", " ")} — {e.actor}
                  </p>
                </li>
              ))}
            </ol>
            <form action={addBookingNote} className="mt-4 flex gap-2">
              <input type="hidden" name="id" value={b.id} />
              <input name="note" placeholder="Ajouter une note interne…" className="field !py-2 text-sm" />
              <button className="btn btn-sand !py-2 text-sm">Ajouter</button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Décision">
            <p className="mb-3 text-xs text-muted">Le client est notifié par e-mail à chaque changement de statut. Le message ci-dessous est inclus dans l&apos;e-mail.</p>
            <form action={setBookingStatus} className="space-y-3">
              <input type="hidden" name="id" value={b.id} />
              <textarea name="note" rows={3} placeholder="Message au client (facultatif)" className="field !py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                {b.status !== "CONFIRMED" && (
                  <button name="status" value="CONFIRMED" className="btn bg-emerald-700 !py-2 text-sm text-white hover:bg-emerald-800">
                    Confirmer
                  </button>
                )}
                {b.status === "PENDING" && (
                  <button name="status" value="REJECTED" className="btn bg-rose-700 !py-2 text-sm text-white hover:bg-rose-800">
                    Refuser
                  </button>
                )}
                {(b.status === "CONFIRMED" || b.status === "PENDING") && (
                  <button name="status" value="CANCELLED" className="btn bg-slate-600 !py-2 text-sm text-white hover:bg-slate-700">
                    Annuler
                  </button>
                )}
                {(b.status === "REJECTED" || b.status === "CANCELLED") && (
                  <button name="status" value="PENDING" className="btn bg-amber-600 !py-2 text-sm text-white">
                    Remettre en attente
                  </button>
                )}
              </div>
            </form>
          </Card>

          <Card title="Paiements">
            <ul className="mb-4 space-y-2 text-sm">
              {b.payments.length === 0 && <li className="text-muted">Aucun paiement enregistré.</li>}
              {b.payments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    {p.kind === "REFUND" ? "Remboursement" : "Paiement"} · {p.method}
                    <span className="block text-xs text-muted">
                      {p.recordedAt.toISOString().slice(0, 10)} {p.reference && `· ${p.reference}`}
                    </span>
                  </span>
                  <strong className={p.kind === "REFUND" ? "text-rose-700" : "text-emerald-700"}>
                    {p.kind === "REFUND" ? "−" : ""}
                    {p.amountMad.toLocaleString("fr-FR")}
                  </strong>
                </li>
              ))}
            </ul>
            <form action={recordPayment} className="grid gap-2">
              <input type="hidden" name="id" value={b.id} />
              <div className="grid grid-cols-2 gap-2">
                <input name="amount" type="number" min={1} required placeholder="Montant MAD" className="field !py-2 text-sm" />
                <select name="kind" className="field !py-2 text-sm">
                  <option value="PAYMENT">Paiement</option>
                  <option value="REFUND">Remboursement</option>
                </select>
              </div>
              <select name="method" className="field !py-2 text-sm">
                <option value="VIREMENT">Virement</option>
                <option value="ESPECES">Espèces</option>
                <option value="CARTE">Carte (TPE)</option>
                <option value="PRESTATAIRE_EN_LIGNE">Paiement en ligne</option>
              </select>
              <input name="reference" placeholder="Référence de la transaction" className="field !py-2 text-sm" />
              <button className="btn btn-sand !py-2 text-sm">Enregistrer</button>
            </form>
            <p className="mt-2 text-xs text-muted">N&apos;enregistrez que des paiements réellement reçus et vérifiés.</p>
          </Card>

          <Card title="Contact rapide">
            <div className="flex flex-col gap-2 text-sm">
              <a href={`mailto:${b.email}?subject=${encodeURIComponent(`Votre réservation ${b.reference}`)}`} className="text-terracotta hover:underline">
                ✉ {b.email}
              </a>
              <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Bonjour ${b.firstName}, au sujet de votre réservation ${b.reference}…`)}`} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">
                WhatsApp {b.whatsapp || b.phone}
              </a>
              <a href={`${site.url}/${b.locale}/espace-client?ref=${b.reference}&token=${b.accessToken}`} target="_blank" className="text-terracotta hover:underline">
                Voir l&apos;espace client ↗
              </a>
            </div>
          </Card>

          <Card title="E-mails">
            <ul className="space-y-2 text-xs">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Badge cls={n.status === "SENT" ? "bg-emerald-100 text-emerald-900" : n.status === "FAILED" ? "bg-rose-100 text-rose-900" : "bg-amber-100 text-amber-900"}>
                    {n.status === "SENT" ? "Envoyé" : n.status === "FAILED" ? "Échec" : "Journalisé (SMTP non configuré)"}
                  </Badge>
                  <p className="mt-1">
                    {n.subject} → {n.to}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function D({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium text-night">{v}</dd>
    </div>
  );
}
