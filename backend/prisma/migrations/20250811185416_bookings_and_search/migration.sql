-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "priceEgp" INTEGER,
    CONSTRAINT "Booking_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    CONSTRAINT "Rating_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rating_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
