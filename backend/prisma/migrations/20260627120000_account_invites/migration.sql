-- CreateEnum
CREATE TYPE "AccountInviteType" AS ENUM ('CHOIR', 'PROTOCOL', 'DUAL');

-- CreateEnum
CREATE TYPE "AccountInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "AccountInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "inviteType" "AccountInviteType" NOT NULL,
    "choirId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "AccountInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "invitedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvite_tokenHash_key" ON "AccountInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountInvite_email_status_idx" ON "AccountInvite"("email", "status");

-- CreateIndex
CREATE INDEX "AccountInvite_status_expiresAt_idx" ON "AccountInvite"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "AccountInvite_choirId_idx" ON "AccountInvite"("choirId");

-- AddForeignKey
ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
