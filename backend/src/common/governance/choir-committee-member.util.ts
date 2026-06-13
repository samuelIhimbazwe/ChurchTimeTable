import type { Prisma } from '@prisma/client';

/** Active choir committee seat — not ended or end date is in the future. */
export function activeChoirCommitteeMemberWhere(
  at = new Date(),
): Prisma.ChoirCommitteeMemberWhereInput {
  return {
    OR: [{ effectiveEnd: null }, { effectiveEnd: { gt: at } }],
  };
}
