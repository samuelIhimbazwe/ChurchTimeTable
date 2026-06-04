-- MF-1 Ministry Foundation

CREATE TABLE "Ministry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Ministry_code_key" ON "Ministry"("code");
CREATE UNIQUE INDEX "Ministry_name_key" ON "Ministry"("name");
CREATE INDEX "Ministry_isActive_idx" ON "Ministry"("isActive");

CREATE TABLE "MinistryMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MinistryMembership_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MinistryMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MinistryMembership_ministryId_memberId_key" ON "MinistryMembership"("ministryId", "memberId");
CREATE INDEX "MinistryMembership_memberId_idx" ON "MinistryMembership"("memberId");
CREATE INDEX "MinistryMembership_ministryId_status_idx" ON "MinistryMembership"("ministryId", "status");

CREATE TABLE "MinistryLeadershipPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MinistryLeadershipPosition_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MinistryLeadershipPosition_ministryId_name_key" ON "MinistryLeadershipPosition"("ministryId", "name");
CREATE INDEX "MinistryLeadershipPosition_ministryId_isActive_idx" ON "MinistryLeadershipPosition"("ministryId", "isActive");

CREATE TABLE "MinistryLeadershipAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "assignedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MinistryLeadershipAssignment_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MinistryLeadershipAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MinistryLeadershipAssignment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "MinistryLeadershipPosition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MinistryLeadershipAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "MinistryLeadershipAssignment_ministryId_endedAt_idx" ON "MinistryLeadershipAssignment"("ministryId", "endedAt");
CREATE INDEX "MinistryLeadershipAssignment_memberId_idx" ON "MinistryLeadershipAssignment"("memberId");
CREATE INDEX "MinistryLeadershipAssignment_positionId_idx" ON "MinistryLeadershipAssignment"("positionId");

CREATE TABLE "MinistryPermissionAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "grantedByUserId" TEXT,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "MinistryPermissionAssignment_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MinistryPermissionAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MinistryPermissionAssignment_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "MinistryPermissionAssignment_ministryId_memberId_idx" ON "MinistryPermissionAssignment"("ministryId", "memberId");
CREATE INDEX "MinistryPermissionAssignment_ministryId_permission_idx" ON "MinistryPermissionAssignment"("ministryId", "permission");
CREATE INDEX "MinistryPermissionAssignment_memberId_revokedAt_idx" ON "MinistryPermissionAssignment"("memberId", "revokedAt");

CREATE TABLE "MinistrySettings" (
    "ministryId" TEXT NOT NULL PRIMARY KEY,
    "allowDevotions" INTEGER NOT NULL DEFAULT 1,
    "allowAnnouncements" INTEGER NOT NULL DEFAULT 1,
    "allowDocuments" INTEGER NOT NULL DEFAULT 1,
    "allowMeetings" INTEGER NOT NULL DEFAULT 1,
    "allowAssets" INTEGER NOT NULL DEFAULT 1,
    "allowOperationalUnits" INTEGER NOT NULL DEFAULT 0,
    "allowReporting" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MinistrySettings_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
