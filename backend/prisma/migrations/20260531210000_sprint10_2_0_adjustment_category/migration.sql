-- Sprint 10.2.0: adjustment category + optional reference contribution

-- SQLite: Prisma stores enums as TEXT
ALTER TABLE "ContributionAdjustment" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'CORRECTION';
ALTER TABLE "ContributionAdjustment" ADD COLUMN "referenceContributionId" TEXT;
