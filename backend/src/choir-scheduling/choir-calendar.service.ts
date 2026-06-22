import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChoirOpsAccessService } from './choir-ops-access.service';
import { CONFIRMED_ASSIGNMENT_FILTER } from './choir-assignment-filters.util';

export type ChoirCalendarItem = {
  id: string;
  source: 'choir_activity' | 'choir_assignment';
  title: string;
  activityType?: string;
  startAt: Date;
  endAt: Date;
  choirId: string;
  choirName?: string;
  occurrenceId?: string | null;
};

@Injectable()
export class ChoirCalendarService {
  constructor(
    private prisma: PrismaService,
    private opsAccess: ChoirOpsAccessService,
  ) {}

  async listForRange(
    actorUserId: string | null,
    from: Date,
    to: Date,
    choirId?: string,
  ): Promise<ChoirCalendarItem[]> {
    if (actorUserId) {
      await this.opsAccess.requireView(actorUserId, choirId);
    }

    const activities = await this.prisma.choirActivity.findMany({
      where: {
        ...(choirId ? { choirId } : {}),
        startAt: { gte: from, lte: to },
      },
      include: { choir: { select: { name: true } } },
    });

    const items: ChoirCalendarItem[] = activities.map((a) => ({
      id: a.id,
      source: 'choir_activity',
      title: a.title,
      activityType: a.activityType,
      startAt: a.startAt,
      endAt: a.endAt,
      choirId: a.choirId,
      choirName: a.choir.name,
      occurrenceId: a.occurrenceId,
    }));

    const assignments = await this.prisma.choirServiceAssignment.findMany({
      where: {
        ...(choirId ? { choirId } : {}),
        ...CONFIRMED_ASSIGNMENT_FILTER,
        occurrence: { startAt: { gte: from, lte: to } },
      },
      include: {
        choir: { select: { name: true } },
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });

    for (const a of assignments) {
      if (items.some((i) => i.occurrenceId === a.occurrenceId && i.choirId === a.choirId)) {
        continue;
      }
      items.push({
        id: a.id,
        source: 'choir_assignment',
        title: `${a.occurrence.title} (${a.role})`,
        activityType: 'SERVICE',
        startAt: a.occurrence.startAt,
        endAt: a.occurrence.endAt,
        choirId: a.choirId,
        choirName: a.choir.name,
        occurrenceId: a.occurrenceId,
      });
    }

    return items.sort((x, y) => x.startAt.getTime() - y.startAt.getTime());
  }
}
