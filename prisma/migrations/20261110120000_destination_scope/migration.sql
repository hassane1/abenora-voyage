-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Destination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "tagline" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "region" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'NATIONAL',
    "country" TEXT NOT NULL DEFAULT 'Maroc',
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "sections" JSONB NOT NULL,
    "tips" JSONB NOT NULL,
    "faq" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Destination" ("createdAt", "description", "faq", "id", "latitude", "longitude", "name", "published", "region", "sections", "slug", "sortOrder", "tagline", "tips", "updatedAt") SELECT "createdAt", "description", "faq", "id", "latitude", "longitude", "name", "published", "region", "sections", "slug", "sortOrder", "tagline", "tips", "updatedAt" FROM "Destination";
DROP TABLE "Destination";
ALTER TABLE "new_Destination" RENAME TO "Destination";
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

