-- MF-2 Operational Units Foundation

CREATE TABLE "OperationalUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalUnit_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OperationalUnit_ministryId_code_key" ON "OperationalUnit"("ministryId", "code");
CREATE UNIQUE INDEX "OperationalUnit_ministryId_name_key" ON "OperationalUnit"("ministryId", "name");
CREATE INDEX "OperationalUnit_ministryId_isActive_idx" ON "OperationalUnit"("ministryId", "isActive");
CREATE INDEX "OperationalUnit_type_idx" ON "OperationalUnit"("type");

CREATE TABLE "OperationalUnitMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationalUnitId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalUnitMembership_operationalUnitId_fkey" FOREIGN KEY ("operationalUnitId") REFERENCES "OperationalUnit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationalUnitMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OperationalUnitMembership_operationalUnitId_memberId_key" ON "OperationalUnitMembership"("operationalUnitId", "memberId");
CREATE INDEX "OperationalUnitMembership_memberId_idx" ON "OperationalUnitMembership"("memberId");
CREATE INDEX "OperationalUnitMembership_operationalUnitId_status_idx" ON "OperationalUnitMembership"("operationalUnitId", "status");

CREATE TABLE "OperationalUnitLeadershipPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationalUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalUnitLeadershipPosition_operationalUnitId_fkey" FOREIGN KEY ("operationalUnitId") REFERENCES "OperationalUnit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OperationalUnitLeadershipPosition_operationalUnitId_name_key" ON "OperationalUnitLeadershipPosition"("operationalUnitId", "name");
CREATE INDEX "OperationalUnitLeadershipPosition_operationalUnitId_isActive_idx" ON "OperationalUnitLeadershipPosition"("operationalUnitId", "isActive");

CREATE TABLE "OperationalUnitLeadershipAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationalUnitId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "assignedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalUnitLeadershipAssignment_operationalUnitId_fkey" FOREIGN KEY ("operationalUnitId") REFERENCES "OperationalUnit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationalUnitLeadershipAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationalUnitLeadershipAssignment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "OperationalUnitLeadershipPosition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalUnitLeadershipAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OperationalUnitLeadershipAssignment_operationalUnitId_endedAt_idx" ON "OperationalUnitLeadershipAssignment"("operationalUnitId", "endedAt");
CREATE INDEX "OperationalUnitLeadershipAssignment_memberId_idx" ON "OperationalUnitLeadershipAssignment"("memberId");
CREATE INDEX "OperationalUnitLeadershipAssignment_positionId_idx" ON "OperationalUnitLeadershipAssignment"("positionId");

CREATE TABLE "OperationalUnitPermissionAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationalUnitId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "grantedByUserId" TEXT,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "OperationalUnitPermissionAssignment_operationalUnitId_fkey" FOREIGN KEY ("operationalUnitId") REFERENCES "OperationalUnit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationalUnitPermissionAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationalUnitPermissionAssignment_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OperationalUnitPermissionAssignment_operationalUnitId_memberId_idx" ON "OperationalUnitPermissionAssignment"("operationalUnitId", "memberId");
CREATE INDEX "OperationalUnitPermissionAssignment_operationalUnitId_permission_idx" ON "OperationalUnitPermissionAssignment"("operationalUnitId", "permission");
CREATE INDEX "OperationalUnitPermissionAssignment_memberId_revokedAt_idx" ON "OperationalUnitPermissionAssignment"("memberId", "revokedAt");

CREATE TABLE "OperationalUnitSettings" (
    "operationalUnitId" TEXT NOT NULL PRIMARY KEY,
    "allowEvents" INTEGER NOT NULL DEFAULT 1,
    "allowAttendance" INTEGER NOT NULL DEFAULT 1,
    "allowReports" INTEGER NOT NULL DEFAULT 1,
    "allowAnnouncements" INTEGER NOT NULL DEFAULT 1,
    "allowDocuments" INTEGER NOT NULL DEFAULT 1,
    "allowAssets" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalUnitSettings_operationalUnitId_fkey" FOREIGN KEY ("operationalUnitId") REFERENCES "OperationalUnit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
