-- Wave 4: configurable workspace templates + optional family pulse surveys
ALTER TABLE "Family" ADD COLUMN "workspaceTemplate" TEXT NOT NULL DEFAULT 'DEFAULT';

CREATE TABLE "FamilyPulseEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "recordedByMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyPulseEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FamilyPulseEntry_familyId_weekStart_key" ON "FamilyPulseEntry"("familyId", "weekStart");
CREATE INDEX "FamilyPulseEntry_familyId_idx" ON "FamilyPulseEntry"("familyId");
CREATE INDEX "FamilyPulseEntry_weekStart_idx" ON "FamilyPulseEntry"("weekStart");

ALTER TABLE "FamilyPulseEntry" ADD CONSTRAINT "FamilyPulseEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyPulseEntry" ADD CONSTRAINT "FamilyPulseEntry_recordedByMemberId_fkey" FOREIGN KEY ("recordedByMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
