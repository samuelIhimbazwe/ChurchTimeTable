-- CreateTable
CREATE TABLE "ServicePreparationAcknowledgment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePreparationAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServicePreparationAcknowledgment_planId_userId_itemKey_key" ON "ServicePreparationAcknowledgment"("planId", "userId", "itemKey");

-- CreateIndex
CREATE INDEX "ServicePreparationAcknowledgment_planId_idx" ON "ServicePreparationAcknowledgment"("planId");

-- CreateIndex
CREATE INDEX "ServicePreparationAcknowledgment_userId_idx" ON "ServicePreparationAcknowledgment"("userId");

-- AddForeignKey
ALTER TABLE "ServicePreparationAcknowledgment" ADD CONSTRAINT "ServicePreparationAcknowledgment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ServicePreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePreparationAcknowledgment" ADD CONSTRAINT "ServicePreparationAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
