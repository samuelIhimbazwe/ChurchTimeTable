import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ChoirServiceAssignmentRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';
import { hasChoirOpsManage, hasChoirOpsSchedule, hasChoirOpsView } from './choir-scheduling-access.util';
import { ChoirServiceRulesService } from './choir-service-rules.service';
import { ChoirSchedulingNotificationsService } from './choir-scheduling-notifications.service';

@Injectable()
export class ChoirServiceAssignmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private rules: ChoirServiceRulesService,
    private notify: ChoirSchedulingNotificationsService,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasChoirOpsView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return resolved;
  }

  async recommend(actorUserId: string, occurrenceId: string) {
    await this.actor(actorUserId);
    return this.rules.recommendForOccurrence(occurrenceId);
  }

  async assign(
    actorUserId: string,
    data: {
      choirId: string;
      occurrenceId: string;
      role?: ChoirServiceAssignmentRole;
      overrideReason?: string;
    },
  ) {
    const resolved = await this.actor(actorUserId);
    if (!hasChoirOpsSchedule(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }

    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: data.occurrenceId },
      include: { template: true },
    });

    const assignment = await this.prisma.choirServiceAssignment.upsert({
      where: {
        choirId_occurrenceId_role: {
          choirId: data.choirId,
          occurrenceId: data.occurrenceId,
          role: data.role ?? 'PRIMARY',
        },
      },
      create: {
        choirId: data.choirId,
        occurrenceId: data.occurrenceId,
        role: data.role ?? 'PRIMARY',
        assignedById: actorUserId,
        overrideReason: data.overrideReason,
      },
      update: {
        cancelledAt: null,
        overrideReason: data.overrideReason,
        assignedById: actorUserId,
      },
      include: {
        choir: { select: { name: true } },
        occurrence: { select: { title: true, startAt: true } },
      },
    });

    const existingActivity = await this.prisma.choirActivity.findFirst({
      where: { occurrenceId: data.occurrenceId, choirId: data.choirId },
    });
    if (!existingActivity) {
      await this.prisma.choirActivity.create({
        data: {
          choirId: data.choirId,
          title: `${occurrence.title} — Service`,
          activityType: 'SERVICE',
          startAt: occurrence.startAt,
          endAt: occurrence.endAt,
          occurrenceId: data.occurrenceId,
          createdById: actorUserId,
        },
      });
    }

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ASSIGNMENT_CREATED,
      entity: 'ChoirServiceAssignment',
      entityId: assignment.id,
      newValue: data as Prisma.InputJsonValue,
    });

    void this.notify.notifyAssignment(
      data.choirId,
      occurrence.title,
      data.occurrenceId,
    );

    return assignment;
  }

  async listForOccurrence(actorUserId: string, occurrenceId: string) {
    await this.actor(actorUserId);
    return this.prisma.choirServiceAssignment.findMany({
      where: { occurrenceId, cancelledAt: null },
      include: { choir: { select: { id: true, name: true, code: true } } },
    });
  }

  async autoAssignForOccurrence(actorUserId: string, occurrenceId: string) {
    const resolved = await this.actor(actorUserId);
    if (!hasChoirOpsSchedule(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    const recs = await this.rules.recommendForOccurrence(occurrenceId);
    const results = [];
    for (const rec of recs) {
      results.push(
        await this.assign(actorUserId, {
          choirId: rec.choirId,
          occurrenceId,
          role: rec.role,
        }),
      );
    }
    return results;
  }
}
