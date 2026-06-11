import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChurchScheduleEntrySource,
  ChurchScheduleSubmissionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { CHURCH_SCHEDULE_AUDIT } from './church-schedule.constants';
import { ChurchScheduleConflictService } from './church-schedule-conflict.service';
import { ChurchScheduleNotificationsService } from './church-schedule-notifications.service';
import { ChurchScheduleScopeService } from './church-schedule-scope.service';
import { assertValidTimeRange } from './church-schedule.util';
import type { CreateChurchScheduleEntryDto } from './dto/create-entry.dto';
import {
  ChurchScheduleResolveAction,
  type ResolveChurchScheduleConflictDto,
} from './dto/resolve-conflict.dto';

const ENTRY_INCLUDE = {
  facility: { select: { id: true, code: true, name: true } },
  submission: {
    select: {
      id: true,
      status: true,
      createdByUserId: true,
      title: true,
    },
  },
} as const;

@Injectable()
export class ChurchScheduleEntriesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private scope: ChurchScheduleScopeService,
    private conflicts: ChurchScheduleConflictService,
    private notify: ChurchScheduleNotificationsService,
  ) {}

  private async assertView(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_SCHEDULE_VIEW)
    ) {
      throw new ForbiddenException('Timetable view denied');
    }
  }

  private async assertManage(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_SCHEDULE_MANAGE)
    ) {
      throw new ForbiddenException('Timetable management denied');
    }
  }

  private async assertResolve(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_SCHEDULE_RESOLVE)
    ) {
      throw new ForbiddenException('Conflict resolution denied');
    }
  }

  async listTimetable(
    actorUserId: string,
    query: {
      from?: string;
      to?: string;
      facilityId?: string;
      scopeType?: string;
      scopeId?: string;
    },
  ) {
    await this.assertView(actorUserId);

    const where: Prisma.ChurchScheduleEntryWhereInput = {
      cancelledAt: null,
    };

    if (query.from || query.to) {
      where.AND = [
        query.to ? { startAt: { lt: new Date(query.to) } } : {},
        query.from ? { endAt: { gt: new Date(query.from) } } : {},
      ];
    }
    if (query.facilityId) where.facilityId = query.facilityId;
    if (query.scopeType) {
      where.scopeType = query.scopeType as Prisma.EnumChurchScheduleScopeTypeFilter['equals'];
    }
    if (query.scopeId) where.scopeId = query.scopeId;

    return this.prisma.churchScheduleEntry.findMany({
      where,
      include: ENTRY_INCLUDE,
      orderBy: { startAt: 'asc' },
      take: 200,
    });
  }

  async createDirect(actorUserId: string, dto: CreateChurchScheduleEntryDto) {
    await this.assertManage(actorUserId);

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    assertValidTimeRange(startAt, endAt);

    const facility = await this.prisma.churchFacility.findFirst({
      where: { id: dto.facilityId, isActive: true },
    });
    if (!facility) throw new BadRequestException('Facility not found');

    if (dto.scopeType && dto.scopeId) {
      await this.scope.validateScopeEntity(dto.scopeType, dto.scopeId);
    }

    const entry = await this.prisma.churchScheduleEntry.create({
      data: {
        source: ChurchScheduleEntrySource.CHURCH_DIRECT,
        title: dto.title.trim(),
        activityType: dto.activityType,
        startAt,
        endAt,
        facilityId: dto.facilityId,
        purpose: dto.purpose?.trim(),
        isChurchBlock: dto.isChurchBlock ?? false,
        scopeType: dto.scopeType,
        scopeId: dto.scopeId,
        createdByUserId: actorUserId,
      },
      include: ENTRY_INCLUDE,
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_SCHEDULE_AUDIT.ENTRY_CREATED,
      entity: 'ChurchScheduleEntry',
      entityId: entry.id,
      newValue: { title: entry.title, source: entry.source } as Prisma.InputJsonValue,
    });

    return entry;
  }

  async cancelEntry(actorUserId: string, entryId: string, reason?: string) {
    await this.assertManage(actorUserId);
    const entry = await this.prisma.churchScheduleEntry.findUnique({
      where: { id: entryId },
      include: { submission: true },
    });
    if (!entry) throw new NotFoundException('Entry not found');
    if (entry.cancelledAt) return entry;

    await this.prisma.$transaction(async (tx) => {
      await tx.churchScheduleEntry.update({
        where: { id: entryId },
        data: { cancelledAt: new Date(), overrideReason: reason?.trim() },
      });

      if (entry.submissionId) {
        await tx.churchScheduleSubmission.update({
          where: { id: entry.submissionId },
          data: { status: ChurchScheduleSubmissionStatus.CANCELLED },
        });
      }
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_SCHEDULE_AUDIT.ENTRY_CANCELLED,
      entity: 'ChurchScheduleEntry',
      entityId: entryId,
    });

    if (entry.submission?.createdByUserId) {
      void this.notify.notifyEntryChanged(
        [entry.submission.createdByUserId],
        entry.title,
        'cancelled',
        entryId,
      );
    }

    return this.prisma.churchScheduleEntry.findUniqueOrThrow({
      where: { id: entryId },
      include: ENTRY_INCLUDE,
    });
  }

  async resolveConflict(
    actorUserId: string,
    submissionId: string,
    dto: ResolveChurchScheduleConflictDto,
  ) {
    await this.assertResolve(actorUserId);

    const submission = await this.prisma.churchScheduleSubmission.findUnique({
      where: { id: submissionId },
      include: { entry: true, facility: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== ChurchScheduleSubmissionStatus.CONFLICT_HELD) {
      throw new BadRequestException('Submission is not in conflict queue');
    }

    if (dto.action === ChurchScheduleResolveAction.REJECT) {
      if (!dto.reason?.trim()) {
        throw new BadRequestException('Rejection reason is required');
      }
      const updated = await this.prisma.churchScheduleSubmission.update({
        where: { id: submissionId },
        data: {
          status: ChurchScheduleSubmissionStatus.REJECTED,
          rejectionReason: dto.reason.trim(),
        },
        include: {
          facility: { select: { id: true, code: true, name: true } },
          entry: true,
        },
      });

      await this.audit.log({
        userId: actorUserId,
        action: CHURCH_SCHEDULE_AUDIT.SUBMISSION_RESOLVED,
        entity: 'ChurchScheduleSubmission',
        entityId: submissionId,
        newValue: { action: 'REJECT', reason: dto.reason } as Prisma.InputJsonValue,
      });

      void this.notify.notifyResolved(
        submission.createdByUserId,
        submissionId,
        submission.title,
        'rejected',
        dto.reason,
      );

      return updated;
    }

    if (dto.action === ChurchScheduleResolveAction.COUNTER_PROPOSE) {
      if (!dto.startAt || !dto.endAt || !dto.facilityId) {
        throw new BadRequestException(
          'Counter-proposal requires facilityId, startAt, and endAt',
        );
      }
      const counterProposal = {
        facilityId: dto.facilityId,
        startAt: dto.startAt,
        endAt: dto.endAt,
        reason: dto.reason?.trim(),
      };

      const updated = await this.prisma.churchScheduleSubmission.update({
        where: { id: submissionId },
        data: {
          status: ChurchScheduleSubmissionStatus.COUNTER_PROPOSED,
          counterProposal,
        },
        include: { facility: { select: { id: true, code: true, name: true } } },
      });

      await this.audit.log({
        userId: actorUserId,
        action: CHURCH_SCHEDULE_AUDIT.SUBMISSION_RESOLVED,
        entity: 'ChurchScheduleSubmission',
        entityId: submissionId,
        newValue: { action: 'COUNTER_PROPOSE', counterProposal } as Prisma.InputJsonValue,
      });

      void this.notify.notifyResolved(
        submission.createdByUserId,
        submissionId,
        submission.title,
        'counter_proposed',
        dto.reason,
      );

      return updated;
    }

    const facilityId = dto.facilityId ?? submission.facilityId;
    const startAt = new Date(dto.startAt ?? submission.startAt);
    const endAt = new Date(dto.endAt ?? submission.endAt);
    assertValidTimeRange(startAt, endAt);

    if (dto.action === ChurchScheduleResolveAction.OVERRIDE && !dto.reason?.trim()) {
      throw new BadRequestException('Override reason is required');
    }

    const range = { startAt, endAt };
    const hits = await this.conflicts.findConflicts(range, facilityId);
    if (
      hits.length &&
      dto.action !== ChurchScheduleResolveAction.OVERRIDE
    ) {
      throw new BadRequestException(
        `Still conflicts with "${hits[0].title}" — use override or pick another slot`,
      );
    }

    const source =
      dto.action === ChurchScheduleResolveAction.OVERRIDE
        ? ChurchScheduleEntrySource.OVERRIDE
        : ChurchScheduleEntrySource.ADMIN_PUBLISHED;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedSubmission = await tx.churchScheduleSubmission.update({
        where: { id: submissionId },
        data: {
          status: ChurchScheduleSubmissionStatus.ADMIN_PUBLISHED,
          facilityId,
          startAt,
          endAt,
          conflictEntryId: null,
          conflictReason: null,
          rejectionReason: null,
        },
      });

      const entry = await tx.churchScheduleEntry.create({
        data: {
          source,
          scopeType: updatedSubmission.scopeType,
          scopeId: updatedSubmission.scopeId,
          title: updatedSubmission.title,
          activityType: updatedSubmission.activityType,
          startAt,
          endAt,
          facilityId,
          purpose: updatedSubmission.purpose,
          overrideReason:
            dto.action === ChurchScheduleResolveAction.OVERRIDE
              ? dto.reason?.trim()
              : undefined,
          submissionId: submissionId,
          createdByUserId: actorUserId,
        },
      });

      return { updatedSubmission, entry };
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_SCHEDULE_AUDIT.SUBMISSION_RESOLVED,
      entity: 'ChurchScheduleSubmission',
      entityId: submissionId,
      newValue: {
        action: dto.action,
        entryId: result.entry.id,
      } as Prisma.InputJsonValue,
    });

    void this.notify.notifyResolved(
      submission.createdByUserId,
      submissionId,
      submission.title,
      'published',
    );

    return this.prisma.churchScheduleSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: {
        facility: { select: { id: true, code: true, name: true } },
        entry: true,
      },
    });
  }
}
