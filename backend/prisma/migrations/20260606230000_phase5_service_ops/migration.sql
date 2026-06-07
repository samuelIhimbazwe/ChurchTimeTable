-- Phase 5: Church service requests, Service Preparation Center, choir dissolution transfers

CREATE TYPE "ChurchServiceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ServicePreparationItemType" AS ENUM ('SERVICE_SONG', 'UNIFORM', 'PEP_TALK', 'SHORT_ANNOUNCEMENT', 'CUSTOM');
CREATE TYPE "PepTalkTiming" AS ENUM ('BEFORE_SERVICE', 'AFTER_SERVICE');
CREATE TYPE "ChoirDissolutionTransferStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

CREATE TABLE "ChurchServiceRequest" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "preferredChoirId" TEXT,
    "assignedChoirId" TEXT,
    "role" "ChoirServiceAssignmentRole" NOT NULL DEFAULT 'PRIMARY',
    "title" TEXT,
    "notes" TEXT,
    "status" "ChurchServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServicePreparationPlan" (
    "id" TEXT NOT NULL,
    "choirId" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "uniformNotes" TEXT,
    "pepTalkTitle" TEXT,
    "pepTalkAt" TIMESTAMP(3),
    "pepTalkTiming" "PepTalkTiming",
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePreparationPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServicePreparationItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "itemType" "ServicePreparationItemType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "songId" TEXT,
    "scheduledAt" TIMESTAMP(3),

    CONSTRAINT "ServicePreparationItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChoirDissolutionTransfer" (
    "id" TEXT NOT NULL,
    "sourceChoirId" TEXT NOT NULL,
    "targetChoirId" TEXT NOT NULL,
    "status" "ChoirDissolutionTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT,
    "memberCount" INTEGER,
    "executedByUserId" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirDissolutionTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServicePreparationPlan_choirId_occurrenceId_key" ON "ServicePreparationPlan"("choirId", "occurrenceId");
CREATE INDEX "ChurchServiceRequest_occurrenceId_idx" ON "ChurchServiceRequest"("occurrenceId");
CREATE INDEX "ChurchServiceRequest_status_idx" ON "ChurchServiceRequest"("status");
CREATE INDEX "ChurchServiceRequest_assignedChoirId_idx" ON "ChurchServiceRequest"("assignedChoirId");
CREATE INDEX "ServicePreparationPlan_occurrenceId_idx" ON "ServicePreparationPlan"("occurrenceId");
CREATE INDEX "ServicePreparationItem_planId_idx" ON "ServicePreparationItem"("planId");
CREATE INDEX "ServicePreparationItem_itemType_idx" ON "ServicePreparationItem"("itemType");
CREATE INDEX "ChoirDissolutionTransfer_sourceChoirId_idx" ON "ChoirDissolutionTransfer"("sourceChoirId");
CREATE INDEX "ChoirDissolutionTransfer_targetChoirId_idx" ON "ChoirDissolutionTransfer"("targetChoirId");
CREATE INDEX "ChoirDissolutionTransfer_status_idx" ON "ChoirDissolutionTransfer"("status");

ALTER TABLE "ChurchServiceRequest" ADD CONSTRAINT "ChurchServiceRequest_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "OperationOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChurchServiceRequest" ADD CONSTRAINT "ChurchServiceRequest_preferredChoirId_fkey" FOREIGN KEY ("preferredChoirId") REFERENCES "Choir"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChurchServiceRequest" ADD CONSTRAINT "ChurchServiceRequest_assignedChoirId_fkey" FOREIGN KEY ("assignedChoirId") REFERENCES "Choir"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServicePreparationPlan" ADD CONSTRAINT "ServicePreparationPlan_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServicePreparationPlan" ADD CONSTRAINT "ServicePreparationPlan_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "OperationOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServicePreparationItem" ADD CONSTRAINT "ServicePreparationItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ServicePreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServicePreparationItem" ADD CONSTRAINT "ServicePreparationItem_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChoirDissolutionTransfer" ADD CONSTRAINT "ChoirDissolutionTransfer_sourceChoirId_fkey" FOREIGN KEY ("sourceChoirId") REFERENCES "Choir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChoirDissolutionTransfer" ADD CONSTRAINT "ChoirDissolutionTransfer_targetChoirId_fkey" FOREIGN KEY ("targetChoirId") REFERENCES "Choir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
