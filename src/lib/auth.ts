import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { can, type Permission } from "./rbac";
import { clientIp, decrypt, randomToken, sha256, totpStep } from "./security";
import { invalidateCatalog } from "./cache";
import { checkPassword as verifyPw, hashPassword as hashPw, needsRehash } from "./password";

/**
 * Authentification de l'administration.
 * - Mot de passe (Argon2id ; anciens bcrypt migrés à la connexion) puis code TOTP (MFA) : deux étapes, deux cookies.
 * - Session côté serveur (table AdminSession) : identifiant aléatoire de 256 bits dans un JWT signé, cookie
 *   httpOnly / SameSite=Strict / Secure en production / chemin /admin. Durée maximale 8 h, inactivité 60 min.
 *   Révocable : déconnexion, changement de mot de passe, changement de rôle, désactivation, réinitialisation MFA.
 * - Rotation de l'identifiant à chaque élévation (mot de passe → MFA, ré-authentification).
 * - Ré-authentification (mot de passe + code) exigée pour les opérations critiques : requireRecentAuth().
 * - À chaque requête, le compte et la session sont relus en base : effet immédiat de toute révocation.
 * - MFA obligatoire (ADMIN_MFA_REQUIRED=false pour le désactiver en développement uniquement).
 */
const COOKIE = "admin_session";
const MFA_COOKIE = "admin_mfa_pending";
const MAX_AGE = 60 * 60 * 8;
const IDLE_MS = 60 * 60 * 1000;
export const REAUTH_MS = 15 * 60 * 1000;

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

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: string;
  mfaEnabled: boolean;
  mfaPassed: boolean;
  authAt: Date;
  sessionId: string;
};

export async function hashPassword(pw: string) {
  return hashPw(pw);
}
export async function checkPassword(pw: string, hash: string | null | undefined) {
  return verifyPw(pw, hash);
}

/** Vérifie un code TOTP et refuse sa réutilisation (le pas accepté est mémorisé de façon atomique) */
export async function consumeTotp(userId: string, encSecret: string, code: string): Promise<boolean> {
  const step = totpStep(decrypt(encSecret), code);
  if (step === null) return false;
  const r = await db.adminUser.updateMany({
    where: { id: userId, OR: [{ mfaLastStep: null }, { mfaLastStep: { lt: step } }] },
    data: { mfaLastStep: step },
  });
  return r.count === 1;
}

/** Étape 1 : mot de passe. Retourne "mfa" si un code TOTP est attendu. */
export async function signIn(email: string, password: string): Promise<"ok" | "mfa" | "fail"> {
  const user = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  // vérification systématique (hachage factice si le compte n'existe pas) : pas d'énumération par le temps
  const ok = await verifyPw(password, user?.passwordHash);
  if (!user || !ok || !user.active) return "fail";
  if (needsRehash(user.passwordHash)) await db.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPw(password) } });
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
    if (!user?.active || !user.mfaSecret || !(await consumeTotp(user.id, user.mfaSecret, code))) return { ok: false, email: user?.email };
    jar.delete({ name: MFA_COOKIE, path: "/admin" });
    await openSession(user.id, true);
    return { ok: true, email: user.email };
  } catch {
    return { ok: false };
  }
}

async function currentSid(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sid === "string" ? payload.sid : null;
  } catch {
    return null;
  }
}

/**
 * Ouvre une nouvelle session (et révoque la précédente de ce navigateur : rotation de l'identifiant).
 * @param keepAuthAt conserve l'heure de dernière authentification
 */
