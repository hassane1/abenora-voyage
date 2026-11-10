import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { statusLabel } from "../../ui";
import PrintButton from "@/components/PrintButton";

/** Liste imprimable → « Enregistrer au format PDF » depuis le navigateur */
export default async function PrintBookings({ searchParams }: PageProps<"/admin/reservations/imprimer">) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await db.booking.findMany({
    where: { ...(typeof sp.status === "string" && sp.status ? { status: sp.status } : {}), ...(typeof sp.circuit === "string" && sp.circuit ? { circuitId: sp.circuit } : {}) },
    include: { circuit: true },
    orderBy: { startDate: "asc" },
  });
  return (
    <div className="bg-white p-6 text-sm">
      <div className="no-print mb-4">
        <PrintButton label="Imprimer / Enregistrer en PDF" className="btn btn-primary" />
      </div>
      <h1 className="font-display text-3xl">Réservations — export du {new Date().toLocaleDateString("fr-FR")}</h1>
      <table className="mt-6 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-night text-start">
            {["Dossier", "Statut", "Circuit", "Départ", "Voy.", "Client", "Téléphone", "Total MAD"].map((h) => (
              <th key={h} className="py-2 pe-2 text-start">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-b border-night/10">
              <td className="py-1.5 pe-2 font-mono">{b.reference}</td>
              <td className="pe-2">{statusLabel[b.status]}</td>
              <td className="pe-2">{tr(b.circuit.title, "fr")}</td>
              <td className="pe-2">{b.startDate.toISOString().slice(0, 10)}</td>
              <td className="pe-2">
                {b.adults}+{b.children}
              </td>
              <td className="pe-2">
                {b.firstName} {b.lastName}
              </td>
              <td className="pe-2">{b.phone}</td>
              <td className="pe-2">
                {b.totalMad.toLocaleString("fr-FR")}
                {b.pricesAreDemo ? " (démo)" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
