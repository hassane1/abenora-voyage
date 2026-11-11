/** Nettoyage des données expirées : `npm run db:purge`
 *  Ne touche ni aux notifications ni au journal d'audit. */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  // même règle que src/lib/customer.ts : session voyageur expirée après 7 jours d'inactivité
  const idleLimit = new Date(now.getTime() - 7 * DAY);

  const rateLimits = await db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
  const adminSessions = await db.adminSession.deleteMany({
    where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: thirtyDaysAgo } }] },
  });
  const customerSessions = await db.customerSession.deleteMany({
    where: { OR: [{ expiresAt: { lt: now } }, { lastSeenAt: { lt: idleLimit } }] },
  });
  const customerTokens = await db.customerToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { lt: thirtyDaysAgo } }] },
  });

  console.log("Purge terminée :");
  console.log(`  RateLimit        : ${rateLimits.count}`);
  console.log(`  AdminSession     : ${adminSessions.count}`);
  console.log(`  CustomerSession  : ${customerSessions.count}`);
  console.log(`  CustomerToken    : ${customerTokens.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
