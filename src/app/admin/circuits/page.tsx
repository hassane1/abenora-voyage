import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { createCircuit } from "../actions";
import { duplicateCircuit } from "../config-actions";
import { Badge, Card, PageTitle, priceStatusLabel } from "../ui";

export default async function CircuitsAdmin() {
  await requireAdmin("catalog.write");
  const [circuits, destinations] = await Promise.all([
    db.circuit.findMany({ include: { destination: true, _count: { select: { departures: true, bookings: true } } }, orderBy: [{ destination: { sortOrder: "asc" } }, { sortOrder: "asc" }] }),
    db.destination.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div>
      <PageTitle title="Circuits & disponibilités" />
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-night/5">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-xs uppercase tracking-wider text-muted">
            <tr>
              {["Circuit", "Destination", "Durée", "Prix adulte", "Statut tarif", "Départs", "Réservations", "Publié", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-start">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {circuits.map((c) => (
              <tr key={c.id} className="border-t border-night/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/circuits/${c.id}`} className="font-semibold text-terracotta hover:underline">
                    {tr(c.title, "fr")}
                  </Link>
                </td>
                <td className="px-4 py-3">{tr(c.destination.name, "fr")}</td>
                <td className="px-4 py-3">
                  {c.days} j / {c.nights} n
                </td>
                <td className="px-4 py-3">{c.priceAdultMad ? `${c.priceAdultMad.toLocaleString("fr-FR")} MAD` : "—"}</td>
                <td className="px-4 py-3">
                  <Badge cls={c.priceStatus === "VALIDATED" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}>{priceStatusLabel[c.priceStatus]}</Badge>
                </td>
                <td className="px-4 py-3">{c._count.departures}</td>
                <td className="px-4 py-3">{c._count.bookings}</td>
                <td className="px-4 py-3">{c.published ? "Oui" : "Non"}</td>
                <td className="px-4 py-3">
                  <form action={duplicateCircuit}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-xs text-terracotta hover:underline" title="Crée une copie non publiée (programme, étapes, options, tarifs) sans les départs ni les réservations">
                      Dupliquer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card title="Créer un circuit" className="mt-8 max-w-2xl">
        <form action={createCircuit} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Destination</span>
            <select name="destinationId" className="field !py-2 text-sm">
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {tr(d.name, "fr")} {d.published ? "" : "(non publiée)"}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Titre (FR)</span>
            <input name="title_fr" required className="field !py-2 text-sm" />
          </label>
          <label className="block">
            <span className="label">Nombre de jours</span>
            <input name="days" type="number" min={1} max={30} defaultValue={2} className="field !py-2 text-sm" />
          </label>
          <label className="block">
            <span className="label">Ville de départ</span>
            <input name="startPoint" className="field !py-2 text-sm" />
          </label>
          <p className="text-xs text-muted sm:col-span-2">Le circuit est créé non publié, « sur devis », sans départ : complétez-le avant publication.</p>
          <button className="btn btn-primary !py-2 text-sm sm:w-fit">Créer</button>
        </form>
      </Card>
    </div>
  );
}
