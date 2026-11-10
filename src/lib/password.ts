import "server-only";
import { hash, verify } from "@node-rs/argon2";
import bcrypt from "bcryptjs";

/**
 * Hachage des mots de passe : Argon2id (paramètres OWASP : m = 19 Mio, t = 2, p = 1).
 * Les anciens hachages bcrypt restent acceptés et sont migrés vers Argon2id à la connexion suivante.
 */
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (pw: string) => hash(pw, OPTS);

/** Hachage factice : la vérification prend le même temps, que le compte existe ou non (anti-énumération) */
let dummy: Promise<string> | null = null;
export const dummyHash = () => (dummy ??= hash("compte-inexistant-" + Math.random(), OPTS));

export async function checkPassword(pw: string, stored: string | null | undefined): Promise<boolean> {
  const h = stored ?? (await dummyHash());
  if (pw.length > 200) return false;
  if (h.startsWith("$argon2")) return verify(h, pw).catch(() => false);
  if (h.startsWith("$2")) return bcrypt.compare(pw, h);
  return false;
}

/** Vrai si le hachage doit être recalculé en Argon2id (ancien bcrypt) */
export const needsRehash = (stored: string) => !stored.startsWith("$argon2id$");
