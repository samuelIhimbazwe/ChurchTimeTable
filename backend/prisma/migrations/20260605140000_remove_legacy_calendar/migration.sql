-- Remove legacy Calendar 1 (Event system) tables and migrate rehearsal models to ChoirActivity

PRAGMA foreign_keys=OFF;

-- Drop dependent rehearsal tables first
DROP TABLE IF EXISTS "RehearsalAttendance";
DROP TABLE IF EXISTS "RehearsalPlanSong";
DROP TABLE IF EXISTS "RehearsalPlanSection";
DROP TABLE IF EXISTS "RehearsalPlan";

-- Drop legacy calendar tables
DROP TABLE IF EXISTS "Attendance";
DROP TABLE IF EXISTS "Swap";
DROP TABLE IF EXISTS "Replacement";
DROP TABLE IF EXISTS "EventAssignment";
DROP TABLE IF EXISTS "Event";

-- Recreate SongUsageRecord without eventId
CREATE TABLE "SongUsageRecord_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT NOT NULL,
    "rehearsalPlanId" TEXT,
    "leaderId" TEXT,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "SongUsageRecord_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SongUsageRecord_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "SongUsageRecord_new" ("id", "songId", "rehearsalPlanId", "leaderId", "usedAt", "notes")
SELECT "id", "songId", "rehearsalPlanId", "leaderId", "usedAt", "notes" FROM "SongUsageRecord";
DROP TABLE "SongUsageRecord";
ALTER TABLE "SongUsageRecord_new" RENAME TO "SongUsageRecord";
CREATE INDEX "SongUsageRecord_songId_idx" ON "SongUsageRecord"("songId");
CREATE INDEX "SongUsageRecord_usedAt_idx" ON "SongUsageRecord"("usedAt");

-- Recreate RehearsalPlan linked to ChoirActivity
CREATE TABLE "RehearsalPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choirActivityId" TEXT NOT NULL,
    "leaderId" TEXT,
    "objectives" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RehearsalPlan_choirActivityId_fkey" FOREIGN KEY ("choirActivityId") REFERENCES "ChoirActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalPlan_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RehearsalPlan_choirActivityId_key" ON "RehearsalPlan"("choirActivityId");
CREATE INDEX "RehearsalPlan_leaderId_idx" ON "RehearsalPlan"("leaderId");

CREATE TABLE "RehearsalPlanSong" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rehearsalPlanId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "difficulty" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "readinessPercent" INTEGER,
    "notes" TEXT,
    CONSTRAINT "RehearsalPlanSong_rehearsalPlanId_fkey" FOREIGN KEY ("rehearsalPlanId") REFERENCES "RehearsalPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalPlanSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RehearsalPlanSong_rehearsalPlanId_songId_key" ON "RehearsalPlanSong"("rehearsalPlanId", "songId");

CREATE TABLE "RehearsalPlanSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rehearsalPlanId" TEXT NOT NULL,
    "voiceSectionId" TEXT NOT NULL,
    "focusNotes" TEXT,
    "readinessStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "readinessPercent" INTEGER,
    CONSTRAINT "RehearsalPlanSection_rehearsalPlanId_fkey" FOREIGN KEY ("rehearsalPlanId") REFERENCES "RehearsalPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalPlanSection_voiceSectionId_fkey" FOREIGN KEY ("voiceSectionId") REFERENCES "VoiceSection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RehearsalPlanSection_rehearsalPlanId_voiceSectionId_key" ON "RehearsalPlanSection"("rehearsalPlanId", "voiceSectionId");

CREATE TABLE "RehearsalAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choirActivityId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "recordedByUserId" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RehearsalAttendance_choirActivityId_fkey" FOREIGN KEY ("choirActivityId") REFERENCES "ChoirActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RehearsalAttendance_choirActivityId_memberId_key" ON "RehearsalAttendance"("choirActivityId", "memberId");
CREATE INDEX "RehearsalAttendance_choirActivityId_idx" ON "RehearsalAttendance"("choirActivityId");
CREATE INDEX "RehearsalAttendance_memberId_idx" ON "RehearsalAttendance"("memberId");

PRAGMA foreign_keys=ON;
