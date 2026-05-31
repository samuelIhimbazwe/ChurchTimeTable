-- AlterTable
ALTER TABLE "Member" ADD COLUMN "memberNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberNumber_key" ON "Member"("memberNumber");

-- CreateTable
CREATE TABLE "MemberNumberSequence" (
    "id" TEXT NOT NULL,
    "nextValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberNumberSequence_pkey" PRIMARY KEY ("id")
);

-- Initialize singleton sequence row
INSERT INTO "MemberNumberSequence" ("id", "nextValue", "createdAt", "updatedAt")
VALUES ('primary', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
