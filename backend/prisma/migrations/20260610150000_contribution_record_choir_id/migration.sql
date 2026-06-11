-- Sponsor contributions: link gift to choir treasury (no family)
ALTER TABLE "ContributionRecord" ADD COLUMN IF NOT EXISTS "choirId" TEXT;

CREATE INDEX IF NOT EXISTS "ContributionRecord_choirId_idx" ON "ContributionRecord"("choirId");
