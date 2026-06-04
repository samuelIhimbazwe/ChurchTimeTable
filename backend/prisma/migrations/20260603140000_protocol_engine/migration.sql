-- PROTOCOL-1: Protocol Operations, Scheduling, Attendance & Performance Engine

CREATE TYPE "ProtocolOccurrenceTeamStatus" AS ENUM ('GENERATED', 'REVIEWED', 'APPROVED', 'PUBLISHED', 'COMPLETED');
CREATE TYPE "ProtocolTeamMemberType" AS ENUM ('OFFICIAL', 'REPLACEMENT', 'VOLUNTEER');
CREATE TYPE "ProtocolAttendanceOutcome" AS ENUM ('PRESENT_FULL', 'PRESENT_LEFT_EARLY', 'PRESENT_LATE', 'PRESENT_LATE_LEFT_EARLY', 'ABSENT_EXCUSED', 'ABSENT_REPLACEMENT_FOUND', 'ABSENT_UNEXCUSED');
CREATE TYPE "ProtocolReplacementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ProtocolAssignmentMode" AS ENUM ('SUNDAY', 'TUESDAY', 'IGABURO', 'SPECIAL_EVENT');
CREATE TYPE "ProtocolBadgeKind" AS ENUM ('FAITHFUL_SERVANT', 'EMERGENCY_HELPER', 'TEAM_SUPPORTER', 'RELIABLE_MEMBER', 'MOST_ACTIVE');

CREATE TABLE "ProtocolEngineSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "maxOfficialServicesPerMonth" INTEGER NOT NULL DEFAULT 3,
    "maxNonChoirMembers" INTEGER NOT NULL DEFAULT 3,
    "gradePresentFull" INTEGER NOT NULL DEFAULT 100,
    "gradePresentLate" INTEGER NOT NULL DEFAULT 90,
    "gradePresentLeftEarly" INTEGER NOT NULL DEFAULT 85,
    "gradePresentLateLeftEarly" INTEGER NOT NULL DEFAULT 70,
    "gradeAbsentReplacementFound" INTEGER NOT NULL DEFAULT 60,
    "gradeAbsentExcused" INTEGER NOT NULL DEFAULT 50,
    "gradeAbsentUnexcused" INTEGER NOT NULL DEFAULT 0,
    "membersCanViewFullRanking" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProtocolEngineSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProtocolEngineSettings" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP);

CREATE TABLE "ProtocolMemberProfile" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "protocolUnitId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "officialServicesMonth" INTEGER NOT NULL DEFAULT 0,
    "extraServicesMonth" INTEGER NOT NULL DEFAULT 0,
    "totalServicesMonth" INTEGER NOT NULL DEFAULT 0,
    "lifetimeOfficialServices" INTEGER NOT NULL DEFAULT 0,
    "lifetimeExtraServices" INTEGER NOT NULL DEFAULT 0,
    "lifetimeTotalServices" INTEGER NOT NULL DEFAULT 0,
    "assignedCount" INTEGER NOT NULL DEFAULT 0,
    "attendedCount" INTEGER NOT NULL DEFAULT 0,
    "attendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateArrivals" INTEGER NOT NULL DEFAULT 0,
    "earlyDepartures" INTEGER NOT NULL DEFAULT 0,
    "excusedAbsences" INTEGER NOT NULL DEFAULT 0,
    "replacementFoundAbsences" INTEGER NOT NULL DEFAULT 0,
    "unexcusedAbsences" INTEGER NOT NULL DEFAULT 0,
    "replacementServicesAccepted" INTEGER NOT NULL DEFAULT 0,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "currentRank" INTEGER,
    "currentGradeScore" DOUBLE PRECISION,
    "statsMonth" INTEGER,
    "statsYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProtocolMemberProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProtocolOccurrenceTeam" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "status" "ProtocolOccurrenceTeamStatus" NOT NULL DEFAULT 'GENERATED',
    "assignmentMode" "ProtocolAssignmentMode" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "generatedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "notes" TEXT,
    CONSTRAINT "ProtocolOccurrenceTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProtocolOccurrenceTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignmentType" "ProtocolTeamMemberType" NOT NULL DEFAULT 'OFFICIAL',
    "isExtraService" BOOLEAN NOT NULL DEFAULT false,
    "quotaOverrideReason" TEXT,
    "quotaOverrideByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtocolOccurrenceTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProtocolTeamAttendance" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "outcome" "ProtocolAttendanceOutcome" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedByUserId" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "ProtocolTeamAttendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProtocolReplacementRequest" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "originalMemberId" TEXT NOT NULL,
    "replacementMemberId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "ProtocolReplacementStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtocolReplacementRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProtocolRankingEntry" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "rank" INTEGER NOT NULL,
    "gradeScore" DOUBLE PRECISION NOT NULL,
    "totalServices" INTEGER NOT NULL,
    "attendanceRate" DOUBLE PRECISION NOT NULL,
    "reliabilityScore" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtocolRankingEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProtocolMemberBadge" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" "ProtocolBadgeKind" NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "year" INTEGER,
    "month" INTEGER,
    CONSTRAINT "ProtocolMemberBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProtocolMemberProfile_memberId_key" ON "ProtocolMemberProfile"("memberId");
