import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { can, type Permission } from "./rbac";
import { decrypt, verifyTotp } from "./security";

/**
 * Authentification de l'administration.
 * - Mot de passe (bcrypt, coût 12) puis, si activé, code TOTP (MFA) : deux étapes, deux cookies distincts.
 * - Session : JWT signé HS256 dans un cookie httpOnly / SameSite=Strict / Secure en production, 8 h.
 * - À chaque requête, le compte est relu en base : un compte désactivé ou un rôle modifié s'applique immédiatement.
 * - MFA obligatoire (ADMIN_MFA_REQUIRED=false pour le désactiver en développement uniquement) :
 *   tant qu'il n'est pas configuré, seul l'écran Sécurité est accessible.
 */
const COOKIE = "admin_session";
const MFA_COOKIE = "admin_mfa_pending";
const MAX_AGE = 60 * 60 * 8;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET manquant ou trop court (voir .env)");
  return new TextEncoder().encode(s);
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/admin",
  maxAge,
});

export type AdminSession = { id: string; email: string; name: string; role: string; mfaEnabled: boolean; mfaPassed: boolean };

const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO5bvYxYbqJ9b1u5zQ3bM5i8eWqk6Xq2a";

/** Étape 1 : mot de passe. Retourne "mfa" si un code TOTP est attendu. */
export async function signIn(email: string, password: string): Promise<"ok" | "mfa" | "fail"> {
  const user = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  // comparaison systématique pour limiter les attaques temporelles (énumération de comptes)
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) return "fail";
  if (user.mfaEnabled && user.mfaSecret) {
    const token = await new SignJWT({ stage: "mfa" }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("5m").sign(secret());
    (await cookies()).set(MFA_COOKIE, token, cookieOpts(300));
    return "mfa";
  }
  await openSession(user.id, false);
  return "ok";
}

/** Étape 2 : code TOTP */
export async function verifyMfaStep(code: string): Promise<{ ok: boolean; email?: string }> {
  const jar = await cookies();
  const pending = jar.get(MFA_COOKIE)?.value;
  if (!pending) return { ok: false };
  try {
    const { payload } = await jwtVerify(pending, secret());
    if (payload.stage !== "mfa") return { ok: false };
    const user = await db.adminUser.findUnique({ where: { id: String(payload.sub) } });
    if (!user?.active || !user.mfaSecret || !verifyTotp(decrypt(user.mfaSecret), code)) return { ok: false, email: user?.email };
    jar.delete({ name: MFA_COOKIE, path: "/admin" });
    await openSession(user.id, true);
    return { ok: true, email: user.email };
  } catch {
    return { ok: false };
  }
}

export async function openSession(userId: string, mfaPassed: boolean) {
  const user = await db.adminUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  const token = await new SignJWT({ email: user.email, mfa: mfaPassed })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, cookieOpts(MAX_AGE));
}

export async function signOut() {
  const jar = await cookies();
  jar.delete({ name: COOKIE, path: "/admin" });
  jar.delete({ name: MFA_COOKIE, path: "/admin" });
}

export async function getAdmin(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const user = await db.adminUser.findUnique({ where: { id: String(payload.sub) } });
    if (!user || !user.active) return null;
    // une session ouverte avant l'activation du MFA reste valable pour finir la configuration,
    // mais une session sans MFA n'est jamais acceptée pour un compte qui l'a activé… sauf juste après l'activation
    const mfaPassed = payload.mfa === true;
    return { id: user.id, email: user.email, name: user.name, role: user.role, mfaEnabled: user.mfaEnabled, mfaPassed };
  } catch {
    return null;
  }
}

export const mfaRequired = () => process.env.ADMIN_MFA_REQUIRED !== "false";

/**
 * À appeler en tête de chaque page / action d'administration.
 * @param perm permission requise (RBAC) ; sans permission : tout membre de l'équipe connecté
 */
export async function requireAdmin(perm?: Permission, opts: { allowWithoutMfa?: boolean } = {}): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (!opts.allowWithoutMfa) {
    if (admin.mfaEnabled && !admin.mfaPassed) redirect("/admin/securite?mfa=relogin");
    if (!admin.mfaEnabled && mfaRequired()) redirect("/admin/securite?mfa=setup");
  }
  if (perm && !can(admin.role, perm)) redirect("/admin?denied=1");
  return admin;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function checkPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}
