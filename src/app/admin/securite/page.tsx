import QRCode from "qrcode";
import { requireAdmin, mfaRequired } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrand } from "@/lib/brand";
import { decrypt, otpauthUrl } from "@/lib/security";
import { changeOwnPassword, confirmMfaSetup, startMfaSetup } from "../config-actions";
import { logout } from "../actions";
import { Card, PageTitle } from "../ui";

export default async function SecurityPage({ searchParams }: PageProps<"/admin/securite">) {
  const admin = await requireAdmin(undefined, { allowWithoutMfa: true });
  const sp = await searchParams;
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  const brand = await getBrand();
  let qr: string | null = null;
  let secret: string | null = null;
  if (!user.mfaEnabled && user.mfaSecret && sp.setup) {
    secret = decrypt(user.mfaSecret);
    qr = await QRCode.toDataURL(otpauthUrl(secret, user.email, brand.name), { margin: 1, width: 220 });
  }
  const needsRelogin = user.mfaEnabled && !admin.mfaPassed;

  return (
    <div className="mx-auto max-w-3xl">
      {!admin.mfaPassed && !user.mfaEnabled && (
        <div className="mb-6 rounded-2xl bg-night p-6 text-white">
          <p className="font-display text-2xl text-sand">{brand.name} — Administration</p>
          <p className="mt-2 text-sm text-white/80">
            {mfaRequired()
              ? "La vérification en deux étapes est obligatoire pour accéder à l'administration. Configurez-la ci-dessous (2 minutes)."
              : "Vérification en deux étapes recommandée (désactivée par ADMIN_MFA_REQUIRED=false, à réserver au développement)."}
          </p>
        </div>
      )}
      <PageTitle title="Sécurité du compte" />
      {sp.ok && <p className="mb-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{sp.ok === "mfa" ? "Vérification en deux étapes activée." : "Mot de passe modifié."}</p>}
      {sp.error && (
        <p role="alert" className="mb-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {sp.error === "code" ? "Code incorrect : vérifiez l'heure de votre téléphone et réessayez." : sp.error === "current" ? "Mot de passe actuel incorrect." : "Nouveau mot de passe refusé : 12 caractères minimum, différent de l'e-mail, confirmation identique."}
        </p>
      )}
      {needsRelogin && <p className="mb-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Votre session n&apos;a pas été validée par le code MFA. Déconnectez-vous puis reconnectez-vous.</p>}

      <Card title="Vérification en deux étapes (MFA)">
        {user.mfaEnabled ? (
          <p className="text-sm text-emerald-800">✓ Active. Un code de votre application d&apos;authentification est demandé à chaque connexion. En cas de perte du téléphone, un autre administrateur peut la réinitialiser (Équipe &amp; rôles).</p>
        ) : qr && secret ? (
          <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code de configuration" width={220} height={220} className="rounded-xl ring-1 ring-night/10" />
            <div className="text-sm">
              <ol className="list-decimal space-y-2 ps-5 text-night/80">
                <li>Ouvrez Google Authenticator, Microsoft Authenticator, 1Password ou équivalent.</li>
                <li>Scannez le QR code (ou saisissez la clé ci-dessous).</li>
                <li>Entrez le code à 6 chiffres affiché.</li>
              </ol>
              <p className="mt-3 break-all rounded-lg bg-ivory p-2 font-mono text-xs">{secret}</p>
              <form action={confirmMfaSetup} className="mt-4 flex gap-2">
                <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required placeholder="123456" className="field !py-2 text-center tracking-[0.3em]" aria-label="Code à 6 chiffres" />
                <button className="btn btn-primary !py-2 text-sm">Activer</button>
              </form>
            </div>
          </div>
        ) : (
          <form action={startMfaSetup}>
            <p className="text-sm text-muted">Protège l&apos;accès même si votre mot de passe est compromis.</p>
            <button className="btn btn-primary mt-4 !py-2 text-sm">Configurer maintenant</button>
          </form>
        )}
      </Card>

      {admin.mfaPassed || !mfaRequired() ? (
        <Card title="Changer mon mot de passe" className="mt-6">
          <form action={changeOwnPassword} className="grid gap-3 sm:grid-cols-3">
            <input name="current" type="password" required autoComplete="current-password" placeholder="Mot de passe actuel" className="field !py-2 text-sm" />
            <input name="next" type="password" required minLength={12} autoComplete="new-password" placeholder="Nouveau (12 caractères min.)" className="field !py-2 text-sm" />
            <input name="confirm" type="password" required minLength={12} autoComplete="new-password" placeholder="Confirmation" className="field !py-2 text-sm" />
            <button className="btn btn-sand !py-2 text-sm sm:w-fit">Modifier</button>
          </form>
        </Card>
      ) : null}
      <form action={logout} className="mt-6">
        <button className="text-sm text-rose-700 hover:underline">Se déconnecter</button>
      </form>
    </div>
  );
}
