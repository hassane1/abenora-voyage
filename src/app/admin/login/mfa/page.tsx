import Link from "next/link";
import { loginMfa } from "../../actions";

export default async function MfaPage({ searchParams }: PageProps<"/admin/login/mfa">) {
  const sp = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center bg-night px-4">
      <form action={loginMfa} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <h1 className="text-lg font-semibold text-night">Vérification en deux étapes</h1>
        <p className="mt-2 text-sm text-muted">Saisissez le code à 6 chiffres affiché par votre application d&apos;authentification.</p>
        {sp.error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            Code incorrect ou expiré. Si l&apos;étape a expiré (5 min), reconnectez-vous.
          </p>
        )}
        <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus autoComplete="one-time-code" className="field mt-6 text-center text-2xl tracking-[0.5em]" aria-label="Code à 6 chiffres" />
        <button className="btn btn-primary mt-6 w-full">Valider</button>
        <Link href="/admin/login" className="mt-4 block text-center text-xs text-muted hover:underline">
          Recommencer la connexion
        </Link>
      </form>
    </div>
  );
}
