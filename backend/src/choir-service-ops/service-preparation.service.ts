import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PepTalkTiming,
  ServicePreparationItemType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { hasChoirOpsManage, hasChoirOpsView } from '../choir-scheduling/choir-scheduling-access.util';

@Injectable()
export class ServicePreparationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertView(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasChoirOpsView(resolved.permissions)) {
      throw new ForbiddenException('Service preparation access denied');
    }
    return resolved;
  }

  private async assertManage(userId: string) {
    const resolved = await this.assertView(userId);
    if (!hasChoirOpsManage(resolved.permissions)) {
      throw new ForbiddenException('Service preparation management denied');
    }
    return resolved;
  }

  private async assertActiveMember(userId: string, choirId: string) {
    const membership = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId, choirId } },
    });
    if (!membership?.isActive) {
      throw new ForbiddenException('Active choir membership required');
    }
    return membership;
  }

  private async loadPlan(choirId: string, occurrenceId: string) {
    const plan = await this.prisma.servicePreparationPlan.findUnique({
      where: { choirId_occurrenceId: { choirId, occurrenceId } },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
          include: { song: { select: { id: true, title: true } } },
        },
        occurrence: {
          select: { id: true, title: true, startAt: true, endAt: true },
        },
      },
    });
    if (!plan) {
      const occurrence = await this.prisma.operationOccurrence.findUnique({
        where: { id: occurrenceId },
        select: { id: true, title: true, startAt: true, endAt: true },
      });
      if (!occurrence) throw new NotFoundException('Occurrence not found');
      return {
        choirId,
        occurrenceId,
        occurrence,
        items: [],
        uniformNotes: null,
        pepTalkTitle: null,
        pepTalkAt: null,
        pepTalkTiming: null,
      };
    }
    return plan;
  }

  async getPlan(actorUserId: string, choirId: string, occurrenceId: string) {
    await this.assertView(actorUserId);
    return this.loadPlan(choirId, occurrenceId);
  }

  private async listAssignments(
    choirId: string,
    from?: Date,
    to?: Date,
    confirmedOnly = false,
  ) {
    const assignments = await this.prisma.choirServiceAssignment.findMany({
      where: {
        choirId,
        cancelledAt: null,
        ...(confirmedOnly ? { status: 'CONFIRMED' as const } : {}),
        occurrence: {
          startAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        },
      },
      include: {
        occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
      orderBy: { occurrence: { startAt: 'asc' } },
      take: 50,
    });

    const planIds = await this.prisma.servicePreparationPlan.findMany({
      where: { choirId, occurrenceId: { in: assignments.map((a) => a.occurrenceId) } },
      select: { occurrenceId: true, id: true, pepTalkTitle: true, uniformNotes: true },
    });
    const planByOcc = new Map(planIds.map((p) => [p.occurrenceId, p]));

    return assignments.map((a) => ({
      occurrenceId: a.occurrenceId,
      occurrence: a.occurrence,
      role: a.role,
      hasPlan: planByOcc.has(a.occurrenceId),
      planSummary: planByOcc.get(a.occurrenceId) ?? null,
    }));
  }

  async listForChoir(actorUserId: string, choirId: string, from?: Date, to?: Date) {
    await this.assertView(actorUserId);
    return this.listAssignments(choirId, from, to);
  }

  async listForMember(actorUserId: string, choirId: string, from?: Date, to?: Date) {
    await this.assertActiveMember(actorUserId, choirId);
    return this.listAssignments(choirId, from, to, true);
  }

  async getPlanForMember(actorUserId: string, choirId: string, occurrenceId: string) {
    await this.assertActiveMember(actorUserId, choirId);
    return this.loadPlan(choirId, occurrenceId);
  }

  async upsertPlan(
    actorUserId: string,
    dto: {
      choirId: string;
      occurrenceId: string;
      uniformNotes?: string;
      pepTalkTitle?: string;
      pepTalkAt?: string;
      pepTalkTiming?: PepTalkTiming;
      items?: Array<{
        id?: string;
        itemType: ServicePreparationItemType;
        title: string;
        body?: string;
        songId?: string;
        scheduledAt?: string;
        sortOrder?: number;
      }>;
    },
  ) {
    await this.assertManage(actorUserId);
    await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: dto.occurrenceId },
    });

    const plan = await this.prisma.$transaction(async (tx) => {
      const row = await tx.servicePreparationPlan.upsert({
        where: {
          choirId_occurrenceId: {
            choirId: dto.choirId,
            occurrenceId: dto.occurrenceId,
          },
        },
        create: {
          choirId: dto.choirId,
          occurrenceId: dto.occurrenceId,
          uniformNotes: dto.uniformNotes?.trim(),
          pepTalkTitle: dto.pepTalkTitle?.trim(),
          pepTalkAt: dto.pepTalkAt ? new Date(dto.pepTalkAt) : null,
          pepTalkTiming: dto.pepTalkTiming ?? null,
          createdByUserId: actorUserId,
        },
        update: {
          uniformNotes: dto.uniformNotes?.trim(),
          pepTalkTitle: dto.pepTalkTitle?.trim(),
          pepTalkAt: dto.pepTalkAt ? new Date(dto.pepTalkAt) : null,
          pepTalkTiming: dto.pepTalkTiming ?? null,
        },
      });

      if (dto.items) {
        await tx.servicePreparationItem.deleteMany({ where: { planId: row.id } });
        for (const [index, item] of dto.items.entries()) {
          await tx.servicePreparationItem.create({
            data: {
              planId: row.id,
              itemType: item.itemType,
              title: item.title.trim(),
              body: item.body?.trim(),
              songId: item.songId ?? null,
              scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
              sortOrder: item.sortOrder ?? index,
            },
          });
        }
      }

      return tx.servicePreparationPlan.findUniqueOrThrow({
        where: { id: row.id },
        include: {
          items: {
            orderBy: [{ sortOrder: 'asc' }],
            include: { song: { select: { id: true, title: true } } },
          },
          occurrence: { select: { title: true, startAt: true, endAt: true } },
        },
      });
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'SERVICE_PREPARATION_UPDATED',
      entity: 'ServicePreparationPlan',
      entityId: plan.id,
      newValue: { choirId: dto.choirId, occurrenceId: dto.occurrenceId },
    });
    return plan;
  }
}
