-- Choir modules completion: welfare lifecycle, music favorites, rehearsal attendance

-- WelfareCase extended fields
ALTER TABLE "WelfareCase" ADD COLUMN "requestedAmount" DECIMAL;
ALTER TABLE "WelfareCase" ADD COLUMN "approvedAmount" DECIMAL;
ALTER TABLE "WelfareCase" ADD COLUMN "targetDate" DATETIME;
ALTER TABLE "WelfareCase" ADD COLUMN "documentUrls" TEXT;

-- WelfareContribution
ALTER TABLE "WelfareContribution" ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WelfareContribution" ADD COLUMN "receiptUrl" TEXT;

-- Song extended fields
ALTER TABLE "Song" ADD COLUMN "alternateTitle" TEXT;
ALTER TABLE "Song" ADD COLUMN "arranger" TEXT;
ALTER TABLE "Song" ADD COLUMN "year" INTEGER;
ALTER TABLE "Song" ADD COLUMN "copyrightInfo" TEXT;
ALTER TABLE "Song" ADD COLUMN "lyricsText" TEXT;
ALTER TABLE "Song" ADD COLUMN "notes" TEXT;

-- RehearsalPlanSong
ALTER TABLE "RehearsalPlanSong" ADD COLUMN "estimatedMinutes" INTEGER;
ALTER TABLE "RehearsalPlanSong" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "RehearsalPlanSong" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RehearsalPlanSong" ADD COLUMN "readinessPercent" INTEGER;

-- RehearsalPlanSection
ALTER TABLE "RehearsalPlanSection" ADD COLUMN "readinessStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "RehearsalPlanSection" ADD COLUMN "readinessPercent" INTEGER;

-- SongFavorite
CREATE TABLE "SongFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SongFavorite_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SongFavorite_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SongFavorite_memberId_songId_key" ON "SongFavorite"("memberId", "songId");
CREATE INDEX "SongFavorite_memberId_idx" ON "SongFavorite"("memberId");

-- RehearsalAttendance
CREATE TABLE "RehearsalAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "recordedByUserId" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RehearsalAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RehearsalAttendance_eventId_memberId_key" ON "RehearsalAttendance"("eventId", "memberId");
CREATE INDEX "RehearsalAttendance_eventId_idx" ON "RehearsalAttendance"("eventId");
CREATE INDEX "RehearsalAttendance_memberId_idx" ON "RehearsalAttendance"("memberId");
