import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  DueStatus,
  DueType,
  FinanceApprovalStatus,
  MinistryScope,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpsertMemberDuesDto } from './dto/upsert-member-dues.dto';
import { FinanceGovernanceService } from './finance-governance.service';
import {
  canAccessMinistryFinance,
  ministryScopeFilter,
} from '../common/governance/finance-scope.util';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private financeGovernance: FinanceGovernanceService,
  ) {}

  async createTransaction(dto: CreateTransactionDto, userId: string) {
    const ctx = await this.financeGovernance.scopeForUser(userId);
    if (!canAccessMinistryFinance(ctx, dto.ministryScope)) {
      throw new ForbiddenException('Cannot record transactions for this ministry');
    }

    const needsApproval =
      dto.type === TransactionType.EXPENSE &&
      Number(dto.amount) >= 500 &&
      !ctx.canApproveChoir &&
      !ctx.canApproveProtocol;

    const tx = await this.prisma.financeTransaction.create({
      data: {
        ministryScope: dto.ministryScope,
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        currency: dto.currency ?? 'RWF',
        description: dto.description,
        memberId: dto.memberId,
        recordedById: userId,
        relatedEventId: dto.relatedEventId,
        receiptUrl: dto.receiptUrl,
        transactionDate: dto.transactionDate
          ? new Date(dto.transactionDate)
          : new Date(),
        approvalStatus: needsApproval
          ? FinanceApprovalStatus.PENDING
          : FinanceApprovalStatus.APPROVED,
        approvedById: needsApproval ? undefined : userId,
      },
    });

    await this.audit.log({
      userId,
      action: 'FINANCE_TRANSACTION_CREATE',
      entity: 'FinanceTransaction',
      entityId: tx.id,
      newValue: tx,
    });

    return tx;
  }

  async listTransactions(
    userId: string,
    page = 1,
    limit = 20,
    ministryScope?: MinistryScope,
  ) {
    const ctx = await this.financeGovernance.scopeForUser(userId);
    const scopes = ministryScope
      ? ctx.ministryScopes.filter((s) => s === ministryScope)
      : ctx.ministryScopes;
    const { skip, take } = paginate(page, limit);
    const where = ministryScopeFilter(scopes);

    const [items, total] = await Promise.all([
      this.prisma.financeTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.financeTransaction.count({ where }),
    ]);
    return paginatedResult(items, total, page, limit);
  }

  async summary(userId: string, ministryScope?: MinistryScope) {
    const analytics = await this.financeGovernance.analytics(userId, ministryScope);
    return {
      income: analytics.income,
      expense: analytics.expense,
      balance: analytics.balance,
      count: analytics.transactionCount,
      ministryScopes: analytics.ministryScopes,
    };
  }

  async upsertMemberDues(dto: UpsertMemberDuesDto, userId: string) {
    const ctx = await this.financeGovernance.scopeForUser(userId);
    if (!canAccessMinistryFinance(ctx, dto.ministryScope)) {
      throw new ForbiddenException('Cannot manage dues for this ministry');
    }

    const amountPaid = dto.amountPaid ?? 0;
    const status = this.resolveDueStatus(dto.amountDue, amountPaid, dto.waivedReason);
    const paid = status === DueStatus.PAID || status === DueStatus.WAIVED;

    const dues = await this.prisma.memberDues.upsert({
      where: {
        memberId_period_ministryScope_dueType: {
          memberId: dto.memberId,
          period: dto.period,
          ministryScope: dto.ministryScope,
          dueType: dto.dueType,
        },
      },
      create: {
        memberId: dto.memberId,
        period: dto.period,
        ministryScope: dto.ministryScope,
        dueType: dto.dueType,
        amount: dto.amountDue,
        amountDue: dto.amountDue,
        amountPaid,
        status,
        paid,
        paidAt: paid ? new Date() : undefined,
        recordedById: userId,
        waivedReason: dto.waivedReason,
      },
      update: {
        amount: dto.amountDue,
        amountDue: dto.amountDue,
        amountPaid,
        status,
        paid,
        paidAt: paid ? new Date() : undefined,
        recordedById: userId,
        waivedReason: dto.waivedReason,
      },
    });

    await this.audit.log({
      userId,
      action: 'MEMBER_DUES_UPSERT',
      entity: 'MemberDues',
      entityId: dues.id,
      newValue: dues,
    });

    return dues;
  }

  async createBudget(dto: CreateBudgetDto, userId: string) {
    const ctx = await this.financeGovernance.scopeForUser(userId);
    if (!canAccessMinistryFinance(ctx, dto.ministryScope)) {
      throw new ForbiddenException('Cannot create budgets for this ministry');
    }

    const budget = await this.prisma.budget.create({
      data: {
        ministryScope: dto.ministryScope,
        name: dto.name,
        kind: dto.kind ?? 'MONTHLY',
        amount: dto.amount,
        actualAmount: 0,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        relatedEventId: dto.relatedEventId,
      },
    });

    await this.audit.log({
      userId,
      action: 'BUDGET_CREATE',
      entity: 'Budget',
      entityId: budget.id,
      newValue: budget,
    });

    return budget;
  }

  async listBudgets(userId: string, page = 1, limit = 20, ministryScope?: MinistryScope) {
    const ctx = await this.financeGovernance.scopeForUser(userId);
    const scopes = ministryScope
      ? ctx.ministryScopes.filter((s) => s === ministryScope)
      : ctx.ministryScopes;
    const { skip, take } = paginate(page, limit);
    const where = ministryScopeFilter(scopes);

    const [items, total] = await Promise.all([
      this.prisma.budget.findMany({
        where,
        skip,
        take,
        orderBy: { periodStart: 'desc' },
      }),
      this.prisma.budget.count({ where }),
    ]);
    return paginatedResult(items, total, page, limit);
  }

  async updateBudget(
    id: string,
    dto: Partial<CreateBudgetDto>,
    userId: string,
  ) {
    const existing = await this.prisma.budget.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Budget not found');

    const ctx = await this.financeGovernance.scopeForUser(userId);
    if (!canAccessMinistryFinance(ctx, existing.ministryScope)) {
      throw new ForbiddenException('Cannot update this budget');
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: {
        name: dto.name,
        amount: dto.amount,
        kind: dto.kind,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
        relatedEventId: dto.relatedEventId,
      },
    });

    await this.audit.log({
      userId,
      action: 'BUDGET_UPDATE',
      entity: 'Budget',
      entityId: id,
      oldValue: existing,
      newValue: budget,
    });

    return budget;
  }

  async deleteBudget(id: string, userId: string) {
    const existing = await this.prisma.budget.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Budget not found');

    const ctx = await this.financeGovernance.scopeForUser(userId);
    if (!canAccessMinistryFinance(ctx, existing.ministryScope)) {
      throw new ForbiddenException('Cannot delete this budget');
    }

    await this.prisma.budget.delete({ where: { id } });

    await this.audit.log({
      userId,
      action: 'BUDGET_DELETE',
      entity: 'Budget',
      entityId: id,
      oldValue: existing,
    });

    return { deleted: true };
  }

  async markDuesPaid(
    memberId: string,
    period: string,
    ministryScope: MinistryScope,
    dueType: DueType,
    userId: string,
  ) {
    const ctx = await this.financeGovernance.scopeForUser(userId);
    if (!canAccessMinistryFinance(ctx, ministryScope)) {
      throw new ForbiddenException('Cannot update dues for this ministry');
    }

    const existing = await this.prisma.memberDues.findUnique({
      where: {
        memberId_period_ministryScope_dueType: {
          memberId,
          period,
          ministryScope,
          dueType,
        },
      },
    });
    if (!existing) throw new NotFoundException('Dues record not found');

    const amountDue = Number(existing.amountDue ?? existing.amount);
    const dues = await this.prisma.memberDues.update({
      where: { id: existing.id },
      data: {
        amountPaid: amountDue,
        status: DueStatus.PAID,
        paid: true,
        paidAt: new Date(),
        approvedById: userId,
      },
    });

    await this.audit.log({
      userId,
      action: 'MEMBER_DUES_PAID',
      entity: 'MemberDues',
      entityId: dues.id,
      newValue: dues,
    });

    return dues;
  }

  private resolveDueStatus(
    amountDue: number,
    amountPaid: number,
    waivedReason?: string,
  ): DueStatus {
    if (waivedReason) return DueStatus.WAIVED;
    if (amountPaid <= 0) return DueStatus.UNPAID;
    if (amountPaid >= amountDue) return DueStatus.PAID;
    return DueStatus.PARTIAL;
  }
}
