import { ForbiddenException, Injectable } from '@nestjs/common';
import { ChoirScheduleAdjustmentAction } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirOpsAccessService } from './choir-ops-access.service';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';
import { ChoirServiceAssignmentsService } from './choir-service-assignments.service';
import { ChoirSchedulingNotificationsService } from './choir-scheduling-notifications.service';

@Injectable()
export class ChoirScheduleAdjustmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private opsAccess: ChoirOpsAccessService,
    private assignments: ChoirServiceAssignmentsService,
    private notify: ChoirSchedulingNotificationsService,
  ) {}

  async adjust(
    actorUserId: string,
    data: {
      occurrenceId: string;
      action: ChoirScheduleAdjustmentAction;
      choirId?: string;
      newChoirId?: string;
      role?: 'PRIMARY' | 'SUPPORTING' | 'CHILDREN' | 'SPECIAL_GUEST';
      reason?: string;
    },
  ) {
    await this.opsAccess.requireSchedule(actorUserId, data.choirId ?? data.newChoirId);

    let assignmentId: string | undefined;

    if (data.action === 'REPLACE' && data.choirId && data.newChoirId) {
      const isChurch = await this.assignments.isChurchScheduler(actorUserId);
      if (!isChurch) {
        throw new ForbiddenException('Replacing service choirs requires church coordination');
      }
      await this.prisma.choirServiceAssignment.updateMany({
        where: {
          occurrenceId: data.occurrenceId,
          choirId: data.choirId,
          cancelledAt: null,
        },
        data: { cancelledAt: new Date() },
      });
      const created = await this.assignments.churchDirectAssign(actorUserId, {
        choirId: data.newChoirId,
        occurrenceId: data.occurrenceId,
        role: data.role,
        overrideReason: data.reason,
      });
      assignmentId = created.id;
    } else if (data.action === 'ADD_SUPPORTING' && data.newChoirId) {
      const isChurch = await this.assignments.isChurchScheduler(actorUserId);
      if (!isChurch) {
        throw new ForbiddenException('Adding supporting service choirs requires church coordination');
      }
      const created = await this.assignments.churchDirectAssign(actorUserId, {
        choirId: data.newChoirId,
        occurrenceId: data.occurrenceId,
        role: 'SUPPORTING',
        overrideReason: data.reason,
      });
      assignmentId = created.id;
    } else if (data.action === 'CANCEL' && data.choirId) {
      await this.prisma.choirServiceAssignment.updateMany({
        where: {
          occurrenceId: data.occurrenceId,
          choirId: data.choirId,
        },
        data: { cancelledAt: new Date() },
      });
    }

    const adjustment = await this.prisma.choirScheduleAdjustment.create({
      data: {
        occurrenceId: data.occurrenceId,
        choirId: data.choirId,
        assignmentId,
        action: data.action,
        previousChoirId: data.choirId,
        newChoirId: data.newChoirId,
        reason: data.reason,
        actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ASSIGNMENT_ADJUSTED,
      entity: 'ChoirScheduleAdjustment',
      entityId: adjustment.id,
      newValue: data as Prisma.InputJsonValue,
    });

    const notifyPromise = this.notify.notifyScheduleChange(
      data.occurrenceId,
      data.reason,
    );
    if (process.env.CMMS_E2E === '1') {
      await notifyPromise;
    } else {
      void notifyPromise;
    }

    return adjustment;
  }

  async list(actorUserId: string, occurrenceId?: string) {
    await this.opsAccess.requireSchedule(actorUserId);
    return this.prisma.choirScheduleAdjustment.findMany({
      where: occurrenceId ? { occurrenceId } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
