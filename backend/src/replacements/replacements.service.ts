import { Injectable, NotFoundException } from '@nestjs/common';
import { ReplacementKind, ReplacementStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictDetectionService } from '../assignments/conflict-detection.service';
import { AuditService } from '../audit/audit.service';
import { CreateReplacementDto } from './dto/create-replacement.dto';
import { BusinessRuleException } from '../common/exceptions/business.exception';

@Injectable()
export class ReplacementsService {
  constructor(
    private prisma: PrismaService,
    private conflict: ConflictDetectionService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateReplacementDto, userId: string) {
    if (dto.coverMemberId) {
      await this.conflict.validateAssignment({
        eventId: dto.eventId,
        memberId: dto.coverMemberId,
      });
    }

    const replacement = await this.prisma.replacement.create({
      data: {
        eventId: dto.eventId,
        absentMemberId: dto.absentMemberId,
        coverMemberId: dto.coverMemberId,
        selfFound: dto.selfFound ?? false,
        kind: dto.kind ?? (dto.selfFound ? ReplacementKind.VOLUNTARY : ReplacementKind.LEADER_ASSIGNED),
        countsOfficialQuota:
          (dto.kind ?? (dto.selfFound ? ReplacementKind.VOLUNTARY : ReplacementKind.LEADER_ASSIGNED)) ===
          ReplacementKind.LEADER_ASSIGNED,
        voluntaryExtraService:
          (dto.kind ?? (dto.selfFound ? ReplacementKind.VOLUNTARY : ReplacementKind.LEADER_ASSIGNED)) ===
          ReplacementKind.VOLUNTARY,
        notes: dto.notes,
        status: dto.coverMemberId
          ? ReplacementStatus.LEADER_PENDING
          : ReplacementStatus.REQUESTED,
      },
    });

    await this.audit.log({
      userId,
      action: 'REPLACEMENT_CREATE',
      entity: 'Replacement',
      entityId: replacement.id,
      newValue: replacement,
    });

    return replacement;
  }

  async approve(id: string, userId: string) {
    const replacement = await this.getOrThrow(id);
    if (replacement.status !== ReplacementStatus.LEADER_PENDING) {
      throw new BusinessRuleException('Replacement is not pending approval');
    }

    const updated = await this.prisma.replacement.update({
      where: { id },
      data: {
        status: ReplacementStatus.APPROVED,
        approvedById: userId,
      },
    });

    await this.audit.log({
      userId,
      action: 'REPLACEMENT_APPROVED',
      entity: 'Replacement',
      entityId: id,
      newValue: updated,
    });

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
          operationalStatus: 'REPLACEMENT_SERVED',
          notes: 'Auto-marked from finalized replacement flow',
        },
        update: {
          operationalStatus: 'REPLACEMENT_SERVED',
        },
      });

      await tx.replacement.update({
        where: { id },
        data: {
          status: ReplacementStatus.FINALIZED,
          finalizedAt: new Date(),
        },
      });
    });

    const finalized = await this.prisma.replacement.findUniqueOrThrow({
      where: { id },
    });

    await this.audit.log({
      userId,
      action: 'REPLACEMENT_FINALIZED',
      entity: 'Replacement',
      entityId: id,
      newValue: finalized,
    });

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

  private async getOrThrow(id: string) {
    const r = await this.prisma.replacement.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Replacement not found');
    return r;
  }
}
