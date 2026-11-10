import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateOption } from "../actions";
import { Flash, PageTitle } from "../ui";

const L = (v: unknown, l: string) => ((v ?? {}) as Record<string, string>)[l] ?? "";

export default async function OptionsAdmin({ searchParams }: PageProps<"/admin/options">) {
  await requireAdmin();
  const sp = await searchParams;
  const options = await db.bookingOption.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] });
  return (
    <div>
      <PageTitle title="Options & suppléments" />
      <Flash sp={sp} />
      <p className="mb-4 text-sm text-muted">Options proposées à l&apos;étape « Personnaliser le séjour ». Le prix est multiplié selon l&apos;unité (par personne, par réservation, par personne et par nuit).</p>
      <div className="space-y-3">
        {options.map((o) => (
          <form key={o.id} action={updateOption} className="grid items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-night/5 md:grid-cols-[1fr_1fr_1fr_110px_170px_170px_auto_auto]">
            <input type="hidden" name="id" value={o.id} />
            <label className="block">
              <span className="label text-xs">{o.group} · FR</span>
              <input name="label_fr" defaultValue={L(o.label, "fr")} className="field !py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className="label text-xs">EN</span>
              <input name="label_en" defaultValue={L(o.label, "en")} className="field !py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className="label text-xs">AR</span>
              <input name="label_ar" defaultValue={L(o.label, "ar")} dir="rtl" className="field !py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className="label text-xs">Prix MAD</span>
              <input name="priceMad" type="number" min={0} defaultValue={o.priceMad} className="field !py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className="label text-xs">Unité</span>
              <select name="unit" defaultValue={o.unit} className="field !py-1.5 text-sm">
                <option value="PER_PERSON">Par personne</option>
                <option value="PER_BOOKING">Par réservation</option>
                <option value="PER_PERSON_NIGHT">Par pers. / nuit (ou jour)</option>
              </select>
            </label>
            <label className="block">
              <span className="label text-xs">Statut du tarif</span>
              <select name="priceStatus" defaultValue={o.priceStatus} className="field !py-1.5 text-sm">
                <option value="DEMO">Démonstration</option>
                <option value="VALIDATED">Validé</option>
              </select>
            </label>
            <label className="flex items-center gap-1 pb-2 text-xs">
              <input type="checkbox" name="published" defaultChecked={o.published} className="accent-terracotta" /> Publiée
            </label>
            <button className="btn btn-sand !py-1.5 text-sm">OK</button>
          </form>
        ))}
      </div>
    </div>
  );
}
