import { Injectable } from '@nestjs/common';
import {
  Event,
  EventType,
  Member,
  MinistryScope,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '../common/exceptions/business.exception';

export interface AssignmentContext {
  eventId: string;
  memberId: string;
  isOverride?: boolean;
  overrideReason?: string;
}

const PROTOCOL_MEMBERS_PER_SERVICE = 12;
const PROTOCOL_MAX_SERVICES_PER_MONTH = 3;

@Injectable()
export class ConflictDetectionService {
  constructor(private prisma: PrismaService) {}

  async validateAssignment(ctx: AssignmentContext): Promise<void> {
    const [event, member] = await Promise.all([
      this.prisma.event.findUniqueOrThrow({ where: { id: ctx.eventId } }),
      this.prisma.member.findUniqueOrThrow({ where: { id: ctx.memberId } }),
    ]);

    this.validateMinistryCompatibility(event, member);
    await this.validateNoTimeOverlap(event, ctx.memberId, ctx.eventId);
    await this.validateNotDoubleBooked(ctx.eventId, ctx.memberId);

    if (event.type === EventType.PROTOCOL_SERVICE) {
      await this.validateProtocolRules(event, member, ctx);
    }

    if (
      event.type === EventType.CHOIR_SERVICE ||
      event.type === EventType.REHEARSAL
    ) {
      await this.validateChoirRules(event, member, ctx);
    }
  }

  private validateMinistryCompatibility(event: Event, member: Member) {
    if (event.ministryScope === MinistryScope.BOTH) return;
    if (event.ministryScope === member.ministry) return;
    if (member.ministry === MinistryScope.BOTH) return;

    throw new ConflictException('MINISTRY_CONFLICT', {
      memberMinistry: member.ministry,
      eventScope: event.ministryScope,
    });
  }

  private async validateNoTimeOverlap(
    event: Event,
    memberId: string,
    excludeEventId: string,
  ) {
    const overlapping = await this.prisma.eventAssignment.findFirst({
      where: {
        memberId,
        eventId: { not: excludeEventId },
        event: {
          status: { not: 'CANCELLED' },
          startTime: { lt: event.endTime },
          endTime: { gt: event.startTime },
        },
      },
      include: { event: true },
    });

    if (overlapping) {
      throw new ConflictException('SCHEDULE_OVERLAP', {
        conflictingEventId: overlapping.eventId,
        conflictingTitle: overlapping.event.title,
      });
    }
  }

  private async validateNotDoubleBooked(eventId: string, memberId: string) {
    const existing = await this.prisma.eventAssignment.findUnique({
      where: { eventId_memberId: { eventId, memberId } },
    });
    if (existing) {
      throw new ConflictException('DOUBLE_BOOKING');
    }
  }

  private async validateProtocolRules(
    event: Event,
    member: Member,
    ctx: AssignmentContext,
  ) {
    const count = await this.prisma.eventAssignment.count({
      where: { eventId: event.id },
    });
    if (count >= PROTOCOL_MEMBERS_PER_SERVICE && !ctx.isOverride) {
      throw new ConflictException('PROTOCOL_QUOTA_FULL', {
        currentCount: count,
        max: PROTOCOL_MEMBERS_PER_SERVICE,
      });
    }

    const monthStart = new Date(
      event.startTime.getFullYear(),
      event.startTime.getMonth(),
      1,
    );
    const monthEnd = new Date(
      event.startTime.getFullYear(),
      event.startTime.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const monthlyCount = await this.prisma.eventAssignment.count({
      where: {
        memberId: member.id,
        event: {
          type: EventType.PROTOCOL_SERVICE,
          startTime: { gte: monthStart, lte: monthEnd },
        },
      },
    });

    if (monthlyCount >= PROTOCOL_MAX_SERVICES_PER_MONTH && !ctx.isOverride) {
      throw new ConflictException('PROTOCOL_MONTHLY_LIMIT', {
        monthlyCount,
        max: PROTOCOL_MAX_SERVICES_PER_MONTH,
      });
    }
  }

  private async validateChoirRules(
    event: Event,
    member: Member,
    ctx: AssignmentContext,
  ) {
    if (event.serviceSlot === 1 && !member.isChildrenChoir && !ctx.isOverride) {
      throw new ConflictException('CHILDREN_CHOIR_SERVICE1', { serviceSlot: 1 });
    }
  }

  async validateSwap(
    eventId: string,
    requesterId: string,
    targetId: string,
  ): Promise<void> {
    const [requesterAssignment, targetAssignment] = await Promise.all([
      this.prisma.eventAssignment.findUnique({
        where: { eventId_memberId: { eventId, memberId: requesterId } },
      }),
      this.prisma.eventAssignment.findUnique({
        where: { eventId_memberId: { eventId, memberId: targetId } },
      }),
    ]);

    if (!requesterAssignment) {
      throw new ConflictException('SWAP_NOT_ALLOWED');
    }
    if (targetAssignment) {
      throw new ConflictException('DOUBLE_BOOKING');
    }

    await this.validateAssignment({ eventId, memberId: targetId });
  }
}
