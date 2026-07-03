import { Injectable } from '@nestjs/common';
import { ChoirServiceAssignmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ChoirScheduleConflict = {
  kind: 'activity' | 'service_assignment';
  id: string;
  title: string;
  activityType?: string;
  startAt: Date;
  endAt: Date;
};

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

@Injectable()
export class ChoirScheduleConflictService {
  constructor(private prisma: PrismaService) {}

  async findConflicts(
    choirId: string,
    occurrenceId: string,
    serviceStart: Date,
    serviceEnd: Date,
  ): Promise<ChoirScheduleConflict[]> {
    const end = serviceEnd ?? serviceStart;
    const conflicts: ChoirScheduleConflict[] = [];

    const activities = await this.prisma.choirActivity.findMany({
      where: {
        choirId,
        OR: [{ occurrenceId: null }, { occurrenceId: { not: occurrenceId } }],
        startAt: { lt: end },
        endAt: { gt: serviceStart },
      },
      select: {
        id: true,
        title: true,
        activityType: true,
        startAt: true,
        endAt: true,
      },
    });

    for (const a of activities) {
      conflicts.push({
        kind: 'activity',
        id: a.id,
        title: a.title,
        activityType: a.activityType,
        startAt: a.startAt,
        endAt: a.endAt,
      });
    }

    const assignments = await this.prisma.choirServiceAssignment.findMany({
      where: {
        choirId,
        occurrenceId: { not: occurrenceId },
        cancelledAt: null,
        status: {
          in: [
            ChoirServiceAssignmentStatus.CONFIRMED,
            ChoirServiceAssignmentStatus.PENDING_CHOIR_ACCEPTANCE,
          ],
        },
        occurrence: { startAt: { lt: end } },
      },
      include: {
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });

    for (const a of assignments) {
      const oStart = a.occurrence.startAt;
      const oEnd = a.occurrence.endAt ?? a.occurrence.startAt;
      if (!overlaps(serviceStart, end, oStart, oEnd)) continue;
      conflicts.push({
        kind: 'service_assignment',
        id: a.id,
        title: a.occurrence.title,
        activityType: 'SERVICE',
        startAt: oStart,
        endAt: oEnd,
      });
    }

    const dayStart = new Date(
      serviceStart.getFullYear(),
      serviceStart.getMonth(),
      serviceStart.getDate(),
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const sameDayServices = await this.prisma.choirServiceAssignment.findMany({
      where: {
        choirId,
        occurrenceId: { not: occurrenceId },
        cancelledAt: null,
        status: {
          in: [
            ChoirServiceAssignmentStatus.CONFIRMED,
            ChoirServiceAssignmentStatus.PENDING_CHOIR_ACCEPTANCE,
          ],
        },
        occurrence: { startAt: { gte: dayStart, lte: dayEnd } },
      },
      include: {
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });

    const seenIds = new Set(conflicts.map((c) => c.id));
    for (const a of sameDayServices) {
      if (seenIds.has(a.id)) continue;
      const oStart = a.occurrence.startAt;
      const oEnd = a.occurrence.endAt ?? a.occurrence.startAt;
      conflicts.push({
        kind: 'service_assignment',
        id: a.id,
        title: a.occurrence.title,
        activityType: 'SERVICE',
        startAt: oStart,
        endAt: oEnd,
      });
    }

    return conflicts;
  }

  formatConflictReason(conflicts: ChoirScheduleConflict[]): string {
    return conflicts
      .map((c) => {
        const when = c.startAt.toISOString().slice(0, 16).replace('T', ' ');
        const type = c.activityType ? ` (${c.activityType})` : '';
        return `${c.title}${type} at ${when}`;
      })
      .join('; ');
  }
}
