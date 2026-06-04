-- MEMBER-PORTAL-1: Church member portal, join requests, protocol invitations

-- SQLite: apply via prisma db push in dev/e2e; structural reference migration.

CREATE TABLE "ChurchBroadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeUrl" TEXT NOT NULL,
    "thumbnail" TEXT,
    "broadcastType" TEXT NOT NULL DEFAULT 'OTHER',
    "startAt" TIMESTAMP,
    "endAt" TIMESTAMP,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "ChurchBroadcast_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id")
);

CREATE TABLE "ChoirJoinRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "choirId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'PERMANENT_MEMBER',
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "ChoirJoinRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE,
    CONSTRAINT "ChoirJoinRequest_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir"("id") ON DELETE CASCADE
);

CREATE TABLE "ProtocolInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP NOT NULL,
    "respondedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "ProtocolInvitation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE,
    CONSTRAINT "ProtocolInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Member"("id")
);

CREATE TABLE "ProtocolMembershipClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "ProtocolMembershipClaim_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE
);
