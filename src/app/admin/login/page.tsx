import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { getBrand } from "@/lib/brand";
import { login } from "../actions";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const a = await getAdmin();
  if (a && (a.mfaPassed || !a.mfaEnabled)) redirect("/admin");
  const sp = await searchParams;
  const brand = await getBrand();
  return (
    <div className="grid min-h-screen place-items-center bg-night px-4">
      <form action={login} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <p className="font-display text-2xl font-semibold tracking-[0.08em] text-terracotta uppercase">{brand.name}</p>
        <h1 className="mt-2 text-lg font-semibold text-night">Administration</h1>
        {sp.error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            {sp.error === "locked" ? "Trop de tentatives. Réessayez dans 15 minutes." : "Identifiants incorrects."}
          </p>
        )}
        <label className="mt-6 block">
          <span className="label">E-mail</span>
          <input name="email" type="email" required autoComplete="username" className="field" />
        </label>
        <label className="mt-4 block">
          <span className="label">Mot de passe</span>
          <input name="password" type="password" required autoComplete="current-password" className="field" />
        </label>
        <button className="btn btn-primary mt-6 w-full">Se connecter</button>
        <p className="mt-4 text-center text-xs text-muted">Accès réservé à l&apos;équipe de l&apos;agence. Les connexions sont journalisées.</p>
      </form>
    </div>
  );
}
