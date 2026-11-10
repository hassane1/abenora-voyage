-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "tagline" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "region" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "alt" JSONB NOT NULL,
    "credit" TEXT,
    "license" TEXT,
    "sourceUrl" TEXT,
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "destinationId" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'sparkle',
    "title" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "duration" JSONB NOT NULL,
    "difficulty" TEXT NOT NULL,
    "minAge" INTEGER,
    "restrictions" JSONB NOT NULL,
    "included" JSONB NOT NULL,
    "excluded" JSONB NOT NULL,
    "safety" JSONB NOT NULL,
    "availability" JSONB NOT NULL,
    "priceMad" INTEGER,
    "priceUnit" TEXT NOT NULL DEFAULT 'PER_PERSON',
    "priceStatus" TEXT NOT NULL DEFAULT 'DEMO',
    "bookingOptionCode" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Circuit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "days" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "CircuitDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circuitId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    CONSTRAINT "CircuitDay_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircuitStop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circuitId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'STAGE',
    "modeToNext" TEXT,
    "description" JSONB NOT NULL,
    CONSTRAINT "CircuitStop_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Departure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circuitId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "capacity" INTEGER NOT NULL,
    "seatsHeld" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Departure_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "circuitId" TEXT,
    "group" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "priceMad" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'PER_PERSON',
    "exclusiveGroup" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "priceStatus" TEXT NOT NULL DEFAULT 'DEMO',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BookingOption_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "circuitId" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "childAges" JSONB NOT NULL,
    "privateTour" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB NOT NULL,
    "pricing" JSONB NOT NULL,
    "totalMad" INTEGER NOT NULL,
    "depositMad" INTEGER NOT NULL,
    "pricesAreDemo" BOOLEAN NOT NULL,
    "promoCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'NONE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "country" TEXT NOT NULL,
    "departureCity" TEXT,
    "specialNeeds" TEXT,
    "comments" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "consentAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "Departure" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "actor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "amountMad" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'PAYMENT',
    "recordedBy" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "bookingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "percentOff" INTEGER NOT NULL,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "minPeople" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL DEFAULT 'SUR_MESURE',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "destination" TEXT,
    "durationDays" INTEGER,
    "budgetMad" INTEGER,
    "travelers" INTEGER,
    "interests" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "excerpt" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CONSEILS',
    "destinationId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Circuit_slug_key" ON "Circuit"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CircuitDay_circuitId_dayNumber_key" ON "CircuitDay"("circuitId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CircuitStop_circuitId_order_key" ON "CircuitStop"("circuitId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Departure_circuitId_date_key" ON "Departure"("circuitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BookingOption_code_circuitId_key" ON "BookingOption"("code", "circuitId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_accessToken_key" ON "Booking"("accessToken");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_email_idx" ON "Booking"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
