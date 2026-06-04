import { ForbiddenException, Injectable } from '@nestjs/common';
import type { ChoirActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';
import { hasChoirOpsManage, hasChoirOpsView } from './choir-scheduling-access.util';

@Injectable()
export class ChoirActivitiesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasChoirOpsView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return resolved;
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
    const resolved = await this.actor(actorUserId);
    if (!hasChoirOpsManage(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }

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
    await this.actor(actorUserId);
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