export async function openSession(userId: string, mfaPassed: boolean, opts: { keepAuthAt?: Date } = {}) {
  const old = await currentSid();
  if (old) await db.adminSession.updateMany({ where: { id: sha256(old), revokedAt: null }, data: { revokedAt: new Date() } });
  const user = await db.adminUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  const sid = randomToken(32);
  let ip: string | null = null;
  let ua: string | null = null;
  try {
    ip = await clientIp();
    ua = ((await headers()).get("user-agent") ?? "").slice(0, 200);
  } catch {
    /* hors requête */
  }
  await db.adminSession.create({
    data: {
      id: sha256(sid),
      userId: user.id,
      mfaPassed,
      authAt: opts.keepAuthAt ?? new Date(),
      expiresAt: new Date(Date.now() + MAX_AGE * 1000),
      ip,
      userAgent: ua,
    },
  });
  const token = await new SignJWT({ sid }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  (await cookies()).set(COOKIE, token, cookieOpts(MAX_AGE));
}

export async function signOut() {
  const sid = await currentSid();
  if (sid) await db.adminSession.updateMany({ where: { id: sha256(sid), revokedAt: null }, data: { revokedAt: new Date() } });
  const jar = await cookies();
  jar.delete({ name: COOKIE, path: "/admin" });
  jar.delete({ name: MFA_COOKIE, path: "/admin" });
}

/** Révoque toutes les sessions d'un membre (sauf, éventuellement, la session courante) */
export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  await db.adminSession.updateMany({
    where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    data: { revokedAt: new Date() },
  });
}

export async function getAdmin(): Promise<AdminSession | null> {
  const sid = await currentSid();
  if (!sid) return null;
  const s = await db.adminSession.findUnique({ where: { id: sha256(sid) }, include: { user: true } });
  const now = Date.now();
  if (!s || s.revokedAt || s.expiresAt.getTime() < now || now - s.lastSeenAt.getTime() > IDLE_MS) return null;
  if (!s.user.active) return null;
  if (now - s.lastSeenAt.getTime() > 60_000) await db.adminSession.update({ where: { id: s.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  const u = s.user;
  return { id: u.id, email: u.email, name: u.name, role: u.role, mfaEnabled: u.mfaEnabled, mfaPassed: s.mfaPassed, authAt: s.authAt, sessionId: s.id };
}

export const mfaRequired = () => process.env.ADMIN_MFA_REQUIRED !== "false";

/** Même règle que requireAdmin, pour les routes (exports, documents) : MFA validé, ou MFA non exigé et non activé */
export const adminMfaOk = (a: AdminSession) => a.mfaPassed || (!a.mfaEnabled && !mfaRequired());

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
  // toute action d'écriture du back-office rafraîchit le cache du site public
  if (perm && /\.(write|manage)$/.test(perm)) invalidateCatalog();
  return admin;
}

/** Chemin interne de retour sûr (anti redirection ouverte) */
export function safeAdminPath(p: string | null | undefined, fallback = "/admin") {
  if (!p || !p.startsWith("/admin") || p.startsWith("//") || /[\\\s]/.test(p) || p.includes("://")) return fallback;
  return p.slice(0, 300);
}

/**
 * Opérations critiques (équipe, rôles, identité, paiements, MFA d'un tiers) : mot de passe (+ code) saisi
 * il y a moins de 15 minutes. Sinon, renvoi vers l'écran de confirmation puis retour à `back`.
 */
export async function requireRecentAuth(admin: AdminSession, back: string) {
  if (Date.now() - admin.authAt.getTime() <= REAUTH_MS) return;
  redirect(`/admin/confirmer?next=${encodeURIComponent(safeAdminPath(back))}`);
}

/** Ré-authentification : mot de passe + code TOTP (si activé). Nouvelle session (rotation). */
export async function reauthenticate(admin: AdminSession, password: string, code: string): Promise<boolean> {
  const user = await db.adminUser.findUnique({ where: { id: admin.id } });
  if (!user?.active || !(await verifyPw(password, user.passwordHash))) return false;
  if (user.mfaEnabled) {
    if (!user.mfaSecret || !(await consumeTotp(user.id, user.mfaSecret, code))) return false;
  }
  await openSession(user.id, user.mfaEnabled ? true : admin.mfaPassed);
  return true;
}
