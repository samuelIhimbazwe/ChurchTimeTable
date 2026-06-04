import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import {
  ChurchOperationType,
  OperationAssignmentStatus,
  OperationOccurrenceStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import {
  ASSIGNMENT_TYPE_UNIT_CODES,
  OPERATIONS_AUDIT,
  OPERATIONS_AUDIT_ENTITY,
  SYSTEM_OPERATION_TEMPLATES,
} from './operations.constants';
import {
  hasOperationsAssignmentConfirm,
  hasOperationsAssignmentManage,
  hasOperationsManage,
  hasOperationsOverride,
  hasOperationsScheduleApprove,
  hasOperationsSchedulePublish,
  hasOperationsView,
} from './operations-access.util';
import { ServiceRulesService } from './service-rules.service';
import { RotationService } from './rotation.service';
import { OperationsNotificationsService } from './operations-notifications.service';
import { ProtocolTeamsService } from '../protocol/protocol-teams.service';
import { ChoirCalendarService } from '../choir-scheduling/choir-calendar.service';

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissionsResolver: PermissionsResolver,
    private rules: ServiceRulesService,
    private rotation: RotationService,
    private opNotifications: OperationsNotificationsService,
    private protocolTeams: ProtocolTeamsService,
    @Optional()
    @Inject(forwardRef(() => ChoirCalendarService))
    private choirCalendar?: ChoirCalendarService,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissionsResolver.resolveForUser(userId);
    return { userId, permissions: resolved.permissions, memberId: resolved.memberId };
  }

  async listTemplates(actorUserId: string) {
    await this.assertView(actorUserId);
    return this.prisma.operationTemplate.findMany({
      where: { isActive: true },
      include: { requirements: true },
      orderBy: { name: 'asc' },
    });
  }

  async listOccurrences(
    actorUserId: string,
    filters?: { from?: Date; to?: Date; status?: OperationOccurrenceStatus },
  ) {
    await this.assertView(actorUserId);
    return this.prisma.operationOccurrence.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
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
        template: true,
        requirements: true,
        assignments: { include: { operationalUnit: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async getOccurrence(actorUserId: string, id: string) {
    await this.assertView(actorUserId);
    return this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id },
      include: {
        template: true,
        requirements: true,
        assignments: { include: { operationalUnit: true, member: true } },
      },
    });
  }

  async createOccurrence(
    actorUserId: string,
    dto: {
      templateId?: string;
      type: ChurchOperationType;
      title: string;
      description?: string;
      startAt: string;
      endAt: string;
      requirements?: Array<{
        assignmentType: string;
        quantity: number;
        required?: boolean;
        notes?: string;
      }>;
    },
  ) {
    const actor = await this.actor(actorUserId);
    if (!hasOperationsManage(actor.permissions)) {
      throw new ForbiddenException('Operation creation denied');
    }

    let requirements = dto.requirements ?? [];
    if (dto.templateId) {
      const template = await this.prisma.operationTemplate.findUniqueOrThrow({
        where: { id: dto.templateId },
        include: { requirements: true },
      });
      if (dto.type === 'SERVICE' && requirements.length === 0) {
        requirements = template.requirements.map((r) => ({
          assignmentType: r.assignmentType,
          quantity: r.quantity,
          required: r.required,
          notes: r.notes ?? undefined,
        }));
      }
    }

    const occurrence = await this.prisma.operationOccurrence.create({
      data: {
        templateId: dto.templateId,
        type: dto.type,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        createdById: actorUserId,
        requirements: {
          create: requirements.map((r) => ({
            assignmentType: r.assignmentType as never,
            quantity: r.quantity,
            required: r.required ?? true,
            notes: r.notes,
          })),
        },
      },
      include: { requirements: true, template: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONS_AUDIT.OCCURRENCE_CREATED,
      entity: OPERATIONS_AUDIT_ENTITY,
      entityId: occurrence.id,
      newValue: { title: occurrence.title, type: occurrence.type },
    });

    return occurrence;
  }

  async transitionStatus(
    actorUserId: string,
    occurrenceId: string,
    status: OperationOccurrenceStatus,
  ) {
    const actor = await this.actor(actorUserId);
    const occurrence = await this.getOccurrence(actorUserId, occurrenceId);

    if (status === 'UNDER_REVIEW' && !hasOperationsManage(actor.permissions)) {
      throw new ForbiddenException('Denied');
    }
    if (status === 'APPROVED' && !hasOperationsScheduleApprove(actor.permissions)) {
      throw new ForbiddenException('Approval denied');
    }
    if (status === 'PUBLISHED' && !hasOperationsSchedulePublish(actor.permissions)) {
      throw new ForbiddenException('Publication denied');
    }
    if (status === 'CANCELLED' && !hasOperationsManage(actor.permissions)) {
      throw new ForbiddenException('Cancel denied');
    }

    if (status === 'PUBLISHED') {
      const missing = await this.missingRequirements(occurrenceId);
      if (missing.length > 0) {
        throw new BadRequestException({ message: 'Missing assignments', missing });
      }
    }

    const updated = await this.prisma.operationOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status,
        approvedById:
          status === 'APPROVED' || status === 'PUBLISHED'
            ? actorUserId
            : occurrence.approvedById,
        publishedAt: status === 'PUBLISHED' ? new Date() : occurrence.publishedAt,
        completedAt: status === 'COMPLETED' ? new Date() : occurrence.completedAt,
        cancelledAt: status === 'CANCELLED' ? new Date() : occurrence.cancelledAt,
      },
      include: { template: true, requirements: true, assignments: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONS_AUDIT.OCCURRENCE_STATUS,
      entity: OPERATIONS_AUDIT_ENTITY,
      entityId: occurrenceId,
      newValue: { status },
    });

    if (status === 'PUBLISHED') {
      await this.opNotifications.notifyPublished(occurrenceId);
      const hasProtocol = updated.assignments.some(
        (a) => a.assignmentType === 'PROTOCOL_TEAM',
      );
      if (hasProtocol) {
        await this.protocolTeams.onOccurrencePublished(occurrenceId, actorUserId);
      }
    }
    if (status === 'CANCELLED') {
      await this.opNotifications.notifyCancelled(occurrenceId);
    }

    return updated;
  }

  async listConflicts(actorUserId: string, occurrenceId: string) {
    await this.assertView(actorUserId);
    const occurrence = await this.getOccurrence(actorUserId, occurrenceId);
    const all: Awaited<ReturnType<ServiceRulesService['validateAssignment']>> = [];
    for (const assignment of occurrence.assignments) {
      const conflicts = await this.rules.validateAssignment({
        occurrenceId,
        operationalUnitId: assignment.operationalUnitId,
        assignmentType: assignment.assignmentType,
        excludeAssignmentId: assignment.id,
      });
      all.push(...conflicts);
    }
    return all;
  }

  async recommendations(
    actorUserId: string,
    occurrenceId: string,
    assignmentType: string,
  ) {
    await this.assertView(actorUserId);
    return this.rotation.recommend(
      occurrenceId,
      assignmentType as never,
    );
  }

  async createAssignment(
    actorUserId: string,
    occurrenceId: string,
    dto: {
      assignmentType: string;
      operationalUnitId?: string;
      memberId?: string;
      notes?: string;
      override?: boolean;
    },
  ) {
    const actor = await this.actor(actorUserId);
    if (!hasOperationsAssignmentManage(actor.permissions)) {
      throw new ForbiddenException('Assignment management denied');
    }

    let unitId = dto.operationalUnitId;
    if (!unitId) {
      const code = ASSIGNMENT_TYPE_UNIT_CODES[dto.assignmentType as keyof typeof ASSIGNMENT_TYPE_UNIT_CODES];
      if (!code) throw new BadRequestException('operationalUnitId required for CUSTOM');
      const unit = await this.prisma.operationalUnit.findFirst({
        where: { code, isActive: true },
      });
      if (!unit) throw new NotFoundException(`Unit ${code} not found`);
      unitId = unit.id;
    }

    const conflicts = await this.rules.validateAssignment({
      occurrenceId,
      operationalUnitId: unitId,
      assignmentType: dto.assignmentType as never,
      override: dto.override && hasOperationsOverride(actor.permissions),
    });
    this.rules.assertNoConflicts(
      conflicts,
      dto.override && hasOperationsOverride(actor.permissions),
    );

    const assignment = await this.prisma.operationAssignment.create({
      data: {
        occurrenceId,
        assignmentType: dto.assignmentType as never,
        operationalUnitId: unitId,
        memberId: dto.memberId,
        notes: dto.notes,
        overrideReason: dto.override ? 'Leader override' : null,
        overrideByUserId: dto.override ? actorUserId : null,
      },
      include: { operationalUnit: true, occurrence: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: dto.override
        ? OPERATIONS_AUDIT.ASSIGNMENT_OVERRIDE
        : OPERATIONS_AUDIT.ASSIGNMENT_CREATED,
      entity: OPERATIONS_AUDIT_ENTITY,
      entityId: occurrenceId,
      newValue: { assignmentId: assignment.id },
    });

    await this.opNotifications.notifyAssignmentCreated(assignment.id);
    return assignment;
  }

  async updateAssignmentStatus(
    actorUserId: string,
    assignmentId: string,
    status: OperationAssignmentStatus,
    notes?: string,
  ) {
    const actor = await this.actor(actorUserId);
    const assignment = await this.prisma.operationAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: { occurrence: true },
    });

    if (
      (status === 'CONFIRMED' || status === 'DECLINED') &&
      !hasOperationsAssignmentConfirm(actor.permissions)
    ) {
      throw new ForbiddenException('Confirmation denied');
    }

    const updated = await this.prisma.operationAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        notes: notes ?? assignment.notes,
        confirmedAt: status === 'CONFIRMED' ? new Date() : assignment.confirmedAt,
        declinedAt: status === 'DECLINED' ? new Date() : assignment.declinedAt,
      },
      include: { operationalUnit: true, occurrence: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONS_AUDIT.ASSIGNMENT_STATUS,
      entity: OPERATIONS_AUDIT_ENTITY,
      entityId: assignment.occurrenceId,
      newValue: { assignmentId, status },
    });

    if (status === 'CONFIRMED') {
      await this.opNotifications.notifyAssignmentStatus(
        assignmentId,
        'ASSIGNMENT_CONFIRMED',
      );
    }
    if (status === 'DECLINED') {
      await this.opNotifications.notifyAssignmentStatus(
        assignmentId,
        'ASSIGNMENT_DECLINED',
      );
    }

    return updated;
  }

  async myAssignments(actorUserId: string) {
    const actor = await this.actor(actorUserId);
    if (!actor.memberId) return [];
    const leadership = await this.prisma.operationalUnitLeadershipAssignment.findMany({
      where: { memberId: actor.memberId, endedAt: null },
      select: { operationalUnitId: true },
    });
    const unitIds = leadership.map((l) => l.operationalUnitId);
    return this.prisma.operationAssignment.findMany({
      where: { operationalUnitId: { in: unitIds } },
      include: { occurrence: { include: { template: true } }, operationalUnit: true },
      orderBy: { occurrence: { startAt: 'asc' } },
    });
  }

  async calendar(actorUserId: string, from: Date, to: Date) {
    const occurrences = await this.listOccurrences(actorUserId, { from, to });
    const choirActivities = this.choirCalendar
      ? await this.choirCalendar
          .listForRange(actorUserId, from, to)
          .catch(() => [])
      : [];
    return { occurrences, choirActivities };
  }

  private async missingRequirements(occurrenceId: string) {
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { requirements: true, assignments: true },
    });
    const missing: Array<{ assignmentType: string; required: number; assigned: number }> = [];
    for (const req of occurrence.requirements) {
      if (!req.required) continue;
      const assigned = occurrence.assignments.filter(
        (a) => a.assignmentType === req.assignmentType,
      ).length;
      if (assigned < req.quantity) {
        missing.push({
          assignmentType: req.assignmentType,
          required: req.quantity,
          assigned,
        });
      }
    }
    return missing;
  }

  private async assertView(actorUserId: string) {
    const actor = await this.actor(actorUserId);
    if (!hasOperationsView(actor.permissions)) {
      throw new ForbiddenException('Operations access denied');
    }
  }
}
