import type { ReactNode } from "react";

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-4xl font-semibold text-night">{title}</h1>
      {children}
    </div>
  );
}

export function Card({ title, children, className = "", id }: { title?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-night/5 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold text-night">{title}</h2>}
      {children}
    </section>
  );
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  if (sp.error)
    return (
      <p role="alert" className="mb-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
        {sp.error === "soldout" ? "Opération impossible : capacité insuffisante sur ce départ." : "Opération refusée : vérifiez les informations saisies."}
      </p>
    );
  if (sp.ok)
    return (
      <p role="status" className="mb-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
        Modifications enregistrées.{sp.n ? ` ${sp.n} départ(s) créé(s).` : ""}
      </p>
    );
  return null;
}

export const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  CANCELLED: "bg-slate-200 text-slate-700",
};
export const statusLabel: Record<string, string> = { PENDING: "En attente", CONFIRMED: "Confirmée", REJECTED: "Refusée", CANCELLED: "Annulée" };
export const paymentLabel: Record<string, string> = { NONE: "Aucun paiement", DEPOSIT_PAID: "Acompte reçu", PAID: "Soldé", REFUNDED: "Remboursé" };
export const priceStatusLabel: Record<string, string> = { DEMO: "Démonstration (fictif)", INDICATIVE: "Tarif publié, à confirmer", VALIDATED: "Validé", ON_REQUEST: "Sur devis" };

export function Badge({ cls, children }: { cls: string; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function Input({ label, name, defaultValue, type = "text", ...rest }: { label: string; name: string; defaultValue?: string | number | null; type?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} className="field !py-2 text-sm" {...rest} />
    </label>
  );
}

export function TextArea({ label, name, defaultValue, rows = 3, dir }: { label: string; name: string; defaultValue?: string; rows?: number; dir?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} dir={dir} className="field !py-2 text-sm" />
    </label>
  );
}

export function PriceStatusSelect({ name = "priceStatus", value }: { name?: string; value: string }) {
  return (
    <label className="block">
      <span className="label">Statut du tarif</span>
      <select name={name} defaultValue={value} className="field !py-2 text-sm">
        {Object.entries(priceStatusLabel).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
