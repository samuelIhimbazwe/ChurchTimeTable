-- Sprint 10.1: Choir family transformation & contribution governance foundation

-- FamilyMemberRole: household → choir team roles
CREATE TABLE "FamilyMember_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilyMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "FamilyMember_new" ("id", "familyId", "memberId", "role", "joinedAt", "createdAt")
SELECT
    "id",
    "familyId",
    "memberId",
    CASE
        WHEN "role" = 'HEAD' THEN 'HEAD'
        ELSE 'MEMBER'
    END,
    "joinedAt",
    "createdAt"
FROM "FamilyMember";

DROP TABLE "FamilyMember";
ALTER TABLE "FamilyMember_new" RENAME TO "FamilyMember";

CREATE UNIQUE INDEX "FamilyMember_memberId_key" ON "FamilyMember"("memberId");
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");
CREATE INDEX "FamilyMember_memberId_idx" ON "FamilyMember"("memberId");
CREATE INDEX "FamilyMember_role_idx" ON "FamilyMember"("role");

-- Family delegation flag
ALTER TABLE "Family" ADD COLUMN "delegationEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Contribution type catalog & campaigns
CREATE TABLE "ContributionTypeCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ministryScope" TEXT NOT NULL DEFAULT 'CHOIR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "ContributionTypeCatalog_code_key" ON "ContributionTypeCatalog"("code");
CREATE INDEX "ContributionTypeCatalog_active_ministryScope_idx" ON "ContributionTypeCatalog"("active", "ministryScope");
CREATE INDEX "ContributionTypeCatalog_sortOrder_idx" ON "ContributionTypeCatalog"("sortOrder");

CREATE TABLE "ContributionCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contributionTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goalAmount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "ministryScope" TEXT NOT NULL DEFAULT 'CHOIR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContributionCampaign_contributionTypeId_fkey" FOREIGN KEY ("contributionTypeId") REFERENCES "ContributionTypeCatalog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ContributionCampaign_contributionTypeId_idx" ON "ContributionCampaign"("contributionTypeId");
CREATE INDEX "ContributionCampaign_status_ministryScope_idx" ON "ContributionCampaign"("status", "ministryScope");
CREATE INDEX "ContributionCampaign_periodStart_periodEnd_idx" ON "ContributionCampaign"("periodStart", "periodEnd");

-- ContributionRecord extensions (additive)
ALTER TABLE "ContributionRecord" ADD COLUMN "contributionTypeCatalogId" TEXT;
ALTER TABLE "ContributionRecord" ADD COLUMN "contributionCampaignId" TEXT;
ALTER TABLE "ContributionRecord" ADD COLUMN "claimedAmount" DECIMAL;
ALTER TABLE "ContributionRecord" ADD COLUMN "confirmedAmount" DECIMAL;
ALTER TABLE "ContributionRecord" ADD COLUMN "discrepancyAmount" DECIMAL;
ALTER TABLE "ContributionRecord" ADD COLUMN "discrepancyReason" TEXT;
ALTER TABLE "ContributionRecord" ADD COLUMN "paymentAt" DATETIME;
ALTER TABLE "ContributionRecord" ADD COLUMN "paymentChannel" TEXT;
ALTER TABLE "ContributionRecord" ADD COLUMN "familyApprovedAt" DATETIME;
ALTER TABLE "ContributionRecord" ADD COLUMN "familyApprovedByMemberId" TEXT;
ALTER TABLE "ContributionRecord" ADD COLUMN "familyRejectedAt" DATETIME;
ALTER TABLE "ContributionRecord" ADD COLUMN "familyRejectedByMemberId" TEXT;
ALTER TABLE "ContributionRecord" ADD COLUMN "rejectionReason" TEXT;

UPDATE "ContributionRecord" SET "claimedAmount" = "amount" WHERE "claimedAmount" IS NULL;

CREATE INDEX "ContributionRecord_contributionTypeCatalogId_idx" ON "ContributionRecord"("contributionTypeCatalogId");
CREATE INDEX "ContributionRecord_contributionCampaignId_idx" ON "ContributionRecord"("contributionCampaignId");
CREATE INDEX "ContributionRecord_familyApprovedAt_idx" ON "ContributionRecord"("familyApprovedAt");
CREATE INDEX "ContributionRecord_paymentAt_idx" ON "ContributionRecord"("paymentAt");

-- Contribution adjustments (immutable originals; effective amount via adjustments)
CREATE TABLE "ContributionAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contributionRecordId" TEXT NOT NULL,
    "adjustmentAmount" DECIMAL NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CORRECTION',
    "reason" TEXT NOT NULL,
    "adjustedByMemberId" TEXT NOT NULL,
    "referenceContributionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContributionAdjustment_contributionRecordId_fkey" FOREIGN KEY ("contributionRecordId") REFERENCES "ContributionRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContributionAdjustment_adjustedByMemberId_fkey" FOREIGN KEY ("adjustedByMemberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ContributionAdjustment_contributionRecordId_idx" ON "ContributionAdjustment"("contributionRecordId");
CREATE INDEX "ContributionAdjustment_adjustedByMemberId_idx" ON "ContributionAdjustment"("adjustedByMemberId");
CREATE INDEX "ContributionAdjustment_createdAt_idx" ON "ContributionAdjustment"("createdAt");

-- Family leadership history
CREATE TABLE "FamilyLeadershipHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "assignedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyLeadershipHistory_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilyLeadershipHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FamilyLeadershipHistory_familyId_idx" ON "FamilyLeadershipHistory"("familyId");
CREATE INDEX "FamilyLeadershipHistory_memberId_idx" ON "FamilyLeadershipHistory"("memberId");
CREATE INDEX "FamilyLeadershipHistory_role_idx" ON "FamilyLeadershipHistory"("role");
CREATE INDEX "FamilyLeadershipHistory_startedAt_idx" ON "FamilyLeadershipHistory"("startedAt");
CREATE INDEX "FamilyLeadershipHistory_endedAt_idx" ON "FamilyLeadershipHistory"("endedAt");

-- Default contribution type catalog
INSERT INTO "ContributionTypeCatalog" ("id", "code", "name", "description", "active", "sortOrder", "ministryScope", "createdAt", "updatedAt")
VALUES
    ('ct-umusanzu', 'umusanzu', 'Umusanzu', 'Monthly choir contribution', true, 10, 'CHOIR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ct-inyubako', 'inyubako', 'Inyubako', 'Building fund contribution', true, 20, 'CHOIR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ct-uniform', 'uniform', 'Uniform', 'Uniform contribution', true, 30, 'CHOIR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ct-concert', 'concert', 'Concert', 'Concert-related contribution', true, 40, 'CHOIR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ct-live-recording', 'live_recording', 'Live Recording', 'Live recording contribution', true, 50, 'CHOIR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ct-special-project', 'special_project', 'Special Project', 'Other special project drives', true, 60, 'CHOIR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
