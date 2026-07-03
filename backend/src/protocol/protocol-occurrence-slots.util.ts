import type { PrismaClient } from '@prisma/client';
import { PROTOCOL_UNIT_CODE } from './protocol.constants';

/** Ensures an occurrence has a PROTOCOL_TEAM operation assignment slot. */
export async function ensureProtocolTeamSlot(
  prisma: PrismaClient,
  occurrenceId: string,
): Promise<void> {
  const unit = await prisma.operationalUnit.findFirst({
    where: { code: PROTOCOL_UNIT_CODE, isActive: true },
  });
  if (!unit) return;

  await prisma.operationAssignment.upsert({
    where: {
      occurrenceId_operationalUnitId: {
        occurrenceId,
        operationalUnitId: unit.id,
      },
    },
    create: {
      occurrenceId,
      operationalUnitId: unit.id,
      assignmentType: 'PROTOCOL_TEAM',
      status: 'PENDING',
    },
    update: {
      assignmentType: 'PROTOCOL_TEAM',
    },
  });
}

export function calendarDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/** Protocol members already rostered on another team the same calendar day. */
export async function membersAssignedOnCalendarDay(
  prisma: PrismaClient,
  day: Date,
  excludeOccurrenceId?: string,
): Promise<Set<string>> {
  const { start, end } = calendarDayBounds(day);
  const rows = await prisma.protocolOccurrenceTeamMember.findMany({
    where: {
      team: {
        occurrence: {
          ...(excludeOccurrenceId ? { id: { not: excludeOccurrenceId } } : {}),
          startAt: { gte: start, lt: end },
        },
      },
    },
    select: { memberId: true },
  });
  return new Set(rows.map((r) => r.memberId));
}
