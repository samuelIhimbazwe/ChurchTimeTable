-- Choir service assignments require church admin confirmation before choir announcement

ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING_CHURCH_CONFIRMATION';
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'CHOIR_PROPOSED';
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "proposedById" TEXT;
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "confirmedById" TEXT;
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "confirmedAt" TIMESTAMP(3);
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "rejectedById" TEXT;
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "bypassRules" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "announcedAt" TIMESTAMP(3);

UPDATE "ChoirServiceAssignment" SET "status" = 'CONFIRMED', "confirmedAt" = "assignedAt" WHERE "cancelledAt" IS NULL;

CREATE INDEX "ChoirServiceAssignment_status_idx" ON "ChoirServiceAssignment"("status");
