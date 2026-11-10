import Link from "next/link";
import { requireAdmin, safeAdminPath } from "@/lib/auth";
import { confirmIdentity } from "../actions";

/** Ré-authentification avant une opération critique (équipe, rôles, identité, remboursement) */
export default async function ConfirmPage({ searchParams }: PageProps<"/admin/confirmer">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const next = safeAdminPath(typeof sp.next === "string" ? sp.next : null);
  return (
    <div className="mx-auto max-w-sm py-10">
      <form action={confirmIdentity} className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
        <h1 className="text-lg font-semibold text-night">Confirmez votre identité</h1>
        <p className="mt-2 text-sm text-muted">
          Opération sensible : saisissez à nouveau votre mot de passe{admin.mfaEnabled ? " et le code de votre application" : ""}. La confirmation reste valable 15 minutes.
        </p>
        {sp.error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            {sp.error === "locked" ? "Trop de tentatives. Réessayez dans 15 minutes." : "Mot de passe ou code incorrect."}
          </p>
        )}
        <input type="hidden" name="next" value={next} />
        <input name="password" type="password" required autoFocus autoComplete="current-password" placeholder="Mot de passe" className="field mt-6" aria-label="Mot de passe" />
        {admin.mfaEnabled && (
          <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code" placeholder="Code à 6 chiffres" className="field mt-3 text-center tracking-[0.4em]" aria-label="Code à 6 chiffres" />
        )}
        <button className="btn btn-primary mt-6 w-full">Confirmer</button>
        <Link href={next} className="mt-4 block text-center text-xs text-muted hover:underline">
          Annuler
        </Link>
      </form>
    </div>
  );
}
