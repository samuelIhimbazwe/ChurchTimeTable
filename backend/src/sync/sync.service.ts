import { Injectable } from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { EventsService } from '../events/events.service';
import { ReplacementsService } from '../replacements/replacements.service';
import { SyncBatchDto } from './dto/sync-batch.dto';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
    private assignmentsService: AssignmentsService,
    private eventsService: EventsService,
    private replacementsService: ReplacementsService,
  ) {}

  async processBatch(userId: string, dto: SyncBatchDto) {
    const results: Array<{
      entity: string;
      entityId: string;
      status: 'applied' | 'rejected';
      reason?: string;
    }> = [];

    for (const item of dto.items) {
      try {
        await this.applyItem(userId, item);
        results.push({
          entity: item.entity,
          entityId: item.entityId,
          status: 'applied',
        });
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : 'Sync rejected';
        await this.prisma.syncConflict.create({
          data: {
            userId,
            entity: item.entity,
            entityId: item.entityId,
            clientPayload: item.payload as Prisma.InputJsonValue,
            reason,
          },
        });
        results.push({
          entity: item.entity,
          entityId: item.entityId,
          status: 'rejected',
          reason,
        });
      }
    }

    return { results };
  }

  private async assertLastWriteWins(
    serverTime: Date | null | undefined,
    clientTime: Date,
  ) {
    if (serverTime && serverTime > clientTime) {
      throw new Error('Server has newer data (last-write-wins)');
    }
  }

  private async applyItem(
    userId: string,
    item: SyncBatchDto['items'][number],
  ) {
    const clientTime = new Date(item.clientUpdatedAt);

    if (item.entity === 'Attendance') {
      const payload = item.payload as {
        eventId: string;
        memberId: string;
        physicalStatus: 'PRESENT' | 'ABSENT' | 'LATE';
        reasonCategory?: 'EXCUSED' | 'UNEXCUSED';
        reasonType?: string;
        notes?: string;
      };

      const existing = await this.prisma.attendance.findUnique({
        where: {
          eventId_memberId: {
            eventId: payload.eventId,
            memberId: payload.memberId,
          },
        },
      });

      if (existing) {
        if (this.attendanceService.isLocked(existing)) {
          throw new Error('Attendance locked server-side');
        }
        await this.assertLastWriteWins(existing.clientUpdatedAt, clientTime);
      }

      await this.attendanceService.upsert(
        { ...payload, clientUpdatedAt: item.clientUpdatedAt },
        userId,
      );
      return;
    }

    if (item.entity === 'Member') {
      const existing = await this.prisma.member.findUnique({
        where: { id: item.entityId },
      });
      await this.assertLastWriteWins(existing?.clientUpdatedAt, clientTime);
      await this.prisma.member.update({
        where: { id: item.entityId },
        data: {
          ...(item.payload as object),
          clientUpdatedAt: clientTime,
        },
      });
      return;
    }

    if (item.entity === 'Event') {
      const payload = item.payload as {
        title: string;
        type: string;
        startTime: string;
        endTime: string;
        location?: string;
        ministryScope: string;
        status?: EventStatus;
        serviceSlot?: number;
      };

      const existing = await this.prisma.event.findUnique({
        where: { id: item.entityId },
      });

      if (existing) {
        await this.assertLastWriteWins(existing.updatedAt, clientTime);
        await this.eventsService.update(
          item.entityId,
          {
            title: payload.title,
            type: payload.type as never,
            startTime: payload.startTime,
            endTime: payload.endTime,
            location: payload.location,
            ministryScope: payload.ministryScope as never,
            status: payload.status,
            serviceSlot: payload.serviceSlot,
          },
          userId,
        );
      } else {
        await this.eventsService.create(
          {
            title: payload.title,
            type: payload.type as never,
            startTime: payload.startTime,
            endTime: payload.endTime,
            location: payload.location,
            ministryScope: payload.ministryScope as never,
            status: payload.status,
            serviceSlot: payload.serviceSlot,
          },
          userId,
        );
      }
      return;
    }

    if (item.entity === 'EventAssignment') {
      const payload = item.payload as {
        eventId: string;
        memberId: string;
        role?: string;
        isOverride?: boolean;
        overrideReason?: string;
      };
      await this.assignmentsService.assign(
        {
          eventId: payload.eventId,
          memberId: payload.memberId,
          role: payload.role,
          isOverride: payload.isOverride,
          overrideReason: payload.overrideReason,
        },
        userId,
      );
      return;
    }

    if (item.entity === 'Swap') {
      const payload = item.payload as {
        eventId: string;
        requesterId: string;
        targetId: string;
      };
      const existing = await this.prisma.swap.findFirst({
        where: {
          eventId: payload.eventId,
          requesterId: payload.requesterId,
          targetId: payload.targetId,
          status: { notIn: ['CANCELLED', 'TARGET_REJECTED'] },
        },
      });
      if (existing) throw new Error('Duplicate swap request');
      await this.prisma.swap.create({
        data: {
          eventId: payload.eventId,
          requesterId: payload.requesterId,
          targetId: payload.targetId,
          status: 'REQUESTED',
        },
      });
      return;
    }

    if (item.entity === 'Replacement') {
      const payload = item.payload as {
        eventId: string;
        absentMemberId: string;
        coverMemberId?: string;
        selfFound?: boolean;
        notes?: string;
      };
      await this.replacementsService.create(payload, userId);
      return;
    }

    if (item.entity === 'DisciplineCase') {
      const payload = item.payload as {
        memberId: string;
        ministry: string;
        title: string;
        description: string;
        reporterId?: string;
      };
      await this.prisma.disciplineCase.create({
        data: {
          memberId: payload.memberId,
          ministry: payload.ministry as never,
          title: payload.title,
          description: payload.description,
          reporterId: payload.reporterId,
          stage: 'REPORTED',
        },
      });
      return;
    }

    if (item.entity === 'FinanceTransaction') {
      const payload = item.payload as {
        type: 'INCOME' | 'EXPENSE';
        category: string;
        amount: number;
        description?: string;
        memberId?: string;
        transactionDate?: string;
      };
      await this.prisma.financeTransaction.create({
        data: {
          type: payload.type,
          category: payload.category as never,
          amount: payload.amount,
          description: payload.description,
          memberId: payload.memberId,
          recordedById: userId,
          transactionDate: payload.transactionDate
            ? new Date(payload.transactionDate)
            : new Date(),
        },
      });
      return;
    }

    throw new Error(`Unsupported sync entity: ${item.entity}`);
  }

  async getConflicts(userId: string) {
    return this.prisma.syncConflict.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