CREATE INDEX "ProtocolMemberProfile_protocolUnitId_active_idx" ON "ProtocolMemberProfile"("protocolUnitId", "active");
CREATE INDEX "ProtocolMemberProfile_currentRank_idx" ON "ProtocolMemberProfile"("currentRank");

CREATE UNIQUE INDEX "ProtocolOccurrenceTeam_occurrenceId_key" ON "ProtocolOccurrenceTeam"("occurrenceId");
CREATE INDEX "ProtocolOccurrenceTeam_status_idx" ON "ProtocolOccurrenceTeam"("status");
CREATE INDEX "ProtocolOccurrenceTeam_generatedAt_idx" ON "ProtocolOccurrenceTeam"("generatedAt");

CREATE UNIQUE INDEX "ProtocolOccurrenceTeamMember_teamId_memberId_key" ON "ProtocolOccurrenceTeamMember"("teamId", "memberId");
CREATE INDEX "ProtocolOccurrenceTeamMember_teamId_idx" ON "ProtocolOccurrenceTeamMember"("teamId");
CREATE INDEX "ProtocolOccurrenceTeamMember_memberId_idx" ON "ProtocolOccurrenceTeamMember"("memberId");

CREATE UNIQUE INDEX "ProtocolTeamAttendance_teamMemberId_key" ON "ProtocolTeamAttendance"("teamMemberId");
CREATE INDEX "ProtocolTeamAttendance_recordedAt_idx" ON "ProtocolTeamAttendance"("recordedAt");
CREATE INDEX "ProtocolTeamAttendance_outcome_idx" ON "ProtocolTeamAttendance"("outcome");

CREATE INDEX "ProtocolReplacementRequest_status_idx" ON "ProtocolReplacementRequest"("status");
CREATE INDEX "ProtocolReplacementRequest_teamMemberId_idx" ON "ProtocolReplacementRequest"("teamMemberId");
CREATE INDEX "ProtocolReplacementRequest_originalMemberId_idx" ON "ProtocolReplacementRequest"("originalMemberId");

CREATE UNIQUE INDEX "ProtocolRankingEntry_memberId_year_month_key" ON "ProtocolRankingEntry"("memberId", "year", "month");
CREATE INDEX "ProtocolRankingEntry_year_month_rank_idx" ON "ProtocolRankingEntry"("year", "month", "rank");

CREATE UNIQUE INDEX "ProtocolMemberBadge_profileId_kind_year_month_key" ON "ProtocolMemberBadge"("profileId", "kind", "year", "month");
CREATE INDEX "ProtocolMemberBadge_profileId_idx" ON "ProtocolMemberBadge"("profileId");

ALTER TABLE "ProtocolMemberProfile" ADD CONSTRAINT "ProtocolMemberProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProtocolMemberProfile" ADD CONSTRAINT "ProtocolMemberProfile_protocolUnitId_fkey" FOREIGN KEY ("protocolUnitId") REFERENCES "OperationalUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProtocolOccurrenceTeam" ADD CONSTRAINT "ProtocolOccurrenceTeam_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "OperationOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProtocolOccurrenceTeamMember" ADD CONSTRAINT "ProtocolOccurrenceTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ProtocolOccurrenceTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProtocolOccurrenceTeamMember" ADD CONSTRAINT "ProtocolOccurrenceTeamMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProtocolTeamAttendance" ADD CONSTRAINT "ProtocolTeamAttendance_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "ProtocolOccurrenceTeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProtocolReplacementRequest" ADD CONSTRAINT "ProtocolReplacementRequest_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "ProtocolOccurrenceTeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProtocolReplacementRequest" ADD CONSTRAINT "ProtocolReplacementRequest_originalMemberId_fkey" FOREIGN KEY ("originalMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProtocolReplacementRequest" ADD CONSTRAINT "ProtocolReplacementRequest_replacementMemberId_fkey" FOREIGN KEY ("replacementMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProtocolRankingEntry" ADD CONSTRAINT "ProtocolRankingEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProtocolMemberBadge" ADD CONSTRAINT "ProtocolMemberBadge_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ProtocolMemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
