-- Add choir voice part to member extended profile (Phase 1, SQLite)
ALTER TABLE "MemberProfile" ADD COLUMN "voicePart" TEXT NOT NULL DEFAULT 'UNSPECIFIED';
