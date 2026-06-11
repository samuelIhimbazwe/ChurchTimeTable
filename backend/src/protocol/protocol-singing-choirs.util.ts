import type { ChoirServiceAssignmentRole, PrismaClient } from '@prisma/client';

const SINGING_ASSIGNMENT_ROLES: ChoirServiceAssignmentRole[] = [
  'PRIMARY',
  'SUPPORTING',
];

/** Choirs assigned to sing at this service (excludes children choir slot). */
export async function resolveSingingChoirIds(
  prisma: PrismaClient,
  occurrenceId: string,
): Promise<string[]> {
  const assignments = await prisma.choirServiceAssignment.findMany({
    where: {
      occurrenceId,
      cancelledAt: null,
      status: 'CONFIRMED',
      role: { in: SINGING_ASSIGNMENT_ROLES },
    },
    select: { choirId: true },
    orderBy: { assignedAt: 'asc' },
  });
  return [...new Set(assignments.map((a) => a.choirId))];
}

/** Map protocol memberId → singing choir ids that member belongs to. */
export async function mapMembersToSingingChoirs(
  prisma: PrismaClient,
  memberIds: string[],
  singingChoirIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (memberIds.length === 0 || singingChoirIds.length === 0) {
    return result;
  }

  const members = await prisma.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, userId: true },
  });
  const userIds = members.map((m) => m.userId).filter(Boolean) as string[];
  const userToMember = new Map(
    members.filter((m) => m.userId).map((m) => [m.userId!, m.id]),
  );

  if (userIds.length === 0) {
    return result;
  }

  const memberships = await prisma.choirMembership.findMany({
    where: {
      userId: { in: userIds },
      isActive: true,
      choirId: { in: singingChoirIds },
    },
    select: { userId: true, choirId: true },
  });

  for (const row of memberships) {
    const memberId = userToMember.get(row.userId);
    if (!memberId) continue;
    const list = result.get(memberId) ?? [];
    if (!list.includes(row.choirId)) {
      list.push(row.choirId);
    }
    result.set(memberId, list);
  }

  return result;
}
