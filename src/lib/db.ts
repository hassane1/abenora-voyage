import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Production PostgreSQL : remplacer par `@prisma/adapter-pg` (voir README).
function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
  return new PrismaClient({ adapter });
}

// En développement, le client est conservé entre deux rechargements à chaud. On le rattache à la version
// du schéma : après une migration (`prisma generate`), un nouveau client est créé sans redémarrer le serveur.
const SCHEMA_VERSION = "2026-11-10-customer-idle";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaVersion?: string };

export const db = globalForPrisma.prisma && globalForPrisma.prismaVersion === SCHEMA_VERSION ? globalForPrisma.prisma : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaVersion = SCHEMA_VERSION;
}
