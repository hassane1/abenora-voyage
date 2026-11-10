import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 h

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET manquant ou trop court (voir .env)");
  return new TextEncoder().encode(s);
}

export type AdminSession = { id: string; email: string; name: string };

export async function signIn(email: string, password: string): Promise<boolean> {
  const user = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  // comparaison systématique pour limiter les attaques temporelles
  const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  if (!user || !ok) return false;
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

export async function getAdmin(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: String(payload.sub), email: String(payload.email), name: String(payload.name) };
  } catch {
    return null;
  }
}

/** À appeler en tête de chaque page / action d'administration */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
