-- Multi-choir foundation + devotion center (PostgreSQL)
-- All existing choir MVP rows backfill to MAIN_CHOIR.

INSERT INTO "Choir" ("id", "name", "code", "description", "isActive", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Main Choir',
  'MAIN_CHOIR',
  'Default choir — all legacy MVP data belongs here.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- Backfill choirId on choir-owned tables (nullable columns added by Prisma migrate)
UPDATE "Family" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "Event" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL AND "ministryScope" = 'CHOIR';
UPDATE "WelfareCase" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "Song" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "SongCategory" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "ChoirDocument" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "ChoirMeeting" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "ChoirAnnouncement" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "UniformType" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "EquipmentAsset" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "ContributionTypeCatalog" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "ContributionCampaign" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" IS NULL;
UPDATE "ChoirCommitteeRole" SET "choirId" = '00000000-0000-0000-0000-000000000001' WHERE "choirId" = 'default-choir' OR "choirId" IS NULL;
