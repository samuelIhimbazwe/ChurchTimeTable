-- Church Master Schedule Phases B–D: submissions, entries, conflict pipeline

CREATE TYPE "ChurchScheduleScopeType" AS ENUM ('MINISTRY', 'CHOIR', 'PROTOCOL', 'OPERATIONAL_UNIT');
CREATE TYPE "ChurchScheduleActivityType" AS ENUM ('PRAYER', 'REHEARSAL', 'MEETING', 'TRAINING', 'CONCERT', 'FELLOWSHIP', 'OTHER_CHURCH_FACING');
CREATE TYPE "ChurchScheduleSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'AUTO_PUBLISHED', 'CONFLICT_HELD', 'ADMIN_PUBLISHED', 'REJECTED', 'CANCELLED', 'COUNTER_PROPOSED');
CREATE TYPE "ChurchScheduleEntrySource" AS ENUM ('CHURCH_DIRECT', 'AUTO_PUBLISHED', 'ADMIN_PUBLISHED', 'OVERRIDE');

CREATE TABLE "ChurchScheduleSubmission" (
    "id" TEXT NOT NULL,
    "scopeType" "ChurchScheduleScopeType" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "activityType" "ChurchScheduleActivityType" NOT NULL,
    "calendarDate" TIMESTAMP(3) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "facilityId" TEXT NOT NULL,
    "purpose" TEXT,
    "weekOf" TIMESTAMP(3),
    "notes" TEXT,
    "status" "ChurchScheduleSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "conflictEntryId" TEXT,
    "conflictReason" TEXT,
    "suggestedAlternatives" JSONB,
    "rejectionReason" TEXT,
    "counterProposal" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchScheduleSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChurchScheduleEntry" (
    "id" TEXT NOT NULL,
    "source" "ChurchScheduleEntrySource" NOT NULL,
    "scopeType" "ChurchScheduleScopeType",
    "scopeId" TEXT,
    "title" TEXT NOT NULL,
    "activityType" "ChurchScheduleActivityType" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "facilityId" TEXT NOT NULL,
    "purpose" TEXT,
    "isChurchBlock" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "submissionId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchScheduleEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChurchScheduleEntry_submissionId_key" ON "ChurchScheduleEntry"("submissionId");
CREATE INDEX "ChurchScheduleSubmission_scopeType_scopeId_idx" ON "ChurchScheduleSubmission"("scopeType", "scopeId");
CREATE INDEX "ChurchScheduleSubmission_status_idx" ON "ChurchScheduleSubmission"("status");
CREATE INDEX "ChurchScheduleSubmission_facilityId_idx" ON "ChurchScheduleSubmission"("facilityId");
CREATE INDEX "ChurchScheduleSubmission_startAt_endAt_idx" ON "ChurchScheduleSubmission"("startAt", "endAt");
CREATE INDEX "ChurchScheduleSubmission_createdByUserId_idx" ON "ChurchScheduleSubmission"("createdByUserId");
CREATE INDEX "ChurchScheduleEntry_facilityId_startAt_endAt_idx" ON "ChurchScheduleEntry"("facilityId", "startAt", "endAt");
CREATE INDEX "ChurchScheduleEntry_startAt_endAt_idx" ON "ChurchScheduleEntry"("startAt", "endAt");
CREATE INDEX "ChurchScheduleEntry_cancelledAt_idx" ON "ChurchScheduleEntry"("cancelledAt");

ALTER TABLE "ChurchScheduleSubmission" ADD CONSTRAINT "ChurchScheduleSubmission_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "ChurchFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChurchScheduleEntry" ADD CONSTRAINT "ChurchScheduleEntry_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "ChurchFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChurchScheduleEntry" ADD CONSTRAINT "ChurchScheduleEntry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChurchScheduleSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
