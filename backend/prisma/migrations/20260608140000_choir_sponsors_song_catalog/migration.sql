-- Choir sponsorship + extended song catalog metadata

CREATE TYPE "ChoirSponsorRequestKind" AS ENUM ('NEW_SPONSOR', 'EXISTING_SPONSOR');
CREATE TYPE "ChoirSponsorRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

CREATE TABLE "ChoirSponsorRequest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "choirId" TEXT NOT NULL,
    "kind" "ChoirSponsorRequestKind" NOT NULL,
    "message" TEXT,
    "status" "ChoirSponsorRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirSponsorRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChoirSponsorship" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "choirId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirSponsorship_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChoirSponsorship_memberId_choirId_key" ON "ChoirSponsorship"("memberId", "choirId");
CREATE INDEX "ChoirSponsorship_choirId_active_idx" ON "ChoirSponsorship"("choirId", "active");
CREATE INDEX "ChoirSponsorship_memberId_active_idx" ON "ChoirSponsorship"("memberId", "active");
CREATE INDEX "ChoirSponsorRequest_choirId_status_idx" ON "ChoirSponsorRequest"("choirId", "status");
CREATE INDEX "ChoirSponsorRequest_memberId_status_idx" ON "ChoirSponsorRequest"("memberId", "status");

ALTER TABLE "ChoirSponsorRequest" ADD CONSTRAINT "ChoirSponsorRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChoirSponsorRequest" ADD CONSTRAINT "ChoirSponsorRequest_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChoirSponsorRequest" ADD CONSTRAINT "ChoirSponsorRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChoirSponsorship" ADD CONSTRAINT "ChoirSponsorship_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChoirSponsorship" ADD CONSTRAINT "ChoirSponsorship_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Song" ADD COLUMN "lyricist" TEXT;
ALTER TABLE "Song" ADD COLUMN "conductedBy" TEXT;
ALTER TABLE "Song" ADD COLUMN "producedBy" TEXT;
ALTER TABLE "Song" ADD COLUMN "performedBy" TEXT;
ALTER TABLE "Song" ADD COLUMN "genre" TEXT;
ALTER TABLE "Song" ADD COLUMN "voiceParts" TEXT;
ALTER TABLE "Song" ADD COLUMN "durationSeconds" INTEGER;
ALTER TABLE "Song" ADD COLUMN "releaseDate" TIMESTAMP(3);
ALTER TABLE "Song" ADD COLUMN "shortSummary" TEXT;
ALTER TABLE "Song" ADD COLUMN "fullDescription" TEXT;
ALTER TABLE "Song" ADD COLUMN "recordingStudio" TEXT;
ALTER TABLE "Song" ADD COLUMN "mixingEngineer" TEXT;
ALTER TABLE "Song" ADD COLUMN "masteringBy" TEXT;
ALTER TABLE "Song" ADD COLUMN "recordingType" TEXT;
ALTER TABLE "Song" ADD COLUMN "listenLinksJson" JSONB;
