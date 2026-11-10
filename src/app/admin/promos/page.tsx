import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { deletePromo, savePromo } from "../actions";
import { Card, Flash, Input, PageTitle } from "../ui";

export default async function PromosAdmin({ searchParams }: PageProps<"/admin/promos">) {
  await requireAdmin();
  const sp = await searchParams;
  const [promos, s] = await Promise.all([db.promoCode.findMany({ orderBy: { createdAt: "desc" } }), getSettings()]);
  return (
    <div>
      <PageTitle title="Codes promo & offres" />
      <Flash sp={sp} />
      <Card title="Réductions automatiques" className="mb-6">
        <p className="text-sm text-muted">
          Famille (2 adultes + 2 enfants ou plus) : <strong>{s.familyDiscountPercent ?? 0} %</strong> · Groupe (dès {s.groupDiscountMinPeople ?? "—"} voyageurs) :{" "}
          <strong>{s.groupDiscountPercent ?? 0} %</strong> — non cumulables, la plus avantageuse s&apos;applique.{" "}
          <Link href="/admin/parametres" className="text-terracotta underline">
            Modifier
          </Link>
        </p>
      </Card>
      <Card title="Créer ou modifier un code (offre saisonnière, partenaire…)">
        <form action={savePromo} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Code" name="code" required placeholder="PRINTEMPS26" />
          <Input label="Réduction (%)" name="percentOff" type="number" min={1} max={90} required />
          <Input label="Valable du" name="validFrom" type="date" />
          <Input label="Au" name="validTo" type="date" />
          <Input label="Voyageurs minimum" name="minPeople" type="number" min={1} defaultValue={1} />
          <Input label="Description interne" name="description" />
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" name="active" defaultChecked className="accent-terracotta" /> Actif
          </label>
          <button className="btn btn-primary !py-2 text-sm">Enregistrer</button>
        </form>
      </Card>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-night/5">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-xs uppercase text-muted">
            <tr>
              {["Code", "Réduction", "Validité", "Min.", "Actif", "Utilisations", ""].map((h) => (
                <th key={h} className="px-4 py-2 text-start">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  Aucun code promo.
                </td>
              </tr>
            )}
            {await Promise.all(
              promos.map(async (p) => (
                <tr key={p.id} className="border-t border-night/5">
                  <td className="px-4 py-2 font-mono font-semibold">{p.code}</td>
                  <td className="px-4 py-2">{p.percentOff} %</td>
                  <td className="px-4 py-2 text-xs">
                    {p.validFrom?.toISOString().slice(0, 10) ?? "…"} → {p.validTo?.toISOString().slice(0, 10) ?? "…"}
                  </td>
                  <td className="px-4 py-2">{p.minPeople}</td>
                  <td className="px-4 py-2">{p.active ? "Oui" : "Non"}</td>
                  <td className="px-4 py-2">{await db.booking.count({ where: { promoCode: p.code } })}</td>
                  <td className="px-4 py-2">
                    <form action={deletePromo}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-xs text-rose-700 hover:underline">Supprimer</button>
                    </form>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
