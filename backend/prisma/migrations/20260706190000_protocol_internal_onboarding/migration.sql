-- Protocol internal onboarding: officer role on PROTOCOL invites
ALTER TABLE "AccountInvite" ADD COLUMN "assignedProtocolRoleId" TEXT;

CREATE INDEX "AccountInvite_assignedProtocolRoleId_idx" ON "AccountInvite"("assignedProtocolRoleId");

ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_assignedProtocolRoleId_fkey" FOREIGN KEY ("assignedProtocolRoleId") REFERENCES "ProtocolCommitteeRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
