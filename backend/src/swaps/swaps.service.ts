import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SwapStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictDetectionService } from '../assignments/conflict-detection.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSwapDto } from './dto/create-swap.dto';
import { BusinessRuleException } from '../common/exceptions/business.exception';

@Injectable()
export class SwapsService {
  constructor(
    private prisma: PrismaService,
    private conflict: ConflictDetectionService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async request(dto: CreateSwapDto, requesterMemberId: string, userId: string) {
    await this.conflict.validateSwap(dto.eventId, requesterMemberId, dto.targetId);

    const swap = await this.prisma.swap.create({
      data: {
        eventId: dto.eventId,
        requesterId: requesterMemberId,
        targetId: dto.targetId,
        status: SwapStatus.REQUESTED,
      },
      include: { requester: true, target: true, event: true },
    });

    await this.audit.log({
      userId,
      action: 'SWAP_REQUEST',
      entity: 'Swap',
      entityId: swap.id,
      newValue: swap,
    });

    await this.notifications.notifySwap(swap, 'requested');
    return swap;
  }

  async respond(
    swapId: string,
    accept: boolean,
    targetMemberId: string,
    userId: string,
  ) {
    const swap = await this.getSwapOrThrow(swapId);
    if (swap.targetId !== targetMemberId) {
      throw new ForbiddenException('Only the target member can respond');
    }
    if (swap.status !== SwapStatus.REQUESTED) {
      throw new BusinessRuleException('Swap is not awaiting target response');
    }

    const status = accept
      ? SwapStatus.LEADER_PENDING
      : SwapStatus.TARGET_REJECTED;

    const updated = await this.prisma.swap.update({
      where: { id: swapId },
      data: { status },
    });

    await this.audit.log({
      userId,
      action: accept ? 'SWAP_TARGET_ACCEPTED' : 'SWAP_TARGET_REJECTED',
      entity: 'Swap',
      entityId: swapId,
      oldValue: swap,
      newValue: updated,
    });

    await this.notifications.notifySwap(updated, accept ? 'accepted' : 'rejected');
    return updated;
  }

  async leaderApprove(swapId: string, userId: string, notes?: string) {
    const swap = await this.getSwapOrThrow(swapId);
    if (swap.status !== SwapStatus.LEADER_PENDING) {
      throw new BusinessRuleException('Swap is not pending leader approval');
    }

    const updated = await this.prisma.swap.update({
      where: { id: swapId },
      data: {
        status: SwapStatus.APPROVED,
        leaderApprovedById: userId,
        leaderNotes: notes,
      },
    });

    await this.audit.log({
      userId,
      action: 'SWAP_LEADER_APPROVED',
      entity: 'Swap',
      entityId: swapId,
      newValue: updated,
    });

    await this.notifications.notifySwap(updated, 'approved');

    return updated;
  }

  async finalize(swapId: string, userId: string) {
    const swap = await this.getSwapOrThrow(swapId);
    if (swap.status !== SwapStatus.APPROVED) {
      throw new BusinessRuleException('Swap must be approved before finalization');
    }

    await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.eventAssignment.findUnique({
        where: {
          eventId_memberId: {
            eventId: swap.eventId,
            memberId: swap.requesterId,
          },
        },
      });

      if (assignment) {
        await tx.eventAssignment.delete({ where: { id: assignment.id } });
        await tx.eventAssignment.create({
          data: {
            eventId: swap.eventId,
            memberId: swap.targetId,
            role: assignment.role,
          },
        });
      }

      await tx.swap.update({
        where: { id: swapId },
        data: { status: SwapStatus.FINALIZED, finalizedAt: new Date() },
      });
    });

    const finalized = await this.prisma.swap.findUniqueOrThrow({
      where: { id: swapId },
    });

    await this.audit.log({
      userId,
      action: 'SWAP_FINALIZED',
      entity: 'Swap',
      entityId: swapId,
      newValue: finalized,
    });

    await this.notifications.notifySwap(finalized, 'finalized');
    return finalized;
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: { status?: SwapStatus; memberId?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: {
      status?: SwapStatus;
      OR?: Array<{ requesterId: string } | { targetId: string }>;
    } = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.memberId) {
      where.OR = [
        { requesterId: filters.memberId },
        { targetId: filters.memberId },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.swap.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: true,
          target: true,
          event: true,
        },
      }),
      this.prisma.swap.count({ where }),
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

  private async getSwapOrThrow(id: string) {
    const swap = await this.prisma.swap.findUnique({ where: { id } });
    if (!swap) throw new NotFoundException('Swap not found');
    return swap;
  }
}
