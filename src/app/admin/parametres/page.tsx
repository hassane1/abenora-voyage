import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "../actions";
import { Card, Flash, Input, PageTitle } from "../ui";

export default async function SettingsAdmin({ searchParams }: PageProps<"/admin/parametres">) {
  await requireAdmin();
  const sp = await searchParams;
  const s = await getSettings();
  const env = [
    ["Base de données", process.env.DATABASE_URL?.startsWith("file:") ? "SQLite local (développement)" : "Externe (PostgreSQL)"],
    ["E-mails (SMTP)", process.env.SMTP_HOST ? `Configuré : ${process.env.SMTP_HOST}` : "Non configuré — e-mails journalisés uniquement"],
    ["WhatsApp", process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? `Configuré : +${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}` : "Non configuré"],
    ["Routage carte (OSRM)", process.env.NEXT_PUBLIC_OSRM_URL ?? "router.project-osrm.org (serveur de démonstration public)"],
    ["Paiement en ligne (mode B)", "Non activé — architecture prête, prestataire à choisir (voir README)"],
  ];
  return (
    <div>
      <PageTitle title="Paramètres" />
      <Flash sp={sp} />
      <form action={saveSettings}>
        <Card title="Fiscalité et réductions">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Taux de taxe (%)" name="taxRatePercent" type="number" min={0} max={100} step="0.1" defaultValue={s.taxRatePercent} />
            <Input label="Réduction famille (%)" name="familyDiscountPercent" type="number" min={0} max={50} defaultValue={s.familyDiscountPercent} />
            <Input label="Réduction groupe (%)" name="groupDiscountPercent" type="number" min={0} max={50} defaultValue={s.groupDiscountPercent} />
            <Input label="Groupe à partir de (voyageurs)" name="groupDiscountMinPeople" type="number" min={2} defaultValue={s.groupDiscountMinPeople} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" name="pricesIncludeTax" defaultChecked={s.pricesIncludeTax === "true"} className="accent-terracotta" /> Les prix saisis sont TTC (sinon la taxe est ajoutée au total)
          </label>
          <p className="mt-3 text-xs text-muted">Le taux applicable dépend du statut de votre agence : faites-le valider par votre expert-comptable. Il est à 0 % tant qu&apos;il n&apos;est pas renseigné.</p>
          <button className="btn btn-primary mt-4 !py-2 text-sm">Enregistrer</button>
        </Card>
      </form>
      <Card title="État des intégrations" className="mt-6">
        <dl className="divide-y divide-night/5 text-sm">
          {env.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-muted">{k}</dt>
              <dd className="text-end font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
