-- Wave C4: role template library, time-bound advisor elevation, executive pulse

CREATE TABLE "ChoirCommitteeRoleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "permissionsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirCommitteeRoleTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChoirCommitteeRoleTemplate_name_key" ON "ChoirCommitteeRoleTemplate"("name");

CREATE TABLE "ChoirAdvisorElevation" (
    "id" TEXT NOT NULL,
    "choirId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "permissionsJson" JSONB NOT NULL,
    "reason" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirAdvisorElevation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChoirAdvisorElevation_choirId_idx" ON "ChoirAdvisorElevation"("choirId");
CREATE INDEX "ChoirAdvisorElevation_memberId_idx" ON "ChoirAdvisorElevation"("memberId");
CREATE INDEX "ChoirAdvisorElevation_endsAt_idx" ON "ChoirAdvisorElevation"("endsAt");
CREATE INDEX "ChoirAdvisorElevation_revokedAt_idx" ON "ChoirAdvisorElevation"("revokedAt");

ALTER TABLE "ChoirAdvisorElevation" ADD CONSTRAINT "ChoirAdvisorElevation_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChoirAdvisorElevation" ADD CONSTRAINT "ChoirAdvisorElevation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChoirAdvisorElevation" ADD CONSTRAINT "ChoirAdvisorElevation_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ChoirExecutivePulseEntry" (
    "id" TEXT NOT NULL,
    "choirId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "recordedByMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirExecutivePulseEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChoirExecutivePulseEntry_choirId_weekStart_key" ON "ChoirExecutivePulseEntry"("choirId", "weekStart");
CREATE INDEX "ChoirExecutivePulseEntry_choirId_idx" ON "ChoirExecutivePulseEntry"("choirId");
CREATE INDEX "ChoirExecutivePulseEntry_weekStart_idx" ON "ChoirExecutivePulseEntry"("weekStart");

ALTER TABLE "ChoirExecutivePulseEntry" ADD CONSTRAINT "ChoirExecutivePulseEntry_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChoirExecutivePulseEntry" ADD CONSTRAINT "ChoirExecutivePulseEntry_recordedByMemberId_fkey" FOREIGN KEY ("recordedByMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
