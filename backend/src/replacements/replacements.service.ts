import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CoverageApprovalLevel,
  ReplacementKind,
  ReplacementStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictDetectionService } from '../assignments/conflict-detection.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReplacementDto } from './dto/create-replacement.dto';
import { BusinessRuleException } from '../common/exceptions/business.exception';
import { deriveReplacementFlags } from '../coverage/coverage.constants';

@Injectable()
export class ReplacementsService {
  constructor(
    private prisma: PrismaService,
    private conflict: ConflictDetectionService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateReplacementDto, userId: string) {
    if (dto.coverMemberId) {
      await this.conflict.validateAssignment({
        eventId: dto.eventId,
        memberId: dto.coverMemberId,
      });
    }

    const kind =
      dto.kind ??
      (dto.selfFound ? ReplacementKind.VOLUNTARY : ReplacementKind.LEADER_ASSIGNED);
    const flags = deriveReplacementFlags(kind);

    const replacement = await this.prisma.replacement.create({
      data: {
        eventId: dto.eventId,
        absentMemberId: dto.absentMemberId,
        coverMemberId: dto.coverMemberId,
        selfFound: dto.selfFound ?? false,
        kind,
        reason: dto.reason,
        initiatedByUserId: userId,
        approvalLevel: CoverageApprovalLevel.TEAM_HEAD,
        countsOfficialQuota: flags.countsOfficialQuota,
        voluntaryExtraService: flags.voluntaryExtraService,
        operationalPriority: flags.operationalPriority,
        notes: dto.notes,
        status: dto.coverMemberId
          ? ReplacementStatus.LEADER_PENDING
          : ReplacementStatus.REQUESTED,
      },
      include: { absentMember: true, coverMember: true, event: true },
    });

    await this.audit.log({
      userId,
      action: 'REPLACEMENT_CREATE',
      entity: 'Replacement',
      entityId: replacement.id,
      newValue: replacement,
    });

    await this.notifications.notifyReplacement(replacement, 'requested');
    if (replacement.status === ReplacementStatus.LEADER_PENDING) {
      await this.notifications.notifyReplacementPendingLeader(replacement);
    }

    return replacement;
  }

  async assignCover(id: string, coverMemberId: string, userId: string) {
    const replacement = await this.getOrThrow(id);
    await this.conflict.validateAssignment({
      eventId: replacement.eventId,
      memberId: coverMemberId,
    });

    const updated = await this.prisma.replacement.update({
      where: { id },
      data: {
        coverMemberId,
        status: ReplacementStatus.LEADER_PENDING,
        selfFound: true,
        kind: ReplacementKind.VOLUNTARY,
        countsOfficialQuota: false,
        voluntaryExtraService: true,
      },
      include: { absentMember: true, coverMember: true, event: true },
    });

    await this.audit.log({
      userId,
      action: 'REPLACEMENT_COVER_ASSIGNED',
      entity: 'Replacement',
      entityId: id,
      newValue: updated,
    });

    await this.notifications.notifyReplacement(updated, 'cover_assigned');
    return updated;
  }

  async approve(id: string, userId: string, notes?: string) {
    const replacement = await this.getOrThrow(id);
    if (replacement.status !== ReplacementStatus.LEADER_PENDING) {
      throw new BusinessRuleException('Replacement is not pending approval');
    }

    const updated = await this.prisma.replacement.update({
      where: { id },
      data: {
        status: ReplacementStatus.APPROVED,
        approvedById: userId,
        notes: notes ?? replacement.notes,
        approvalLevel: CoverageApprovalLevel.TEAM_HEAD,
      },
      include: { absentMember: true, coverMember: true, event: true },
    });

    await this.audit.log({
      userId,
      action: 'REPLACEMENT_APPROVED',
      entity: 'Replacement',
      entityId: id,
      newValue: updated,
    });

    await this.notifications.notifyReplacement(updated, 'approved');
    return updated;
  }

