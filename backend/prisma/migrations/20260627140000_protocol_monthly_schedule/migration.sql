-- Protocol-owned monthly choir schedule + service rule expansion

CREATE TYPE "ChoirSchedulePlanOwner" AS ENUM ('CHURCH', 'PROTOCOL');

ALTER TYPE "ChoirSchedulePlanStatus" ADD VALUE IF NOT EXISTS 'APPROVED';

ALTER TABLE "ChoirSchedulePlan"
  ADD COLUMN IF NOT EXISTS "ownerScope" "ChoirSchedulePlanOwner" NOT NULL DEFAULT 'CHURCH',
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedById" TEXT;

CREATE INDEX IF NOT EXISTS "ChoirSchedulePlan_ownerScope_idx" ON "ChoirSchedulePlan"("ownerScope");

ALTER TABLE "ChoirServiceEligibility"
  ADD COLUMN IF NOT EXISTS "eligibleForFriday" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ChoirSchedulePlanEntry"
  ADD CONSTRAINT "ChoirSchedulePlanEntry_occurrenceId_fkey"
    FOREIGN KEY ("occurrenceId") REFERENCES "OperationOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChoirSchedulePlanEntry"
  ADD CONSTRAINT "ChoirSchedulePlanEntry_choirId_fkey"
    FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ChoirSchedulePlanEntry_choirId_idx" ON "ChoirSchedulePlanEntry"("choirId");
