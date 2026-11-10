import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/rbac";
import { formatDate } from "@/lib/format";
import { createAdminUser, updateAdminUser } from "../config-actions";
import { Badge, Card, PageTitle } from "../ui";

const errors: Record<string, string> = {
  "1": "Informations invalides (e-mail, rôle ou mot de passe de 12 caractères minimum).",
  exists: "Un compte existe déjà avec cet e-mail.",
  self: "Vous ne pouvez pas désactiver ni réinitialiser votre propre compte.",
  lastadmin: "Il doit rester au moins un administrateur actif.",
};

export default async function UsersPage({ searchParams }: PageProps<"/admin/utilisateurs">) {
  const me = await requireAdmin("users.manage");
  const sp = await searchParams;
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div>
      <PageTitle title="Équipe & rôles" />
      {sp.ok && <p className="mb-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Modifications enregistrées.</p>}
      {typeof sp.error === "string" && <p role="alert" className="mb-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{errors[sp.error] ?? errors["1"]}</p>}
      <Card title="Rôles">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(ROLES).map(([k, v]) => (
            <li key={k}>
              <span className="font-semibold">{k}</span> — <span className="text-muted">{v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">La vérification en deux étapes est obligatoire pour tous les comptes. Chaque action critique est enregistrée dans le journal d&apos;audit.</p>
      </Card>
      <div className="mt-6 space-y-3">
        {users.map((u) => (
          <form key={u.id} action={updateAdminUser} className="grid items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-night/5 md:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
            <input type="hidden" name="id" value={u.id} />
            <div>
              <p className="text-sm font-semibold">
                {u.email} {u.id === me.id && <span className="text-xs text-muted">(vous)</span>}
              </p>
              <p className="mt-1 flex flex-wrap gap-1 text-xs text-muted">
                <Badge cls={u.mfaEnabled ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}>{u.mfaEnabled ? "MFA actif" : "MFA non configuré"}</Badge>
                {!u.active && <Badge cls="bg-slate-200 text-slate-700">Désactivé</Badge>}
                <span>Dernière connexion : {u.lastLoginAt ? formatDate(u.lastLoginAt, "fr", { dateStyle: "short", timeStyle: "short" } as Intl.DateTimeFormatOptions) : "jamais"}</span>
              </p>
            </div>
            <input name="name" defaultValue={u.name} className="field !py-2 text-sm" aria-label="Nom" />
            <select name="role" defaultValue={u.role} className="field !py-2 text-sm" aria-label="Rôle">
              {Object.keys(ROLES).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} className="accent-terracotta" /> Actif
            </label>
            <div className="flex gap-2">
              <button name="action" value="save" className="btn btn-sand !py-2 text-sm">
                Enregistrer
              </button>
              {u.mfaEnabled && u.id !== me.id && (
                <button name="action" value="reset-mfa" className="btn !py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                  Réinitialiser MFA
                </button>
              )}
            </div>
          </form>
        ))}
      </div>
      <Card title="Ajouter un membre de l'équipe" className="mt-6">
        <form action={createAdminUser} className="grid gap-3 md:grid-cols-5">
          <input name="email" type="email" required placeholder="E-mail" className="field !py-2 text-sm" />
          <input name="name" placeholder="Nom" className="field !py-2 text-sm" />
          <select name="role" className="field !py-2 text-sm" defaultValue="AGENT">
            {Object.keys(ROLES).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <input name="password" type="password" minLength={12} required autoComplete="new-password" placeholder="Mot de passe provisoire" className="field !py-2 text-sm" />
          <button className="btn btn-primary !py-2 text-sm">Créer</button>
        </form>
        <p className="mt-2 text-xs text-muted">Transmettez le mot de passe provisoire par un canal sûr. Le membre configurera sa vérification en deux étapes à la première connexion.</p>
      </Card>
    </div>
  );
}
