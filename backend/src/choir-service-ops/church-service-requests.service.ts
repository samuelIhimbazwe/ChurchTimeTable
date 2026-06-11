import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChurchServiceRequestStatus,
  ChoirServiceAssignmentRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { ChoirServiceAssignmentsService } from '../choir-scheduling/choir-service-assignments.service';

@Injectable()
export class ChurchServiceRequestsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private assignments: ChoirServiceAssignmentsService,
  ) {}

  private async assertChurchView(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    const allowed =
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_GOVERNANCE_VIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_GOVERNANCE_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.OPERATIONS_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.OPERATIONS_VIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OVERSIGHT) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPS_SCHEDULE);
    if (!allowed) throw new ForbiddenException('Church service request access denied');
    return resolved;
  }

  private async assertChurchManage(userId: string) {
    const resolved = await this.assertChurchView(userId);
    const canWrite =
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_GOVERNANCE_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.OPERATIONS_MANAGE);
    if (!canWrite) throw new ForbiddenException('Church service request management denied');
    return resolved;
  }

  private async assertChoirReview(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    const allowed =
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPS_SCHEDULE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPS_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_GOVERNANCE_MANAGE);
    if (!allowed) throw new ForbiddenException('Review access denied');
    return resolved;
  }

  async list(actorUserId: string, filters?: { status?: ChurchServiceRequestStatus; choirId?: string }) {
    await this.assertChurchView(actorUserId);
    return this.prisma.churchServiceRequest.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.choirId
          ? {
              OR: [
                { assignedChoirId: filters.choirId },
                { preferredChoirId: filters.choirId },
              ],
            }
          : {}),
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        occurrence: {
          select: { id: true, title: true, startAt: true, endAt: true, status: true },
        },
        preferredChoir: { select: { id: true, name: true, code: true } },
        assignedChoir: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async create(
    actorUserId: string,
    dto: {
      occurrenceId: string;
      preferredChoirId?: string;
      role?: ChoirServiceAssignmentRole;
      title?: string;
      notes?: string;
    },
  ) {
    await this.assertChurchManage(actorUserId);
    const occurrence = await this.prisma.operationOccurrence.findUnique({
      where: { id: dto.occurrenceId },
    });
    if (!occurrence) throw new NotFoundException('Service occurrence not found');

    const row = await this.prisma.churchServiceRequest.create({
      data: {
        occurrenceId: dto.occurrenceId,
        preferredChoirId: dto.preferredChoirId ?? null,
        role: dto.role ?? 'PRIMARY',
        title: dto.title?.trim() ?? occurrence.title,
        notes: dto.notes?.trim(),
        requestedByUserId: actorUserId,
      },
      include: {
        occurrence: { select: { title: true, startAt: true } },
        preferredChoir: { select: { name: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHURCH_SERVICE_REQUEST_CREATED',
      entity: 'ChurchServiceRequest',
      entityId: row.id,
      newValue: { occurrenceId: dto.occurrenceId },
    });
    return row;
  }

  async review(
    actorUserId: string,
    id: string,
    dto: {
      status: 'APPROVED' | 'REJECTED';
      assignedChoirId?: string;
      reviewNotes?: string;
    },
  ) {
    await this.assertChoirReview(actorUserId);
    const existing = await this.prisma.churchServiceRequest.findUnique({
      where: { id },
      include: { occurrence: true },
    });
    if (!existing) throw new NotFoundException('Request not found');
    if (existing.status !== ChurchServiceRequestStatus.PENDING) {
      throw new BadRequestException('Request already reviewed');
    }

    const choirId = dto.assignedChoirId ?? existing.preferredChoirId;
    if (dto.status === 'APPROVED' && !choirId) {
      throw new BadRequestException('assignedChoirId is required to approve');
    }

    const row = await this.prisma.churchServiceRequest.update({
      where: { id },
      data: {
        status:
          dto.status === 'APPROVED'
            ? ChurchServiceRequestStatus.APPROVED
            : ChurchServiceRequestStatus.REJECTED,
        assignedChoirId: dto.status === 'APPROVED' ? choirId : null,
        reviewedByUserId: actorUserId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes?.trim(),
      },
      include: {
        occurrence: { select: { title: true, startAt: true } },
        assignedChoir: { select: { id: true, name: true } },
      },
    });

    if (dto.status === 'APPROVED' && choirId) {
      const isChurch = await this.assignments.isChurchScheduler(actorUserId);
      if (isChurch) {
        await this.assignments.churchDirectAssign(actorUserId, {
          choirId,
          occurrenceId: existing.occurrenceId,
          role: existing.role,
          overrideReason: `Church service request ${id}`,
        });
      }
    }

    await this.audit.log({
      userId: actorUserId,
      action: `CHURCH_SERVICE_REQUEST_${dto.status}`,
      entity: 'ChurchServiceRequest',
      entityId: id,
      newValue: { assignedChoirId: choirId, status: dto.status },
    });
    return row;
  }
}
