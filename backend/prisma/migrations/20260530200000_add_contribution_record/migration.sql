-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('TITHE', 'OFFERING', 'SPECIAL', 'BUILDING_FUND', 'MISSIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "ContributionRecord" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "familyId" TEXT,
    "financeTransactionId" TEXT,
    "memberDueId" TEXT,
    "contributionType" "ContributionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "referenceNumber" TEXT NOT NULL,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "thankYouSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContributionRecord_referenceNumber_key" ON "ContributionRecord"("referenceNumber");

-- CreateIndex
CREATE INDEX "ContributionRecord_memberId_idx" ON "ContributionRecord"("memberId");

-- CreateIndex
CREATE INDEX "ContributionRecord_status_idx" ON "ContributionRecord"("status");

-- CreateIndex
CREATE INDEX "ContributionRecord_contributionType_idx" ON "ContributionRecord"("contributionType");

-- CreateIndex
CREATE INDEX "ContributionRecord_financeTransactionId_idx" ON "ContributionRecord"("financeTransactionId");

-- CreateIndex
CREATE INDEX "ContributionRecord_memberDueId_idx" ON "ContributionRecord"("memberDueId");

-- CreateIndex
CREATE INDEX "ContributionRecord_confirmedAt_idx" ON "ContributionRecord"("confirmedAt");

-- CreateIndex
CREATE INDEX "ContributionRecord_familyId_idx" ON "ContributionRecord"("familyId");

-- AddForeignKey
ALTER TABLE "ContributionRecord" ADD CONSTRAINT "ContributionRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionRecord" ADD CONSTRAINT "ContributionRecord_memberDueId_fkey" FOREIGN KEY ("memberDueId") REFERENCES "MemberDues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionRecord" ADD CONSTRAINT "ContributionRecord_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
