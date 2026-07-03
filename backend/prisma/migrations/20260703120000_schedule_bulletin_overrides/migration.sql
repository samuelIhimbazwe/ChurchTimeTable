-- Editable bulletin copy for protocol monthly choir schedules
ALTER TABLE "ChoirSchedulePlan"
  ADD COLUMN IF NOT EXISTS "bulletinOverrides" JSONB;
