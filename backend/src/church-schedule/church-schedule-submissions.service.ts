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
import {
  assertValidTimeRange,
  SUBMITTABLE_ACTIVITY_TYPES,
} from './church-schedule.util';
import type { CreateChurchScheduleSubmissionDto } from './dto/create-submission.dto';
import type { UpdateChurchScheduleSubmissionDto } from './dto/update-submission.dto';

const SUBMISSION_INCLUDE = {
  facility: { select: { id: true, code: true, name: true } },
  entry: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      source: true,
      cancelledAt: true,
    },
  },
} as const;

@Injectable()
export class ChurchScheduleSubmissionsService {
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
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_SCHEDULE_VIEW) &&
      !this.scope.canSubmit(resolved.permissions)
    ) {
      throw new ForbiddenException('Schedule view denied');
    }
    return resolved;
  }

  private parseDates(dto: {
    calendarDate: string;
    startAt: string;
    endAt: string;
    weekOf?: string;
  }) {
    const calendarDate = new Date(dto.calendarDate);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    const weekOf = dto.weekOf ? new Date(dto.weekOf) : undefined;
    try {
      assertValidTimeRange(startAt, endAt);
    } catch {
      throw new BadRequestException('endAt must be after startAt');
    }
    return { calendarDate, startAt, endAt, weekOf };
  }

  private async assertFacility(facilityId: string) {
    const facility = await this.prisma.churchFacility.findFirst({
      where: { id: facilityId, isActive: true },
    });
    if (!facility) throw new BadRequestException('Facility not found or inactive');
    return facility;
  }

  private assertEditableStatus(status: ChurchScheduleSubmissionStatus) {
    if (
      status !== ChurchScheduleSubmissionStatus.DRAFT &&
      status !== ChurchScheduleSubmissionStatus.COUNTER_PROPOSED
    ) {
      throw new BadRequestException('Submission cannot be edited in current status');
    }
  }

  async listScopes(actorUserId: string) {
    await this.assertView(actorUserId);
    return this.scope.listSubmitScopes(actorUserId);
  }

  async listMine(actorUserId: string, status?: ChurchScheduleSubmissionStatus) {
    await this.assertView(actorUserId);
    return this.prisma.churchScheduleSubmission.findMany({
      where: {
        createdByUserId: actorUserId,
        ...(status ? { status } : {}),
      },
      include: SUBMISSION_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async listConflicts(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(
        resolved.permissions,
        PERMISSIONS.CHURCH_SCHEDULE_VIEW_QUEUE,
      )
    ) {
      throw new ForbiddenException('Conflict queue access denied');
    }
    return this.prisma.churchScheduleSubmission.findMany({
      where: { status: ChurchScheduleSubmissionStatus.CONFLICT_HELD },
      include: SUBMISSION_INCLUDE,
      orderBy: { submittedAt: 'asc' },
      take: 100,
    });
  }

  async getOne(actorUserId: string, id: string) {
    await this.assertView(actorUserId);
    const row = await this.prisma.churchScheduleSubmission.findUnique({
      where: { id },
      include: SUBMISSION_INCLUDE,
    });
    if (!row) throw new NotFoundException('Submission not found');

    const resolved = await this.permissions.resolveForUser(actorUserId);
    const isAdmin = this.scope.isChurchScheduleAdmin(resolved.permissions);
    const canQueue = hasEffectivePermission(
      resolved.permissions,
      PERMISSIONS.CHURCH_SCHEDULE_VIEW_QUEUE,
    );
    if (
      row.createdByUserId !== actorUserId &&
      !isAdmin &&
      !canQueue
    ) {
      throw new ForbiddenException('Access denied');
    }
    return row;
  }

  async create(actorUserId: string, dto: CreateChurchScheduleSubmissionDto) {
    if (!SUBMITTABLE_ACTIVITY_TYPES.includes(dto.activityType)) {
      throw new BadRequestException('Activity type not allowed for submission');
    }

    await this.scope.assertSubmitScope(actorUserId, dto.scopeType, dto.scopeId);
    await this.scope.validateScopeEntity(dto.scopeType, dto.scopeId);
    await this.assertFacility(dto.facilityId);

    const dates = this.parseDates(dto);

    const row = await this.prisma.churchScheduleSubmission.create({
      data: {
        scopeType: dto.scopeType,
        scopeId: dto.scopeId,
        title: dto.title.trim(),
        activityType: dto.activityType,
        calendarDate: dates.calendarDate,
        startAt: dates.startAt,
        endAt: dates.endAt,
        facilityId: dto.facilityId,
        purpose: dto.purpose?.trim(),
        weekOf: dates.weekOf,
        notes: dto.notes?.trim(),
        status: ChurchScheduleSubmissionStatus.DRAFT,
        createdByUserId: actorUserId,
      },
      include: SUBMISSION_INCLUDE,
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_SCHEDULE_AUDIT.SUBMISSION_CREATED,
      entity: 'ChurchScheduleSubmission',
      entityId: row.id,
      newValue: { title: row.title, status: row.status } as Prisma.InputJsonValue,
    });

    return row;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: UpdateChurchScheduleSubmissionDto,
  ) {
    const existing = await this.getOne(actorUserId, id);
    if (existing.createdByUserId !== actorUserId) {
      throw new ForbiddenException('Only the submitter can edit this draft');
    }
    this.assertEditableStatus(existing.status);

    if (dto.scopeType && dto.scopeId) {
      await this.scope.assertSubmitScope(actorUserId, dto.scopeType, dto.scopeId);
      await this.scope.validateScopeEntity(dto.scopeType, dto.scopeId);
    } else if (dto.scopeType || dto.scopeId) {
      throw new BadRequestException('scopeType and scopeId must be updated together');
    }

    if (dto.activityType && !SUBMITTABLE_ACTIVITY_TYPES.includes(dto.activityType)) {
      throw new BadRequestException('Activity type not allowed');
    }

    if (dto.facilityId) await this.assertFacility(dto.facilityId);

    const dates = dto.startAt || dto.endAt || dto.calendarDate
      ? this.parseDates({
          calendarDate: dto.calendarDate ?? existing.calendarDate.toISOString(),
          startAt: dto.startAt ?? existing.startAt.toISOString(),
          endAt: dto.endAt ?? existing.endAt.toISOString(),
          weekOf: dto.weekOf ?? existing.weekOf?.toISOString(),
        })
      : null;

    return this.prisma.churchScheduleSubmission.update({
      where: { id },
      data: {
        scopeType: dto.scopeType,
        scopeId: dto.scopeId,
        title: dto.title?.trim(),
        activityType: dto.activityType,
        calendarDate: dates?.calendarDate,
        startAt: dates?.startAt,
        endAt: dates?.endAt,
        facilityId: dto.facilityId,
        purpose: dto.purpose?.trim(),
        weekOf: dates?.weekOf,
        notes: dto.notes?.trim(),
        status:
          existing.status === ChurchScheduleSubmissionStatus.COUNTER_PROPOSED
            ? ChurchScheduleSubmissionStatus.DRAFT
            : undefined,
      },
      include: SUBMISSION_INCLUDE,
    });
  }

  async submit(actorUserId: string, id: string) {
    const existing = await this.getOne(actorUserId, id);
    if (existing.createdByUserId !== actorUserId) {
      throw new ForbiddenException('Only the submitter can submit');
    }
    this.assertEditableStatus(existing.status);

    const range = { startAt: existing.startAt, endAt: existing.endAt };
    const hits = await this.conflicts.findConflicts(range, existing.facilityId);
    const conflictReason = this.conflicts.formatConflictReason(hits);
    const alternatives = hits.length
      ? await this.conflicts.suggestAlternatives(range, existing.facilityId)
      : [];

    const now = new Date();

    if (!hits.length) {
      const result = await this.prisma.$transaction(async (tx) => {
        const recheck = await this.conflicts.findConflicts(
          range,
          existing.facilityId,
        );
        if (recheck.length) {
          throw new BadRequestException('Conflict detected on publish — please retry');
        }

        const submission = await tx.churchScheduleSubmission.update({
          where: { id },
          data: {
            status: ChurchScheduleSubmissionStatus.AUTO_PUBLISHED,
            submittedByUserId: actorUserId,
            submittedAt: now,
            conflictEntryId: null,
            conflictReason: null,
            suggestedAlternatives: Prisma.JsonNull,
          },
        });

        const entry = await tx.churchScheduleEntry.create({
          data: {
            source: ChurchScheduleEntrySource.AUTO_PUBLISHED,
            scopeType: submission.scopeType,
            scopeId: submission.scopeId,
            title: submission.title,
            activityType: submission.activityType,
            startAt: submission.startAt,
            endAt: submission.endAt,
            facilityId: submission.facilityId,
            purpose: submission.purpose,
            submissionId: submission.id,
            createdByUserId: actorUserId,
          },
        });

        return { submission, entry };
      });

      await this.audit.log({
        userId: actorUserId,
        action: CHURCH_SCHEDULE_AUDIT.SUBMISSION_AUTO_PUBLISHED,
        entity: 'ChurchScheduleSubmission',
        entityId: id,
        newValue: { entryId: result.entry.id } as Prisma.InputJsonValue,
      });

      const notifyPromise = this.notify.notifyAutoPublished(
        actorUserId,
        id,
        existing.title,
      );
      if (process.env.CMMS_E2E === '1') await notifyPromise;
      else void notifyPromise;

      return this.prisma.churchScheduleSubmission.findUniqueOrThrow({
        where: { id },
        include: SUBMISSION_INCLUDE,
      });
    }

    const held = await this.prisma.churchScheduleSubmission.update({
      where: { id },
      data: {
        status: ChurchScheduleSubmissionStatus.CONFLICT_HELD,
        submittedByUserId: actorUserId,
        submittedAt: now,
        conflictEntryId: hits[0]?.entryId,
        conflictReason,
        suggestedAlternatives: this.conflicts.alternativesToJson(alternatives),
      },
      include: SUBMISSION_INCLUDE,
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_SCHEDULE_AUDIT.SUBMISSION_CONFLICT_HELD,
      entity: 'ChurchScheduleSubmission',
      entityId: id,
      newValue: { conflictReason } as Prisma.InputJsonValue,
    });

    const notifyPromise = this.notify.notifyConflictHeld(
      actorUserId,
      id,
      existing.title,
      conflictReason,
    );
    if (process.env.CMMS_E2E === '1') await notifyPromise;
    else void notifyPromise;

    return held;
  }

  async cancel(actorUserId: string, id: string) {
    const existing = await this.getOne(actorUserId, id);
    const resolved = await this.permissions.resolveForUser(actorUserId);
    const isAdmin = this.scope.isChurchScheduleAdmin(resolved.permissions);
    if (existing.createdByUserId !== actorUserId && !isAdmin) {
      throw new ForbiddenException('Cannot cancel this submission');
    }

    if (existing.status === ChurchScheduleSubmissionStatus.CANCELLED) {
      return existing;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.churchScheduleSubmission.update({
        where: { id },
        data: { status: ChurchScheduleSubmissionStatus.CANCELLED },
      });

      if (existing.entry && !existing.entry.cancelledAt) {
        await tx.churchScheduleEntry.update({
          where: { id: existing.entry.id },
          data: { cancelledAt: new Date() },
        });
      }
    });

    return this.prisma.churchScheduleSubmission.findUniqueOrThrow({
      where: { id },
      include: SUBMISSION_INCLUDE,
    });
  }
}
