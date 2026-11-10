-- Sessions voyageurs : date de dernière activité (expiration après 7 jours d'inactivité)
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userAgent" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CustomerSession" ("createdAt", "customerId", "expiresAt", "id", "tokenHash", "userAgent") SELECT "createdAt", "customerId", "expiresAt", "id", "tokenHash", "userAgent" FROM "CustomerSession";
DROP TABLE "CustomerSession";
ALTER TABLE "new_CustomerSession" RENAME TO "CustomerSession";
CREATE UNIQUE INDEX "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- sessions existantes : dernière activité = date de création (même format que les dates écrites par l application)
UPDATE "CustomerSession" SET "lastSeenAt" = "createdAt";
