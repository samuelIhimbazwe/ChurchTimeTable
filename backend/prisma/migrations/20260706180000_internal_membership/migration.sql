-- Internal membership: admin-provisioned accounts + role-based invites
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AccountInvite" ADD COLUMN "assignedRoleId" TEXT;

CREATE INDEX "AccountInvite_assignedRoleId_idx" ON "AccountInvite"("assignedRoleId");

ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_assignedRoleId_fkey" FOREIGN KEY ("assignedRoleId") REFERENCES "ChoirCommitteeRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
