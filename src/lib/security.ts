import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";
import { invalidateCatalog } from "./cache";

// ---------------------------------------------------------------------------
// Jetons et empreintes
// ---------------------------------------------------------------------------
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
/** Comparaison de jetons / signatures en temps constant (pas de fuite d'information par le temps de réponse) */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ---------------------------------------------------------------------------
// Chiffrement symétrique (secrets MFA). Clé dérivée de AUTH_SECRET.
// ---------------------------------------------------------------------------
function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET manquant ou trop court (voir .env)");
  return createHash("sha256").update(`enc:${s}`).digest();
}
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}
export function decrypt(payload: string) {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}

// ---------------------------------------------------------------------------
// TOTP (RFC 6238) — compatible Google Authenticator, Microsoft Authenticator, 1Password…
// ---------------------------------------------------------------------------
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function base32Decode(s: string) {
  const clean = s.replace(/=+$/, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
export const newTotpSecret = () => base32Encode(randomBytes(20));
export function totpCode(secret: string, counter: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}
/** Vérifie un code à 6 chiffres (tolérance ± 30 s) */
export function verifyTotp(secret: string, code: string, now = Date.now()) {
  return totpStep(secret, code, now) !== null;
}
/** Pas de temps (fenêtre de 30 s) correspondant au code, ou null : sert à refuser la réutilisation d'un code */
export function totpStep(secret: string, code: string, now = Date.now()): number | null {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return null;
  const step = Math.floor(now / 30_000);
  for (const d of [-1, 0, 1]) {
    const expected = totpCode(secret, step + d);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(c))) return step + d;
  }
  return null;
}
export function otpauthUrl(secret: string, account: string, issuer: string) {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&period=30&digits=6`;
}

// ---------------------------------------------------------------------------
// Adresse IP du client.
// - TRUST_PROXY=1 (site servi uniquement via Cloudflare / le tunnel, serveur à l'écoute sur 127.0.0.1) :
//   seul l'en-tête CF-Connecting-IP, posé par Cloudflare, est pris en compte.
// - Sinon : "unknown". Aucun en-tête envoyé par le client (X-Real-IP, X-Forwarded-For) n'est jamais lu,
//   car il serait falsifiable et permettrait de contourner les limites de débit.
// ---------------------------------------------------------------------------
const IP_RE = /^[0-9a-fA-F:.]{2,45}$/;
export async function clientIp(): Promise<string> {
  const h = await headers();
  if (process.env.TRUST_PROXY === "1") {
    const cf = h.get("cf-connecting-ip")?.trim();
    if (cf && IP_RE.test(cf)) return cf;
  }
  return "unknown";
}

// ---------------------------------------------------------------------------
// Limitation de débit (fenêtre fixe) persistée en base. En production multi-instances : Redis.
// RATE_LIMIT_MULTIPLIER permet d'assouplir les limites pour les tests de charge.
// ---------------------------------------------------------------------------
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; retryAfter: number }> {
  const mult = Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER ?? 1));
  const max = limit * mult;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  // lecture + écriture dans une transaction (les écritures SQLite sont sérialisées ; PostgreSQL : verrou de ligne)
  const row = await db.$transaction(async (tx) => {
    const cur = await tx.rateLimit.findUnique({ where: { key } });
    if (!cur || cur.resetAt < now) return tx.rateLimit.upsert({ where: { key }, update: { count: 1, resetAt }, create: { key, count: 1, resetAt } });
    return tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  });
  return { ok: row.count <= max, retryAfter: Math.max(0, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)) };
}

export async function resetRateLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}

// ---------------------------------------------------------------------------
// Journal d'audit
// ---------------------------------------------------------------------------
export async function audit(actor: string, action: string, target?: string | null, details?: Record<string, unknown>) {
  if (!/^(LOGIN|LOGOUT|MFA|CUSTOMER)/.test(action)) invalidateCatalog();
  let ip: string | null = null;
  try {
    ip = await clientIp();
  } catch {
    ip = null;
  }
  await db.auditLog
    .create({ data: { actor, action, target: target ?? null, details: (details ?? undefined) as object | undefined, ip } })
    .catch((e) => console.error("[audit] échec d'écriture", e));
}

/** Politique de mot de passe minimale (ASVS 2.1 : longueur ≥ 10 ici, pas de règles de composition imposées) */
export function passwordProblem(pw: string, email?: string, opts: { staff?: boolean } = {}): string | null {
  if (pw.length < (opts.staff ? 12 : 10)) return "TOO_SHORT";
  if (pw.length > 128) return "TOO_LONG";
  if (email && pw.toLowerCase().includes(email.split("@")[0].toLowerCase()) && email.split("@")[0].length >= 4) return "CONTAINS_EMAIL";
  const common = ["motdepasse", "password", "azertyuiop", "1234567890", "qwertyuiop", "marrakech1", "morocco123"];
  if (common.some((c) => pw.toLowerCase().includes(c))) return "TOO_COMMON";
  return null;
}