  async reject(id: string, userId: string, notes?: string) {
    const replacement = await this.getOrThrow(id);
    if (
      replacement.status !== ReplacementStatus.LEADER_PENDING &&
      replacement.status !== ReplacementStatus.REQUESTED
    ) {
      throw new BusinessRuleException('Replacement cannot be rejected');
    }

    const updated = await this.prisma.replacement.update({
      where: { id },
      data: {
        status: ReplacementStatus.REJECTED,
        resolutionNotes: notes,
        resolvedAt: new Date(),
      },
      include: { absentMember: true, coverMember: true, event: true },
    });

    await this.audit.log({
      userId,
      action: 'REPLACEMENT_REJECTED',
      entity: 'Replacement',
      entityId: id,
      newValue: updated,
    });

    await this.notifications.notifyReplacement(updated, 'rejected');
    return updated;
  }

  async finalize(id: string, userId: string) {
    const replacement = await this.getOrThrow(id);
    if (replacement.status !== ReplacementStatus.APPROVED) {
      throw new BusinessRuleException('Replacement must be approved first');
    }
    if (!replacement.coverMemberId) {
      throw new BusinessRuleException('Cover member must be assigned');
    }

    await this.prisma.$transaction(async (tx) => {
      const absentAssignment = await tx.eventAssignment.findUnique({
        where: {
          eventId_memberId: {
            eventId: replacement.eventId,
            memberId: replacement.absentMemberId,
          },
        },
      });

      if (absentAssignment) {
        await tx.eventAssignment.delete({ where: { id: absentAssignment.id } });
      }

      await tx.eventAssignment.create({
        data: {
          eventId: replacement.eventId,
          memberId: replacement.coverMemberId!,
          countsOfficialQuota: replacement.countsOfficialQuota,
          voluntaryExtraService: replacement.voluntaryExtraService,
        },
      });

      const operationalStatus = replacement.voluntaryExtraService
        ? 'VOLUNTARY_EXTRA_SERVICE'
        : 'REPLACEMENT_SERVED';

      await tx.attendance.upsert({
        where: {
          eventId_memberId: {
            eventId: replacement.eventId,
            memberId: replacement.coverMemberId!,
          },
        },
        create: {
          eventId: replacement.eventId,
          memberId: replacement.coverMemberId!,
          physicalStatus: 'PRESENT',
          operationalStatus,
          replacementId: replacement.id,
          countsAsOfficial: replacement.countsOfficialQuota,
          voluntaryExtra: replacement.voluntaryExtraService,
          notes: 'Auto-marked from finalized replacement flow',
        },
        update: {
          operationalStatus,
          replacementId: replacement.id,
          countsAsOfficial: replacement.countsOfficialQuota,
          voluntaryExtra: replacement.voluntaryExtraService,
        },
      });

      await tx.replacement.update({
        where: { id },
        data: {
          status: ReplacementStatus.FINALIZED,
          finalizedAt: new Date(),
          resolvedAt: new Date(),
        },
      });
    });

    const finalized = await this.prisma.replacement.findUniqueOrThrow({
      where: { id },
      include: { absentMember: true, coverMember: true, event: true },
    });

    await this.audit.log({
      userId,
      action: 'REPLACEMENT_FINALIZED',
      entity: 'Replacement',
      entityId: id,
      newValue: finalized,
    });

    await this.notifications.notifyReplacement(finalized, 'finalized');
    return finalized;
  }

  async findAll(page = 1, limit = 20, memberId?: string) {
    const skip = (page - 1) * limit;
    const where = memberId
      ? {
          OR: [{ absentMemberId: memberId }, { coverMemberId: memberId }],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.replacement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { absentMember: true, coverMember: true, event: true },
      }),
      this.prisma.replacement.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const r = await this.prisma.replacement.findUnique({
      where: { id },
      include: { absentMember: true, coverMember: true, event: true },
    });
    if (!r) throw new NotFoundException('Replacement not found');
    return r;
  }

  private async getOrThrow(id: string) {
    const r = await this.prisma.replacement.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Replacement not found');
    return r;
  }
}
