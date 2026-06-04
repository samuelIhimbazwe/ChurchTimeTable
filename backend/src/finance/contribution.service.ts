import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionStatus,
  ContributionType,
  DueStatus,
  FinanceApprovalStatus,
  FinanceCategory,
  MinistryScope,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OperationalScopeService } from '../governance/operational-scope.service';
import {
  assertContributionStewardScope,
  buildFinanceScopeContext,
  type FinanceScopeContext,
} from '../common/governance/finance-scope.util';
import { ThankYouService } from './thank-you.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { ContributionConfirmedEvent } from './events/contribution-confirmed.event';

const CONFIRMED_STATUSES: ContributionStatus[] = [
  ContributionStatus.CONFIRMED,
];

@Injectable()
export class ContributionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private operationalScope: OperationalScopeService,
    private thankYou: ThankYouService,
  ) {}

  async scopeForUser(actorUserId: string): Promise<FinanceScopeContext> {
    const operational = await this.operationalScope.buildForUser(actorUserId);
    return buildFinanceScopeContext(operational);
  }

  private async generateReferenceNumber(): Promise<string> {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomBytes(3).toString('hex').toUpperCase();
      const referenceNumber = `CNT-${stamp}-${suffix}`;
      const existing = await this.prisma.contributionRecord.findUnique({
        where: { referenceNumber },
        select: { id: true },
      });
      if (!existing) {
        return referenceNumber;
      }
    }
    throw new BadRequestException('Could not allocate contribution reference');
  }

  private mapContributionTypeToCategory(
    contributionType: ContributionType,
  ): FinanceCategory {
    switch (contributionType) {
      case ContributionType.TITHE:
      case ContributionType.OFFERING:
      case ContributionType.MISSIONS:
        return FinanceCategory.DONATION;
      case ContributionType.BUILDING_FUND:
        return FinanceCategory.PROJECT;
      case ContributionType.SPECIAL:
        return FinanceCategory.OTHER;
      default:
        return FinanceCategory.OTHER;
    }
  }

  private resolveDueStatus(
    amountDue: number,
    amountPaid: number,
    waivedReason?: string | null,
  ): DueStatus {
    if (waivedReason) return DueStatus.WAIVED;
    if (amountPaid <= 0) return DueStatus.UNPAID;
    if (amountPaid >= amountDue) return DueStatus.PAID;
    return DueStatus.PARTIAL;
  }

  private serializeRecord(
    record: Prisma.ContributionRecordGetPayload<{
      include: {
        member: { select: { memberNumber: true; firstName: true; lastName: true; ministry: true } };
      };
    }>,
  ) {
    return {
      id: record.id,
      memberId: record.memberId,
      memberNumber: record.member.memberNumber,
      memberName: `${record.member.firstName} ${record.member.lastName}`.trim(),
      ministryScope: record.member.ministry,
      familyId: record.familyId,
      financeTransactionId: record.financeTransactionId,
      memberDueId: record.memberDueId,
      contributionType: record.contributionType,
      amount: Number(record.amount),
      currency: record.currency,
      status: record.status,
      referenceNumber: record.referenceNumber,
      notes: record.notes,
      receiptUrl: record.receiptUrl,
      confirmedAt: record.confirmedAt,
      confirmedById: record.confirmedById,
      thankYouSentAt: record.thankYouSentAt,
      thankYouSentById: record.thankYouSentById,
      thankYouDeliveryStatus: record.thankYouDeliveryStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private assertManageScope(ctx: FinanceScopeContext, ministry: MinistryScope) {
    assertContributionStewardScope(ctx, ministry);
  }

  async createContribution(actorUserId: string, dto: CreateContributionDto) {
    const ctx = await this.scopeForUser(actorUserId);
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
      select: { id: true, ministry: true, userId: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const isSelf = ctx.memberId === dto.memberId;
    if (!isSelf) {
      this.assertManageScope(ctx, member.ministry);
    }

    if (dto.memberDueId) {
      const due = await this.prisma.memberDues.findUnique({
        where: { id: dto.memberDueId },
      });
      if (!due || due.memberId !== dto.memberId) {
        throw new BadRequestException('Invalid member due link');
      }
    }

    const referenceNumber = await this.generateReferenceNumber();
    const created = await this.prisma.contributionRecord.create({
      data: {
        memberId: dto.memberId,
        familyId: dto.familyId,
        memberDueId: dto.memberDueId,
        contributionType: dto.contributionType,
        amount: dto.amount,
        currency: dto.currency ?? 'RWF',
        status: ContributionStatus.PENDING,
        referenceNumber,
        notes: dto.notes,
        receiptUrl: dto.receiptUrl,
      },
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            ministry: true,
          },
        },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_CREATE',
      entity: 'ContributionRecord',
      entityId: created.id,
      newValue: created,
    });

    return this.serializeRecord(created);
  }

  async submitContribution(actorUserId: string, contributionId: string) {
    const record = await this.getMutableRecord(actorUserId, contributionId);
    if (record.status !== ContributionStatus.PENDING) {
      throw new BadRequestException('Only pending contributions can be submitted');
    }

    const updated = await this.prisma.contributionRecord.update({
      where: { id: contributionId },
      data: { status: ContributionStatus.SUBMITTED },
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            ministry: true,
          },
        },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_SUBMIT',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: { status: record.status },
      newValue: { status: updated.status },
    });

    return this.serializeRecord(updated);
  }

  async confirmContribution(actorUserId: string, contributionId: string) {
    const record = await this.getMutableRecord(actorUserId, contributionId, true);
    if (record.status !== ContributionStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted contributions can be confirmed');
    }

    const member = await this.prisma.member.findUniqueOrThrow({
      where: { id: record.memberId },
      select: { ministry: true, userId: true },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.financeTransaction.create({
        data: {
          ministryScope: member.ministry,
          type: TransactionType.INCOME,
          category: this.mapContributionTypeToCategory(record.contributionType),
          amount: record.amount,
          currency: record.currency,
          description: `Contribution ${record.referenceNumber} (${record.contributionType})`,
          memberId: record.memberId,
          recordedById: actorUserId,
          approvedById: actorUserId,
          approvalStatus: FinanceApprovalStatus.APPROVED,
          receiptUrl: record.receiptUrl,
          transactionDate: new Date(),
        },
      });

      if (record.memberDueId) {
        const due = await tx.memberDues.findUnique({
          where: { id: record.memberDueId },
        });
        if (due) {
          const amountDue = Number(due.amountDue ?? due.amount);
          const amountPaid = Number(due.amountPaid ?? 0) + Number(record.amount);
          const status = this.resolveDueStatus(
            amountDue,
            amountPaid,
            due.waivedReason,
          );
          await tx.memberDues.update({
            where: { id: due.id },
            data: {
              amountPaid,
              status,
              paid: status === DueStatus.PAID || status === DueStatus.WAIVED,
              paidAt:
                status === DueStatus.PAID || status === DueStatus.WAIVED
                  ? new Date()
                  : due.paidAt,
              approvedById: actorUserId,
            },
          });
        }
      }

      const updated = await tx.contributionRecord.update({
        where: { id: contributionId },
        data: {
          status: ContributionStatus.CONFIRMED,
          financeTransactionId: transaction.id,
          confirmedAt: new Date(),
          confirmedById: actorUserId,
        },
        include: {
          member: {
            select: {
              memberNumber: true,
              firstName: true,
              lastName: true,
              ministry: true,
            },
          },
        },
      });

      return { updated, transaction };
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_CONFIRM',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: { status: record.status },
      newValue: {
        status: result.updated.status,
        financeTransactionId: result.transaction.id,
      },
    });

    const event = new ContributionConfirmedEvent(
      result.updated.id,
      result.updated.memberId,
      member.userId,
      Number(result.updated.amount),
      result.updated.currency,
      result.updated.contributionType,
      result.updated.referenceNumber,
      result.transaction.id,
    );
    await this.thankYou.handleContributionConfirmed(event);

    const refreshed = await this.prisma.contributionRecord.findUniqueOrThrow({
      where: { id: contributionId },
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            ministry: true,
          },
        },
      },
    });

    return this.serializeRecord(refreshed);
  }

  async rejectContribution(
    actorUserId: string,
    contributionId: string,
    notes?: string,
  ) {
    const record = await this.getMutableRecord(actorUserId, contributionId, true);
    if (
      record.status !== ContributionStatus.PENDING &&
      record.status !== ContributionStatus.SUBMITTED
    ) {
      throw new BadRequestException('Contribution cannot be rejected in current status');
    }

    const updated = await this.prisma.contributionRecord.update({
      where: { id: contributionId },
      data: {
        status: ContributionStatus.REJECTED,
        notes: notes ?? record.notes,
      },
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            ministry: true,
          },
        },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_REJECT',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: { status: record.status },
      newValue: { status: updated.status, notes: updated.notes },
    });

    return this.serializeRecord(updated);
  }

  async getMemberContributions(actorUserId: string) {
    const ctx = await this.scopeForUser(actorUserId);
    if (!ctx.memberId) {
      throw new ForbiddenException('Member profile required');
    }

    const records = await this.prisma.contributionRecord.findMany({
      where: { memberId: ctx.memberId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            ministry: true,
          },
        },
      },
    });

    const member = records[0]?.member
      ? records[0].member
      : await this.prisma.member.findUniqueOrThrow({
          where: { id: ctx.memberId },
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            ministry: true,
          },
        });

    const serialized = records.map((record) => this.serializeRecord(record));
    const confirmed = serialized.filter((r) => r.status === 'CONFIRMED');
    const byType = this.buildTypeBreakdown(serialized);

    return {
      memberNumber: member.memberNumber,
      records: serialized,
      totals: {
        confirmed: confirmed.reduce((sum, row) => sum + row.amount, 0),
        pending: serialized
          .filter((r) => r.status === 'PENDING' || r.status === 'SUBMITTED')
          .reduce((sum, row) => sum + row.amount, 0),
        rejected: serialized
          .filter((r) => r.status === 'REJECTED')
          .reduce((sum, row) => sum + row.amount, 0),
      },
      byType,
      recent: serialized.slice(0, 10),
    };
  }

  async getMemberContributionSummary(actorUserId: string) {
    const payload = await this.getMemberContributions(actorUserId);
    return {
      memberNumber: payload.memberNumber,
      totals: payload.totals,
      byType: payload.byType,
      recentCount: payload.recent.length,
    };
  }

  async getConfirmationQueue(actorUserId: string, limit = 30) {
    const ctx = await this.scopeForUser(actorUserId);
    if (!ctx.ministryScopes.length) {
      return [];
    }

    const records = await this.prisma.contributionRecord.findMany({
      where: {
        status: ContributionStatus.SUBMITTED,
        member: {
          ministry: { in: ctx.ministryScopes },
        },
      },
      orderBy: { updatedAt: 'asc' },
      take: limit,
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            ministry: true,
          },
        },
      },
    });

    return records.map((record) => this.serializeRecord(record));
  }

  async getContributionStats(ministryScopes: MinistryScope[]) {
    if (!ministryScopes.length) {
      return this.emptyStats();
    }

    const where = {
      member: { ministry: { in: ministryScopes } },
    };

    const [confirmed, submitted, allConfirmed] = await Promise.all([
      this.prisma.contributionRecord.aggregate({
        where: {
          ...where,
          status: ContributionStatus.CONFIRMED,
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.contributionRecord.count({
        where: {
          ...where,
          status: ContributionStatus.SUBMITTED,
        },
      }),
      this.prisma.contributionRecord.findMany({
        where: {
          ...where,
          status: { in: CONFIRMED_STATUSES },
          confirmedAt: { not: null },
        },
        select: {
          amount: true,
          contributionType: true,
          confirmedAt: true,
        },
        orderBy: { confirmedAt: 'desc' },
        take: 500,
      }),
    ]);

    const typeDistribution: Record<string, number> = {};
    for (const row of allConfirmed) {
      const key = row.contributionType;
      typeDistribution[key] =
        (typeDistribution[key] ?? 0) + Number(row.amount);
    }

    const growth = this.buildContributionGrowth(allConfirmed);

    return {
      contributionTotals: Number(confirmed._sum.amount ?? 0),
      confirmedCount: confirmed._count,
      pendingConfirmationCount: submitted,
      contributionGrowth: growth,
      contributionTypeDistribution: Object.entries(typeDistribution).map(
        ([contributionType, total]) => ({ contributionType, total }),
      ),
    };
  }

  private buildTypeBreakdown(
    records: Array<{ contributionType: string; amount: number; status: string }>,
  ) {
    const buckets = new Map<string, { total: number; confirmed: number; count: number }>();
    for (const record of records) {
      const current = buckets.get(record.contributionType) ?? {
        total: 0,
        confirmed: 0,
        count: 0,
      };
      current.total += record.amount;
      current.count += 1;
      if (record.status === 'CONFIRMED') {
        current.confirmed += record.amount;
      }
      buckets.set(record.contributionType, current);
    }
    return [...buckets.entries()].map(([contributionType, stats]) => ({
      contributionType,
      ...stats,
    }));
  }

  private buildContributionGrowth(
    rows: Array<{ amount: Prisma.Decimal; confirmedAt: Date | null }>,
  ) {
    const buckets: Record<string, { label: string; total: number }> = {};
    const start = new Date();
    start.setMonth(start.getMonth() - 11);
    const cursor = new Date(start);
    const now = new Date();
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      buckets[key] = {
        label: cursor.toLocaleString('default', {
          month: 'short',
          year: '2-digit',
        }),
        total: 0,
      };
      cursor.setMonth(cursor.getMonth() + 1);
    }
    for (const row of rows) {
      if (!row.confirmedAt) continue;
      const key = `${row.confirmedAt.getFullYear()}-${row.confirmedAt.getMonth()}`;
      if (!buckets[key]) continue;
      buckets[key].total += Number(row.amount);
    }
    return Object.values(buckets);
  }

  private emptyStats() {
    return {
      contributionTotals: 0,
      confirmedCount: 0,
      pendingConfirmationCount: 0,
      contributionGrowth: [] as Array<{ label: string; total: number }>,
      contributionTypeDistribution: [] as Array<{
        contributionType: string;
        total: number;
      }>,
    };
  }

  private async getMutableRecord(
    actorUserId: string,
    contributionId: string,
    requireManage = false,
  ) {
    const ctx = await this.scopeForUser(actorUserId);
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      include: {
        member: { select: { ministry: true, userId: true } },
      },
    });
    if (!record) {
      throw new NotFoundException('Contribution not found');
    }

    const isSelf = ctx.memberId === record.memberId;
    if (requireManage) {
      this.assertManageScope(ctx, record.member.ministry);
    } else if (!isSelf) {
      this.assertManageScope(ctx, record.member.ministry);
    }

    return record;
  }
}
