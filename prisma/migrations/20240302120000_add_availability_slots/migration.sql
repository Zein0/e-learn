CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "AvailabilitySlot" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "dayOfWeek" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "AvailabilitySlot_dayOfWeek_startMinutes_key"
  ON "AvailabilitySlot"("dayOfWeek", "startMinutes");
