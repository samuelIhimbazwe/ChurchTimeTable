-- CreateEnum
CREATE TYPE "ThankYouDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "ContributionRecord" ADD COLUMN "thankYouSentById" TEXT,
ADD COLUMN "thankYouDeliveryStatus" "ThankYouDeliveryStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "ContributionRecord_thankYouDeliveryStatus_idx" ON "ContributionRecord"("thankYouDeliveryStatus");

-- AddForeignKey
ALTER TABLE "ContributionRecord" ADD CONSTRAINT "ContributionRecord_thankYouSentById_fkey" FOREIGN KEY ("thankYouSentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
