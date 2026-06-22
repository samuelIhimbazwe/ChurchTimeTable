import { Injectable } from '@nestjs/common';
import type { ChoirActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirOpsAccessService } from './choir-ops-access.service';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';

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
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ACTIVITY_CREATED,
      entity: 'ChoirActivity',
      entityId: activity.id,
      newValue: data as Prisma.InputJsonValue,
    });

    return activity;
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
    return this.prisma.choirActivity.findMany({
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
      include: { choir: { select: { id: true, name: true, code: true } } },
      orderBy: { startAt: 'asc' },
      take: 200,
    });
  }
}
