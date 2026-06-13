-- Effective-dated choir committee assignments (Workday-style seat history)
ALTER TABLE "ChoirCommitteeMember" ADD COLUMN IF NOT EXISTS "effectiveEnd" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ChoirCommitteeMember_effectiveEnd_idx" ON "ChoirCommitteeMember"("effectiveEnd");
