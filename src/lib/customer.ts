import "server-only";
import { cookies, headers } from "next/headers";
import { db } from "./db";
import { randomToken, sha256 } from "./security";

/**
 * Sessions des comptes voyageurs : jeton aléatoire (256 bits) dans un cookie httpOnly,
 * seule son empreinte SHA-256 est stockée en base → révocables individuellement ou toutes à la fois.
 */
const COOKIE = "traveler_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours (durée maximale)
const IDLE_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours d'inactivité

export async function createCustomerSession(customerId: string) {
  const token = randomToken();
  const ua = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db.customerSession.create({ data: { tokenHash: sha256(token), customerId, userAgent: ua, expiresAt: new Date(Date.now() + MAX_AGE * 1000) } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}

export async function getCustomer() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length < 20) return null;
  const s = await db.customerSession.findUnique({ where: { tokenHash: sha256(token) }, include: { customer: true } });
  const now = Date.now();
  if (!s || s.expiresAt.getTime() < now) return null;
  // expiration après 7 jours sans activité : la session est supprimée, le voyageur doit se reconnecter
  if (now - s.lastSeenAt.getTime() > IDLE_MS) {
    await db.customerSession.delete({ where: { id: s.id } }).catch(() => {});
    return null;
  }
  // dernière activité mise à jour au plus une fois par heure (limite les écritures)
  if (now - s.lastSeenAt.getTime() > 60 * 60 * 1000) await db.customerSession.update({ where: { id: s.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  return s.customer;
}

export async function destroyCustomerSession(all = false) {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const s = await db.customerSession.findUnique({ where: { tokenHash: sha256(token) } });
    if (s) {
      if (all) await db.customerSession.deleteMany({ where: { customerId: s.customerId } });
      else await db.customerSession.delete({ where: { id: s.id } });
    }
  }
  jar.delete(COOKIE);
}

/** Jeton à usage unique (vérification d'e-mail, réinitialisation) : renvoie la valeur en clair à envoyer par e-mail */
export async function issueCustomerToken(customerId: string, kind: "VERIFY_EMAIL" | "RESET_PASSWORD", ttlMinutes: number) {
  const token = randomToken();
  // un seul jeton actif par type
  await db.customerToken.deleteMany({ where: { customerId, kind, usedAt: null } });
  await db.customerToken.create({ data: { tokenHash: sha256(token), kind, customerId, expiresAt: new Date(Date.now() + ttlMinutes * 60_000) } });
  return token;
}

export async function consumeCustomerToken(token: string, kind: "VERIFY_EMAIL" | "RESET_PASSWORD") {
  if (!token || token.length < 20) return null;
  const t = await db.customerToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!t || t.kind !== kind || t.usedAt || t.expiresAt < new Date()) return null;
  // consommation atomique : un seul usage même en cas de double clic
  const n = await db.customerToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
  return n.count === 1 ? t.customerId : null;
}

/**
 * Droit d'accès à un dossier : soit le jeton secret du dossier (réservation sans compte, lien reçu par e-mail),
 * soit le compte voyageur auquel le dossier est rattaché.
 */
export async function findAccessibleBooking(ref: string, token?: string | null) {
  const reference = ref.trim().toUpperCase().slice(0, 40);
  if (!reference) return null;
  if (token && token.length >= 20) {
    const b = await db.booking.findFirst({ where: { reference, accessToken: token } });
    if (b) return b;
  }
  const c = await getCustomer();
  if (c) return db.booking.findFirst({ where: { reference, customerId: c.id } });
  return null;
}
