-- PROTOCOL-2: Service Operations Refinement

-- Attendance outcome rename (SQLite: recreate enum via schema push)
-- New models and fields

CREATE TABLE "ProtocolTeamLeader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "choirId" TEXT,
    "label" TEXT,
    "isNonChoirLeader" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "ProtocolTeamLeader_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE,
    CONSTRAINT "ProtocolTeamLeader_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "ProtocolTeamLeader_memberId_key" ON "ProtocolTeamLeader"("memberId");
CREATE INDEX "ProtocolTeamLeader_choirId_active_idx" ON "ProtocolTeamLeader"("choirId", "active");

CREATE TABLE "ProtocolOccurrenceTeamLeader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "protocolTeamLeaderId" TEXT NOT NULL,
    "assignedByUserId" TEXT,
    "overrideReason" TEXT,
    "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtocolOccurrenceTeamLeader_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ProtocolOccurrenceTeam"("id") ON DELETE CASCADE,
    CONSTRAINT "ProtocolOccurrenceTeamLeader_protocolTeamLeaderId_fkey" FOREIGN KEY ("protocolTeamLeaderId") REFERENCES "ProtocolTeamLeader"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "ProtocolOccurrenceTeamLeader_teamId_key" ON "ProtocolOccurrenceTeamLeader"("teamId");

CREATE TABLE "ProtocolOccurrenceTeamBackup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtocolOccurrenceTeamBackup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ProtocolOccurrenceTeam"("id") ON DELETE CASCADE,
    CONSTRAINT "ProtocolOccurrenceTeamBackup_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "ProtocolOccurrenceTeamBackup_teamId_memberId_key" ON "ProtocolOccurrenceTeamBackup"("teamId", "memberId");

CREATE TABLE "ProtocolTeamReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "issues" TEXT,
    "recommendations" TEXT,
    "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedByUserId" TEXT,
    CONSTRAINT "ProtocolTeamReport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ProtocolOccurrenceTeam"("id") ON DELETE CASCADE,
    CONSTRAINT "ProtocolTeamReport_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "ProtocolTeamLeader"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "ProtocolTeamReport_teamId_key" ON "ProtocolTeamReport"("teamId");

CREATE TABLE "ProtocolCategoryRankingEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "rank" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "generatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtocolCategoryRankingEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "ProtocolCategoryRankingEntry_memberId_category_year_month_key" ON "ProtocolCategoryRankingEntry"("memberId", "category", "year", "month");

ALTER TABLE "ProtocolTeamAttendance" ADD COLUMN "attendanceScoreEarned" INTEGER;
ALTER TABLE "ProtocolMemberProfile" ADD COLUMN "selfReplacements" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProtocolMemberProfile" ADD COLUMN "replacementAssistanceGiven" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProtocolMemberProfile" ADD COLUMN "currentOverallRank" INTEGER;
