import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChoirServiceAssignmentRole,
  ChoirServiceAssignmentSource,
  ChoirServiceAssignmentStatus,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';
import { CONFIRMED_ASSIGNMENT_FILTER } from './choir-assignment-filters.util';
import { ChoirOpsAccessService } from './choir-ops-access.service';
import { ChoirServiceRulesService } from './choir-service-rules.service';
import { ChoirSchedulingNotificationsService } from './choir-scheduling-notifications.service';
import { ChoirScheduleConflictService } from './choir-schedule-conflict.service';

type ProposeInput = {
  choirId: string;
  occurrenceId: string;
  role?: ChoirServiceAssignmentRole;
  overrideReason?: string;
  source: ChoirServiceAssignmentSource;
  bypassRules?: boolean;
  confirmImmediately?: boolean;
  pendingChoirAcceptance?: boolean;
  conflictReason?: string | null;
};

@Injectable()
export class ChoirServiceAssignmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private opsAccess: ChoirOpsAccessService,
    private rules: ChoirServiceRulesService,
    private notify: ChoirSchedulingNotificationsService,
    private conflicts: ChoirScheduleConflictService,
  ) {}

  private async actor(userId: string, choirId?: string) {
    await this.opsAccess.requireView(userId, choirId);
  }

  async isChurchScheduler(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    return (
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_SCHEDULE_RESOLVE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_SCHEDULE_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_GOVERNANCE_MANAGE)
    );
  }

  private async canChurchSchedule(actorUserId: string) {
    return this.isChurchScheduler(actorUserId);
  }

  private async assertChurchSchedule(actorUserId: string) {
    if (!(await this.canChurchSchedule(actorUserId))) {
      throw new ForbiddenException('Church schedule management denied');
    }
  }

  async recommend(actorUserId: string, occurrenceId: string) {
    await this.actor(actorUserId);
    return this.rules.recommendForOccurrence(occurrenceId);
  }

  /** Service assignments are made by church coordination. */
  async assign(
    actorUserId: string,
    data: {
      choirId: string;
      occurrenceId: string;
      role?: ChoirServiceAssignmentRole;
      overrideReason?: string;
      bypassRules?: boolean;
    },
  ) {
    const isChurch = await this.canChurchSchedule(actorUserId);
    if (!isChurch) {
      throw new BadRequestException(
        'Church coordination assigns choirs to services. Use activities for rehearsals and other events.',
      );
    }
    return this.churchDirectAssign(actorUserId, data);
  }

  /** Church assigns a choir to a service — announced immediately unless schedule conflicts exist. */
  async churchDirectAssign(
    actorUserId: string,
    data: {
      choirId: string;
      occurrenceId: string;
      role?: ChoirServiceAssignmentRole;
      overrideReason?: string;
      bypassRules?: boolean;
    },
  ) {
    await this.assertChurchSchedule(actorUserId);
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: data.occurrenceId },
    });
    const serviceEnd = occurrence.endAt ?? occurrence.startAt;
    const conflictRows = await this.conflicts.findConflicts(
      data.choirId,
      data.occurrenceId,
      occurrence.startAt,
      serviceEnd,
    );
    const hasConflict = conflictRows.length > 0;

    return this.propose(actorUserId, {
      ...data,
      role: data.role ?? 'PRIMARY',
      source: 'CHURCH_DIRECT',
      bypassRules: data.bypassRules ?? true,
      confirmImmediately: !hasConflict,
      pendingChoirAcceptance: hasConflict,
      conflictReason: hasConflict
        ? this.conflicts.formatConflictReason(conflictRows)
        : null,
    });
  }

  async checkConflicts(
    actorUserId: string,
    choirId: string,
    occurrenceId: string,
  ) {
    await this.assertChurchSchedule(actorUserId);
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
    });
    const serviceEnd = occurrence.endAt ?? occurrence.startAt;
    return this.conflictSummary(
      choirId,
      occurrenceId,
      occurrence.startAt,
      serviceEnd,
    );
  }

  async checkConflictsForSlot(
    actorUserId: string,
    choirId: string,
    startAt: Date,
    endAt: Date,
  ) {
    await this.assertChurchSchedule(actorUserId);
    return this.conflictSummary(choirId, '__new__', startAt, endAt);
  }

  private async conflictSummary(
    choirId: string,
    occurrenceId: string,
    startAt: Date,
    endAt: Date,
  ) {
    const rows = await this.conflicts.findConflicts(
      choirId,
      occurrenceId,
      startAt,
      endAt,
    );
    return {
      hasConflict: rows.length > 0,
      conflicts: rows,
      summary: rows.length > 0 ? this.conflicts.formatConflictReason(rows) : null,
    };
  }

  async propose(actorUserId: string, data: ProposeInput) {
    const role = data.role ?? 'PRIMARY';
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: data.occurrenceId },
      include: { template: true },
    });

    if (!data.bypassRules && !data.confirmImmediately) {
      const validation = await this.rules.validateChoirSlot(
        data.choirId,
        data.occurrenceId,
        role,
      );
      if (!validation.allowed) {
        throw new BadRequestException({
          message: 'Choir does not meet service slot rules',
          warnings: validation.warnings,
        });
      }
    }

    const status = data.pendingChoirAcceptance
      ? ChoirServiceAssignmentStatus.PENDING_CHOIR_ACCEPTANCE
      : data.confirmImmediately
        ? ChoirServiceAssignmentStatus.CONFIRMED
        : ChoirServiceAssignmentStatus.PENDING_CHURCH_CONFIRMATION;
    const now = data.confirmImmediately ? new Date() : undefined;

    const assignment = await this.prisma.choirServiceAssignment.upsert({
      where: {
        choirId_occurrenceId_role: {
          choirId: data.choirId,
          occurrenceId: data.occurrenceId,
          role,
        },
      },
      create: {
        choirId: data.choirId,
        occurrenceId: data.occurrenceId,
        role,
        status,
        source: data.source,
        assignedById: actorUserId,
        proposedById: actorUserId,
        confirmedById: data.confirmImmediately ? actorUserId : null,
        confirmedAt: now,
        overrideReason: data.overrideReason,
        bypassRules: data.bypassRules ?? false,
        conflictReason: data.conflictReason ?? null,
        choirAcceptedById: null,
        choirAcceptedAt: null,
        announcedAt: data.confirmImmediately ? now : null,
        cancelledAt: null,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      },
      update: {
        cancelledAt: null,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
        status,
        source: data.source,
        assignedById: actorUserId,
        proposedById: actorUserId,
        confirmedById: data.confirmImmediately ? actorUserId : null,
        confirmedAt: now ?? null,
        announcedAt: data.confirmImmediately ? now ?? new Date() : null,
        overrideReason: data.overrideReason,
        bypassRules: data.bypassRules ?? false,
        conflictReason: data.conflictReason ?? null,
        choirAcceptedById: data.confirmImmediately ? undefined : null,
        choirAcceptedAt: data.confirmImmediately ? undefined : null,
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ASSIGNMENT_CREATED,
      entity: 'ChoirServiceAssignment',
      entityId: assignment.id,
      newValue: { ...data, status } as Prisma.InputJsonValue,
    });

    if (data.confirmImmediately) {
      await this.activateAssignment(actorUserId, assignment.id, assignment);
    } else if (data.pendingChoirAcceptance) {
      const notifyPromise = this.notify.notifyPendingChoirAcceptance(
        data.choirId,
        assignment.id,
        assignment.choir.name,
        occurrence.title,
        data.occurrenceId,
        data.conflictReason ?? '',
      );
      if (process.env.CMMS_E2E === '1') {
        await notifyPromise;
      } else {
        void notifyPromise;
      }
    } else {
      const notifyPromise = this.notify.notifyPendingChurchConfirmation(
        assignment.id,
        assignment.choir.name,
        occurrence.title,
        data.occurrenceId,
      );
      if (process.env.CMMS_E2E === '1') {
        await notifyPromise;
      } else {
        void notifyPromise;
      }
    }

    return assignment;
  }

  private async activateAssignment(
    actorUserId: string,
    assignmentId: string,
    row?: {
      choirId: string;
      occurrenceId: string;
      occurrence: { title: string; startAt: Date; endAt: Date | null };
    },
  ) {
    const assignment =
      row ??
      (await this.prisma.choirServiceAssignment.findUniqueOrThrow({
        where: { id: assignmentId },
        include: {
          occurrence: { select: { title: true, startAt: true, endAt: true } },
        },
      }));

    const existingActivity = await this.prisma.choirActivity.findFirst({
      where: {
        occurrenceId: assignment.occurrenceId,
        choirId: assignment.choirId,
      },
    });
    if (!existingActivity) {
      await this.prisma.choirActivity.create({
        data: {
          choirId: assignment.choirId,
          title: `${assignment.occurrence.title} — Service`,
          activityType: 'SERVICE',
          startAt: assignment.occurrence.startAt,
          endAt: assignment.occurrence.endAt ?? assignment.occurrence.startAt,
          occurrenceId: assignment.occurrenceId,
          createdById: actorUserId,
        },
      });
    }

    await this.prisma.choirServiceAssignment.update({
      where: { id: assignmentId },
      data: { announcedAt: new Date() },
    });

    const notifyPromise = this.notify.notifyAssignment(
      assignment.choirId,
      assignment.occurrence.title,
      assignment.occurrenceId,
    );
    if (process.env.CMMS_E2E === '1') {
      await notifyPromise;
    } else {
      void notifyPromise;
    }
  }

  async confirm(
    actorUserId: string,
    assignmentId: string,
    options?: { bypassRules?: boolean; overrideReason?: string },
  ) {
    await this.assertChurchSchedule(actorUserId);
    const existing = await this.prisma.choirServiceAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        choir: { select: { name: true } },
        occurrence: { select: { title: true, startAt: true, endAt: true } },
      },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    if (existing.cancelledAt) throw new BadRequestException('Assignment was cancelled');
    if (existing.status === ChoirServiceAssignmentStatus.REJECTED) {
      throw new BadRequestException('Assignment was rejected');
    }
    if (existing.status === ChoirServiceAssignmentStatus.CONFIRMED) {
      if (!options?.overrideReason && options?.bypassRules === undefined) {
        return existing;
      }
    }

    const bypass = options?.bypassRules ?? existing.bypassRules;
    if (!bypass) {
      const validation = await this.rules.validateChoirSlot(
        existing.choirId,
        existing.occurrenceId,
        existing.role,
      );
      if (!validation.allowed) {
        throw new BadRequestException({
          message: 'Choir does not meet service slot rules — confirm with bypassRules to override',
          warnings: validation.warnings,
        });
      }
    }

    const now = new Date();
    const assignment = await this.prisma.choirServiceAssignment.update({
      where: { id: assignmentId },
      data: {
        status: ChoirServiceAssignmentStatus.CONFIRMED,
        confirmedById: actorUserId,
        confirmedAt: now,
        bypassRules: bypass,
        overrideReason: options?.overrideReason ?? existing.overrideReason,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ASSIGNMENT_CONFIRMED,
      entity: 'ChoirServiceAssignment',
      entityId: assignmentId,
      newValue: { bypassRules: bypass },
    });

    if (!existing.announcedAt) {
      await this.activateAssignment(actorUserId, assignmentId, assignment);
    }

    return assignment;
  }

  async reject(actorUserId: string, assignmentId: string, reason?: string) {
    await this.assertChurchSchedule(actorUserId);
    const existing = await this.prisma.choirServiceAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    if (
      existing.status !== ChoirServiceAssignmentStatus.PENDING_CHURCH_CONFIRMATION &&
      existing.status !== ChoirServiceAssignmentStatus.PENDING_CHOIR_ACCEPTANCE
    ) {
      throw new BadRequestException('Only pending assignments can be rejected');
    }

    const assignment = await this.prisma.choirServiceAssignment.update({
      where: { id: assignmentId },
      data: {
        status: ChoirServiceAssignmentStatus.REJECTED,
        rejectedById: actorUserId,
        rejectedAt: new Date(),
        rejectionReason: reason?.trim() ?? null,
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ASSIGNMENT_REJECTED,
      entity: 'ChoirServiceAssignment',
      entityId: assignmentId,
      newValue: { reason },
    });

    return assignment;
  }

  async acceptByChoir(actorUserId: string, assignmentId: string, notes?: string) {
    const existing = await this.prisma.choirServiceAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        choir: { select: { name: true } },
        occurrence: { select: { title: true, startAt: true, endAt: true } },
      },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    await this.opsAccess.requireView(actorUserId, existing.choirId);
    const canSchedule = await this.opsAccess.canSchedule(actorUserId, existing.choirId);
    const canManage = await this.opsAccess.canManage(actorUserId, existing.choirId);
    if (!canSchedule && !canManage) {
      throw new ForbiddenException('Denied');
    }
    if (existing.status !== ChoirServiceAssignmentStatus.PENDING_CHOIR_ACCEPTANCE) {
      throw new BadRequestException('Only conflicted assignments awaiting choir acceptance can be accepted');
    }

    const now = new Date();
    const assignment = await this.prisma.choirServiceAssignment.update({
      where: { id: assignmentId },
      data: {
        status: ChoirServiceAssignmentStatus.CONFIRMED,
        choirAcceptedById: actorUserId,
        choirAcceptedAt: now,
        confirmedById: existing.assignedById ?? actorUserId,
        confirmedAt: now,
        overrideReason: notes?.trim() ?? existing.overrideReason,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ASSIGNMENT_ACCEPTED,
      entity: 'ChoirServiceAssignment',
      entityId: assignmentId,
      newValue: { notes },
    });

    await this.activateAssignment(actorUserId, assignmentId, assignment);
    return assignment;
  }

  async declineByChoir(actorUserId: string, assignmentId: string, reason?: string) {
    const existing = await this.prisma.choirServiceAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        choir: { select: { name: true } },
        occurrence: { select: { title: true } },
      },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    await this.opsAccess.requireView(actorUserId, existing.choirId);
    const canSchedule = await this.opsAccess.canSchedule(actorUserId, existing.choirId);
    const canManage = await this.opsAccess.canManage(actorUserId, existing.choirId);
    if (!canSchedule && !canManage) {
      throw new ForbiddenException('Denied');
    }
    if (existing.status !== ChoirServiceAssignmentStatus.PENDING_CHOIR_ACCEPTANCE) {
      throw new BadRequestException('Only conflicted assignments can be declined');
    }

    const assignment = await this.prisma.choirServiceAssignment.update({
      where: { id: assignmentId },
      data: {
        status: ChoirServiceAssignmentStatus.REJECTED,
        rejectedById: actorUserId,
        rejectedAt: new Date(),
        rejectionReason:
          reason?.trim() ??
          'Choir declined due to existing activity at the same time',
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ASSIGNMENT_DECLINED,
      entity: 'ChoirServiceAssignment',
      entityId: assignmentId,
      newValue: { reason },
    });

    const notifyPromise = this.notify.notifyChoirDeclinedAssignment(
      assignment.id,
      existing.choir.name,
      existing.occurrence.title,
      assignment.rejectionReason,
    );
    if (process.env.CMMS_E2E === '1') {
      await notifyPromise;
    } else {
      void notifyPromise;
    }

    return assignment;
  }

  async listPendingForChurch(actorUserId: string) {
    await this.assertChurchSchedule(actorUserId);
    return this.prisma.choirServiceAssignment.findMany({
      where: {
        status: ChoirServiceAssignmentStatus.PENDING_CHOIR_ACCEPTANCE,
        cancelledAt: null,
      },
      orderBy: { occurrence: { startAt: 'asc' } },
      take: 100,
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });
  }

  async listForChurch(
    actorUserId: string,
    filters?: { status?: ChoirServiceAssignmentStatus; from?: Date; to?: Date },
  ) {
    await this.assertChurchSchedule(actorUserId);
    return this.prisma.choirServiceAssignment.findMany({
      where: {
        cancelledAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.from || filters?.to
          ? {
              occurrence: {
                startAt: {
                  ...(filters.from ? { gte: filters.from } : {}),
                  ...(filters.to ? { lte: filters.to } : {}),
                },
              },
            }
          : {}),
      },
      orderBy: { occurrence: { startAt: 'asc' } },
      take: 100,
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });
  }

  async listForOccurrence(actorUserId: string, occurrenceId: string) {
    await this.opsAccess.requireView(actorUserId);
    const isChurch = await this.canChurchSchedule(actorUserId);
    const canSchedule = await this.opsAccess.canSchedule(actorUserId);

    return this.prisma.choirServiceAssignment.findMany({
      where: {
        occurrenceId,
        cancelledAt: null,
        ...(!isChurch && !canSchedule ? CONFIRMED_ASSIGNMENT_FILTER : {}),
      },
      include: { choir: { select: { id: true, name: true, code: true } } },
      orderBy: { assignedAt: 'asc' },
    });
  }

  async listForChoir(actorUserId: string, choirId: string) {
    await this.opsAccess.requireView(actorUserId, choirId);
    const isChurch = await this.canChurchSchedule(actorUserId);
    const canSchedule = await this.opsAccess.canSchedule(actorUserId, choirId);
    const canManage = await this.opsAccess.canManage(actorUserId, choirId);
    const canScheduleOrManage = canSchedule || canManage;

    return this.prisma.choirServiceAssignment.findMany({
      where: {
        choirId,
        cancelledAt: null,
        ...(isChurch || canScheduleOrManage ? {} : CONFIRMED_ASSIGNMENT_FILTER),
      },
      include: {
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
      orderBy: { occurrence: { startAt: 'asc' } },
      take: 50,
    });
  }

  async listPendingChoirAcceptance(actorUserId: string, choirId: string) {
    await this.opsAccess.requireView(actorUserId, choirId);
    return this.prisma.choirServiceAssignment.findMany({
      where: {
        choirId,
        status: ChoirServiceAssignmentStatus.PENDING_CHOIR_ACCEPTANCE,
        cancelledAt: null,
      },
      orderBy: { occurrence: { startAt: 'asc' } },
      include: {
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
    });
  }

  async autoAssignForOccurrence(actorUserId: string, occurrenceId: string) {
    await this.assertChurchSchedule(actorUserId);
    const recs = await this.rules.recommendForOccurrence(occurrenceId);
    const results = [];
    for (const rec of recs) {
      results.push(
        await this.churchDirectAssign(actorUserId, {
          choirId: rec.choirId,
          occurrenceId,
          role: rec.role,
        }),
      );
    }
    return results;
  }
}
