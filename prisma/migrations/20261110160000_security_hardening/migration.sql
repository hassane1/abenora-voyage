-- Renforcement sécurité : sessions d'équipe révocables, anti-rejeu TOTP
ALTER TABLE "AdminUser" ADD COLUMN "mfaLastStep" INTEGER;

CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mfaPassed" BOOLEAN NOT NULL DEFAULT false,
    "authAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "ip" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");
