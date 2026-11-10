-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Circuit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "days" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL,
    "desertNights" INTEGER NOT NULL DEFAULT 1,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "transport" JSONB NOT NULL,
    "accommodation" JSONB NOT NULL,
    "meals" JSONB NOT NULL,
    "included" JSONB NOT NULL,
    "excluded" JSONB NOT NULL,
    "optionalActivities" JSONB NOT NULL,
    "cancellationPolicy" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "pricingMode" TEXT NOT NULL DEFAULT 'PER_PERSON',
    "priceAdultMad" INTEGER,
    "childPricePercent" INTEGER NOT NULL DEFAULT 50,
    "childFreeUnderAge" INTEGER NOT NULL DEFAULT 4,
    "privateSupplementMad" INTEGER NOT NULL DEFAULT 0,
    "depositPercent" INTEGER NOT NULL DEFAULT 30,
    "priceStatus" TEXT NOT NULL DEFAULT 'DEMO',
    "defaultCapacity" INTEGER NOT NULL DEFAULT 12,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Circuit_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Circuit" ("accommodation", "cancellationPolicy", "childFreeUnderAge", "childPricePercent", "createdAt", "days", "defaultCapacity", "depositPercent", "destinationId", "endPoint", "excluded", "id", "included", "meals", "nights", "optionalActivities", "priceAdultMad", "priceStatus", "pricingMode", "privateSupplementMad", "published", "slug", "sortOrder", "startPoint", "summary", "title", "transport", "updatedAt", "warnings") SELECT "accommodation", "cancellationPolicy", "childFreeUnderAge", "childPricePercent", "createdAt", "days", "defaultCapacity", "depositPercent", "destinationId", "endPoint", "excluded", "id", "included", "meals", "nights", "optionalActivities", "priceAdultMad", "priceStatus", "pricingMode", "privateSupplementMad", "published", "slug", "sortOrder", "startPoint", "summary", "title", "transport", "updatedAt", "warnings" FROM "Circuit";
DROP TABLE "Circuit";
ALTER TABLE "new_Circuit" RENAME TO "Circuit";
CREATE UNIQUE INDEX "Circuit_slug_key" ON "Circuit"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
