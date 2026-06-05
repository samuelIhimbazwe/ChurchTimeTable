-- Allow multiple protocol team leaders per service team (one per singing choir).
DROP INDEX IF EXISTS "ProtocolOccurrenceTeamLeader_teamId_key";
CREATE UNIQUE INDEX "ProtocolOccurrenceTeamLeader_teamId_protocolTeamLeaderId_key"
  ON "ProtocolOccurrenceTeamLeader"("teamId", "protocolTeamLeaderId");
