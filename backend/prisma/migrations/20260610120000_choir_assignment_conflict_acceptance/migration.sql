-- Church assigns choirs to services; conflicts require choir acceptance before announcement

ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "conflictReason" TEXT;
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "choirAcceptedById" TEXT;
ALTER TABLE "ChoirServiceAssignment" ADD COLUMN "choirAcceptedAt" TIMESTAMP(3);
