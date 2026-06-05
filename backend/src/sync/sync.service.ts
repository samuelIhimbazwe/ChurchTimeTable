import { Injectable } from '@nestjs/common';
import { ContributionStatus, ContributionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncBatchDto } from './dto/sync-batch.dto';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

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

    if (item.entity === 'Member') {
      const existing = await this.prisma.member.findUnique({
        where: { id: item.entityId },
      });
      await this.assertLastWriteWins(existing?.clientUpdatedAt, clientTime);
      const payload = { ...(item.payload as Record<string, unknown>) };
      delete payload.memberNumber;
      await this.prisma.member.update({
        where: { id: item.entityId },
        data: {
          ...payload,
          clientUpdatedAt: clientTime,
        },
      });
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

    if (item.entity === 'ContributionRecord') {
      const payload = item.payload as {
        memberId: string;
        contributionType: ContributionType;
        amount: number;
        currency?: string;
        notes?: string;
        receiptUrl?: string;
        memberDueId?: string;
        referenceNumber?: string;
        status?: ContributionStatus;
      };

      const actorMember = await this.prisma.member.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!actorMember || actorMember.id !== payload.memberId) {
        throw new Error('Contribution sync limited to own member profile');
      }

      if (
        payload.status &&
        payload.status !== ContributionStatus.PENDING &&
        payload.status !== ContributionStatus.SUBMITTED
      ) {
        throw new Error('Contribution status is server-authoritative');
      }

      const existing = await this.prisma.contributionRecord.findUnique({
        where: { id: item.entityId },
      });
      if (existing) {
        await this.assertLastWriteWins(existing.updatedAt, clientTime);
        if (
          existing.status === ContributionStatus.CONFIRMED ||
          existing.status === ContributionStatus.REJECTED
        ) {
          throw new Error('Confirmed contributions cannot be changed via sync');
        }
        await this.prisma.contributionRecord.update({
          where: { id: item.entityId },
          data: {
            amount: payload.amount,
            notes: payload.notes,
            receiptUrl: payload.receiptUrl,
            status: ContributionStatus.SUBMITTED,
          },
        });
        return;
      }

      const referenceNumber =
        payload.referenceNumber ??
        `CNT-SYNC-${item.entityId.slice(0, 8).toUpperCase()}`;

      await this.prisma.contributionRecord.create({
        data: {
          id: item.entityId,
          memberId: payload.memberId,
          memberDueId: payload.memberDueId,
          contributionType: payload.contributionType,
          amount: payload.amount,
          currency: payload.currency ?? 'RWF',
          status: ContributionStatus.SUBMITTED,
          referenceNumber,
          notes: payload.notes,
          receiptUrl: payload.receiptUrl,
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
