import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChoirActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirOpsAccessService } from './choir-ops-access.service';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';

function toActivityDto(
  row: {
    id: string;
    choirId: string;
    title: string;
    activityType: ChoirActivityType;
    startAt: Date;
    endAt: Date;
    location: string | null;
    occurrenceId: string | null;
    choir?: { name: string } | null;
    _count?: { attendances?: number };
  },
  memberCount = 0,
) {
  const startAt = row.startAt;
  const endAt = row.endAt;
  const attendanceCount = row._count?.attendances ?? 0;
  const now = Date.now();
  const windowStart = startAt.getTime() - 6 * 60 * 60 * 1000;
  const windowEnd = endAt.getTime() + 12 * 60 * 60 * 1000;
  return {
    id: row.id,
    choirId: row.choirId,
    choirName: row.choir?.name,
    activityType: row.activityType,
    title: row.title,
    date: startAt.toISOString(),
    startTime: startAt.toISOString(),
    endTime: endAt.toISOString(),
    location: row.location ?? undefined,
    occurrenceId: row.occurrenceId ?? undefined,
    attendanceOpen: now >= windowStart && now <= windowEnd,
    attendanceCount,
    memberCount,
  };
}

@Injectable()
export class ChoirActivitiesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private opsAccess: ChoirOpsAccessService,
  ) {}

  private async actor(userId: string, choirId?: string) {
    await this.opsAccess.requireView(userId, choirId);
  }

  private async memberCount(choirId: string) {
    return this.prisma.choirMembership.count({
      where: { choirId, isActive: true },
    });
  }

  async create(
    actorUserId: string,
    data: {
      choirId: string;
      title: string;
      description?: string;
      activityType: ChoirActivityType;
      startAt: string;
      endAt: string;
      location?: string;
      notes?: string;
      occurrenceId?: string;
    },
  ) {
    await this.actor(actorUserId, data.choirId);
    await this.opsAccess.requireManage(actorUserId, data.choirId);

    const activity = await this.prisma.choirActivity.create({
      data: {
        choirId: data.choirId,
        title: data.title.trim(),
        description: data.description?.trim(),
        activityType: data.activityType,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        location: data.location,
        notes: data.notes,
        occurrenceId: data.occurrenceId,
        createdById: actorUserId,
      },
      include: {
        choir: { select: { name: true } },
        _count: { select: { attendances: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ACTIVITY_CREATED,
      entity: 'ChoirActivity',
      entityId: activity.id,
      newValue: data as Prisma.InputJsonValue,
    });

    const members = await this.memberCount(activity.choirId);
    return toActivityDto(activity, members);
  }

  async get(actorUserId: string, activityId: string) {
    const activity = await this.prisma.choirActivity.findUnique({
      where: { id: activityId },
      include: {
        choir: { select: { name: true } },
        _count: { select: { attendances: true } },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.actor(actorUserId, activity.choirId);
    const members = await this.memberCount(activity.choirId);
    return toActivityDto(activity, members);
  }

  async list(
    actorUserId: string,
    filters?: {
      choirId?: string;
      from?: Date;
      to?: Date;
      activityType?: ChoirActivityType;
    },
  ) {
    await this.actor(actorUserId, filters?.choirId);
    const rows = await this.prisma.choirActivity.findMany({
      where: {
        ...(filters?.choirId ? { choirId: filters.choirId } : {}),
        ...(filters?.activityType ? { activityType: filters.activityType } : {}),
        ...(filters?.from || filters?.to
          ? {
              startAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startAt: 'desc' },
      take: 200,
    });

    const memberCounts = new Map<string, number>();
    const choirIds = [...new Set(rows.map((r) => r.choirId))];
    await Promise.all(
      choirIds.map(async (id) => {
        memberCounts.set(id, await this.memberCount(id));
      }),
    );

    const items = rows.map((row) =>
      toActivityDto(row, memberCounts.get(row.choirId) ?? 0),
    );
    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    };
  }
}
