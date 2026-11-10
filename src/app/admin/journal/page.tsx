import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PageTitle } from "../ui";

const LABELS: Record<string, string> = {
  LOGIN_OK: "Connexion",
  LOGIN_FAIL: "Échec de connexion",
  LOGIN_THROTTLED: "Connexion bloquée (trop de tentatives)",
  MFA_FAIL: "Code MFA incorrect",
  MFA_ENABLED: "MFA activé",
  LOGOUT: "Déconnexion",
  PASSWORD_CHANGED: "Mot de passe modifié",
  BOOKING_STATUS: "Statut de réservation",
  PAYMENT_RECORDED: "Paiement enregistré",
  REFUND_RECORDED: "Remboursement enregistré",
  CIRCUIT_UPDATE: "Circuit / tarif modifié",
  SETTINGS_UPDATE: "Paramètres de tarification",
  BRAND_UPDATE: "Identité de l'agence",
  USER_CREATED: "Membre ajouté",
  USER_UPDATED: "Membre modifié",
  USER_MFA_RESET: "MFA réinitialisé",
  QUOTE_SENT: "Devis envoyé",
  QUOTE_CONVERTED: "Devis transformé en réservation",
  DOCUMENT_UPLOAD: "Document déposé",
  CUSTOMER_LOGIN_FAIL: "Échec connexion client",
};

export default async function AuditPage({ searchParams }: PageProps<"/admin/journal">) {
  await requireAdmin("audit.read");
  const sp = await searchParams;
  const action = typeof sp.action === "string" ? sp.action : "";
  const actor = typeof sp.actor === "string" ? sp.actor.slice(0, 120) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { ...(action ? { action } : {}), ...(actor ? { actor: { contains: actor } } : {}) };
  const [logs, total, actions] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, skip: (page - 1) * 100 }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({ by: ["action"], _count: true }),
  ]);
  return (
    <div>
      <PageTitle title="Journal d'audit" />
      <p className="mb-4 text-sm text-muted">Toutes les actions critiques (connexions, statuts, paiements, tarifs, paramètres, équipe) sont enregistrées avec l&apos;auteur, la date et l&apos;adresse IP. Ce journal n&apos;est pas modifiable depuis l&apos;interface.</p>
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="action" defaultValue={action} className="field !w-auto !py-2 text-sm">
          <option value="">Toutes les actions</option>
          {actions.map((a) => (
            <option key={a.action} value={a.action}>
              {LABELS[a.action] ?? a.action} ({a._count})
            </option>
          ))}
        </select>
        <input name="actor" defaultValue={actor} placeholder="Auteur (e-mail)" className="field !w-auto !py-2 text-sm" />
        <button className="btn btn-sand !py-2 text-sm">Filtrer</button>
      </form>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-night/5">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-start text-xs uppercase text-muted">
            <tr>
              <th className="p-3 text-start">Date</th>
              <th className="p-3 text-start">Auteur</th>
              <th className="p-3 text-start">Action</th>
              <th className="p-3 text-start">Cible</th>
              <th className="p-3 text-start">Détails</th>
              <th className="p-3 text-start">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-night/5 align-top">
                <td className="whitespace-nowrap p-3">{formatDate(l.createdAt, "fr", { dateStyle: "short", timeStyle: "medium" } as Intl.DateTimeFormatOptions)}</td>
                <td className="p-3">{l.actor}</td>
                <td className={`p-3 ${/FAIL|THROTTLED/.test(l.action) ? "font-semibold text-rose-700" : ""}`}>{LABELS[l.action] ?? l.action}</td>
                <td className="p-3 font-mono text-xs">{l.target}</td>
                <td className="max-w-xs truncate p-3 font-mono text-xs text-muted">{l.details ? JSON.stringify(l.details) : ""}</td>
                <td className="p-3 text-xs text-muted">{l.ip}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  Aucune entrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        {total} entrée(s){total > 100 && ` · page ${page}`}
        {total > page * 100 && (
          <a className="ms-3 text-terracotta hover:underline" href={`?action=${encodeURIComponent(action)}&actor=${encodeURIComponent(actor)}&page=${page + 1}`}>
            Page suivante →
          </a>
        )}
      </p>
    </div>
  );
}
