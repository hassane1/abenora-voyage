import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr, trList } from "@/lib/i18n-content";
import { addDays } from "@/lib/format";
import { bulkDepartures, generateDepartures, updateCircuit, updateDeparture, updateItineraryDay } from "../../actions";
import { Card, Flash, Input, PageTitle, PriceStatusSelect, TextArea } from "../../ui";

const L = (v: unknown, l: "fr" | "en" | "ar") => ((v ?? {}) as Record<string, string>)[l] ?? "";
const LL = (v: unknown, l: "fr" | "en" | "ar") => (((v ?? {}) as Record<string, string[]>)[l] ?? []).join("\n");

export default async function CircuitEdit({ params, searchParams }: PageProps<"/admin/circuits/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const c = await db.circuit.findUnique({
    where: { id },
    include: { destination: true, itinerary: { orderBy: { dayNumber: "asc" } }, departures: { where: { date: { gte: addDays(new Date(), -1) } }, orderBy: { date: "asc" } } },
  });
  if (!c) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const in90 = addDays(new Date(), 90).toISOString().slice(0, 10);
  const demoCount = c.departures.filter((d) => d.isDemo).length;

  return (
    <div>
      <Link href="/admin/circuits" className="text-sm text-terracotta hover:underline">
        ← Circuits
      </Link>
      <PageTitle title={tr(c.title, "fr")}>
        <Link href={`/fr/circuits/${c.slug}`} target="_blank" className="text-sm text-terracotta hover:underline">
          Voir la fiche publique ↗
        </Link>
      </PageTitle>
      <Flash sp={sp} />

      <form action={updateCircuit} className="space-y-6">
        <input type="hidden" name="id" value={c.id} />
        <Card title="Tarifs, capacité et publication">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="label">Mode de prix</span>
              <select name="pricingMode" defaultValue={c.pricingMode} className="field !py-2 text-sm">
                <option value="PER_PERSON">Par personne</option>
                <option value="PER_GROUP">Par groupe</option>
              </select>
            </label>
            <Input label="Prix adulte / groupe (MAD) — vide = sur devis" name="priceAdultMad" type="number" min={0} defaultValue={c.priceAdultMad} />
            <PriceStatusSelect value={c.priceStatus} />
            <Input label="Tarif enfant 4-11 ans (% adulte)" name="childPricePercent" type="number" min={0} max={100} defaultValue={c.childPricePercent} />
            <Input label="Gratuit sous l'âge de" name="childFreeUnderAge" type="number" min={0} max={12} defaultValue={c.childFreeUnderAge} />
            <Input label="Supplément privé (MAD / pers.)" name="privateSupplementMad" type="number" min={0} defaultValue={c.privateSupplementMad} />
            <Input label="Acompte (%)" name="depositPercent" type="number" min={0} max={100} defaultValue={c.depositPercent} />
            <Input label="Capacité par défaut" name="defaultCapacity" type="number" min={1} defaultValue={c.defaultCapacity} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={c.published} className="accent-terracotta" /> Publié sur le site
          </label>
          <p className="mt-3 text-xs text-muted">
            Passez le statut à « Validé » uniquement pour un tarif commercial réellement confirmé avec vos prestataires. Tant qu&apos;il est en « Démonstration », le site l&apos;affiche comme fictif.
          </p>
        </Card>

        <Card title="Textes (FR / EN / AR)">
          <div className="grid gap-4 lg:grid-cols-3">
            {(["fr", "en", "ar"] as const).map((l) => (
              <div key={l} className="space-y-3" dir={l === "ar" ? "rtl" : "ltr"}>
                <p className="text-xs font-bold uppercase text-terracotta">{l}</p>
                <Input label="Titre" name={`title_${l}`} defaultValue={L(c.title, l)} required={l === "fr"} />
                <TextArea label="Résumé" name={`summary_${l}`} defaultValue={L(c.summary, l)} />
                <TextArea label="Inclus (une ligne par élément)" name={`included_${l}`} defaultValue={LL(c.included, l)} rows={4} />
                <TextArea label="Non inclus" name={`excluded_${l}`} defaultValue={LL(c.excluded, l)} rows={3} />
                <TextArea label="Bon à savoir" name={`warnings_${l}`} defaultValue={LL(c.warnings, l)} rows={3} />
                <TextArea label="Conditions d'annulation" name={`cancellation_${l}`} defaultValue={L(c.cancellationPolicy, l)} rows={3} />
              </div>
            ))}
          </div>
        </Card>
        <button className="btn btn-primary">Enregistrer le circuit</button>
      </form>

      <Card title="Programme jour par jour" className="mt-8" id="programme">
        <div className="space-y-6">
          {c.itinerary.map((d) => (
            <form key={d.id} action={updateItineraryDay} className="rounded-xl bg-ivory p-4">
              <input type="hidden" name="id" value={d.id} />
              <p className="mb-2 font-semibold">Jour {d.dayNumber}</p>
              <div className="grid gap-3 lg:grid-cols-3">
                <Input label="Titre FR" name="title_fr" defaultValue={L(d.title, "fr")} />
                <Input label="Titre EN" name="title_en" defaultValue={L(d.title, "en")} />
                <Input label="Titre AR" name="title_ar" defaultValue={L(d.title, "ar")} dir="rtl" />
                <TextArea label="Description FR" name="description_fr" defaultValue={L(d.description, "fr")} />
                <TextArea label="Description EN" name="description_en" defaultValue={L(d.description, "en")} />
                <div />
                <TextArea label="Étapes FR (une par ligne)" name="items_fr" defaultValue={trList(d.items, "fr").join("\n")} rows={5} />
                <TextArea label="Étapes EN" name="items_en" defaultValue={LL(d.items, "en")} rows={5} />
              </div>
              <button className="btn btn-sand mt-3 !py-1.5 text-sm">Enregistrer le jour {d.dayNumber}</button>
            </form>
          ))}
        </div>
      </Card>

      <Card title="Dates et disponibilités" className="mt-8" id="departs">
        {demoCount > 0 && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {demoCount} départ(s) sont des disponibilités de démonstration (fictives), signalées comme telles aux clients.
            <form action={bulkDepartures} className="mt-2 flex flex-wrap gap-2">
              <input type="hidden" name="circuitId" value={c.id} />
              <button name="action" value="delete-demo" className="btn bg-white !py-1 text-xs ring-1 ring-amber-400">
                Supprimer les départs démo sans réservation
              </button>
              <button name="action" value="validate" className="btn bg-white !py-1 text-xs ring-1 ring-amber-400">
                Marquer tous les départs comme réels
              </button>
            </form>
          </div>
        )}
        <form action={generateDepartures} className="mb-6 grid gap-3 rounded-xl bg-ivory p-4 sm:grid-cols-2 lg:grid-cols-5">
          <input type="hidden" name="circuitId" value={c.id} />
          <Input label="Du" name="from" type="date" defaultValue={today} required />
          <Input label="Au" name="to" type="date" defaultValue={in90} required />
          <Input label="Capacité" name="capacity" type="number" min={1} defaultValue={c.defaultCapacity} />
          <fieldset className="lg:col-span-2">
            <legend className="label">Jours de départ (aucun = tous)</legend>
            <div className="flex flex-wrap gap-2 text-xs">
              {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((d, i) => (
                <label key={d} className="flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-night/10">
                  <input type="checkbox" name="weekday" value={i} className="accent-terracotta" /> {d}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isDemo" className="accent-terracotta" /> Départs de démonstration
          </label>
          <button className="btn btn-primary !py-2 text-sm lg:col-span-1">Générer les départs</button>
        </form>

        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-xs uppercase text-muted">
              <tr>
                {["Date", "Occupées", "Capacité", "Statut", "Démo", ""].map((h) => (
                  <th key={h} className="px-2 py-2 text-start">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.departures.map((d) => (
                <tr key={d.id} className="border-t border-night/5">
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {d.date.toISOString().slice(0, 10)} <span className="text-xs text-muted">{["dim", "lun", "mar", "mer", "jeu", "ven", "sam"][d.date.getUTCDay()]}</span>
                  </td>
                  <td className={`px-2 ${d.seatsHeld >= d.capacity ? "font-bold text-rose-700" : ""}`}>{d.seatsHeld}</td>
                  <td className="px-2" colSpan={4}>
                    <form action={updateDeparture} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={d.id} />
                      <input name="capacity" type="number" min={d.seatsHeld} defaultValue={d.capacity} className="field w-20 !py-1 text-sm" aria-label="Capacité" />
                      <select name="status" defaultValue={d.status} className="field w-36 !py-1 text-sm" aria-label="Statut">
                        <option value="OPEN">Ouvert</option>
                        <option value="CLOSED">Fermé</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="isDemo" defaultChecked={d.isDemo} className="accent-terracotta" /> démo
                      </label>
                      <button className="text-xs font-semibold text-terracotta hover:underline">OK</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
