-- MF-6 Church Intelligence Foundation

-- New enums (SQLite stores as TEXT)
-- MinistryHealthStatus, GovernanceAlertType, ChurchActivityType, LeadershipAssignmentScope
-- MinistryActivityType extended values handled at application layer for SQLite

CREATE TABLE "LeadershipTerm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentScope" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "expectedEndAt" DATETIME,
    "endedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "LeadershipTerm_assignmentScope_assignmentId_key" ON "LeadershipTerm"("assignmentScope", "assignmentId");
CREATE INDEX "LeadershipTerm_expectedEndAt_idx" ON "LeadershipTerm"("expectedEndAt");
CREATE INDEX "LeadershipTerm_endedAt_idx" ON "LeadershipTerm"("endedAt");
CREATE INDEX "LeadershipTerm_startedAt_idx" ON "LeadershipTerm"("startedAt");
