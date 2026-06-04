import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MinistryBudgetStatus,
  MinistryExpenseStatus,
  MinistryFundTransactionType,
  MinistryFundType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import {
  assertAllowFinance,
  assertExpenseApprove,
  assertExpenseCreate,
  assertFinanceReport,
  assertMinistryFinanceAccess,
  assertMinistryFinanceManage,
  computeFundBalance,
} from './ministry-finance.util';
import {
  MINISTRY_FINANCE_AUDIT,
  MINISTRY_FINANCE_AUDIT_ENTITY,
} from './ministry-finance.constants';

@Injectable()
export class MinistryFundsService {
  constructor(
    private prisma: PrismaService,
    private access: MinistryAccessService,
    private audit: AuditService,
  ) {}

  async list(actorUserId: string, ministryId: string) {
    await assertMinistryFinanceAccess(this.access, actorUserId, ministryId);
    const funds = await this.prisma.ministryFund.findMany({
      where: { ministryId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return Promise.all(
      funds.map(async (f) => ({
        ...f,
        balance: await computeFundBalance(this.prisma, f.id),
      })),
    );
  }

  async create(
    actorUserId: string,
    ministryId: string,
    dto: {
      name: string;
      description?: string;
      type?: MinistryFundType;
    },
  ) {
    await assertMinistryFinanceManage(this.access, actorUserId, ministryId);
    await assertAllowFinance(this.prisma, ministryId);

    const fund = await this.prisma.ministryFund.create({
      data: {
        ministryId,
        name: dto.name.trim(),
        description: dto.description,
        type: dto.type ?? 'GENERAL',
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.FUND_CREATED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: fund.id,
      newValue: { ministryId, name: fund.name },
    });

    return { ...fund, balance: 0 };
  }

  async deposit(
    actorUserId: string,
    ministryId: string,
    fundId: string,
    dto: { amount: number; description?: string },
  ) {
    await assertMinistryFinanceManage(this.access, actorUserId, ministryId);
    await this.assertFundInMinistry(fundId, ministryId);

    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');

    const tx = await this.prisma.ministryFundTransaction.create({
      data: {
        fundId,
        type: 'DEPOSIT',
        amount: dto.amount,
        description: dto.description,
        actorId: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.TRANSACTION_ADDED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: tx.id,
      newValue: { fundId, type: 'DEPOSIT', amount: dto.amount },
    });

    return tx;
  }

  async transfer(
    actorUserId: string,
    ministryId: string,
    dto: {
      fromFundId: string;
      toFundId: string;
      amount: number;
      reason?: string;
    },
  ) {
    await assertMinistryFinanceManage(this.access, actorUserId, ministryId);
    if (dto.fromFundId === dto.toFundId) {
      throw new BadRequestException('Cannot transfer to the same fund');
    }
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');

    await this.assertFundInMinistry(dto.fromFundId, ministryId);
    await this.assertFundInMinistry(dto.toFundId, ministryId);

    const balance = await computeFundBalance(this.prisma, dto.fromFundId);
    if (balance < dto.amount) {
      throw new BadRequestException('Insufficient fund balance');
    }

    const transfer = await this.prisma.$transaction(async (tx) => {
      const row = await tx.ministryFundTransfer.create({
        data: {
          fromFundId: dto.fromFundId,
          toFundId: dto.toFundId,
          amount: dto.amount,
          reason: dto.reason,
          approvedById: actorUserId,
        },
      });

      await tx.ministryFundTransaction.create({
        data: {
          fundId: dto.fromFundId,
          type: 'TRANSFER',
          amount: -dto.amount,
          description: dto.reason ?? 'Internal transfer out',
          actorId: actorUserId,
          transferId: row.id,
        },
      });

      await tx.ministryFundTransaction.create({
        data: {
          fundId: dto.toFundId,
          type: 'TRANSFER',
          amount: dto.amount,
          description: dto.reason ?? 'Internal transfer in',
          actorId: actorUserId,
          transferId: row.id,
        },
      });

      return row;
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.TRANSFER_CREATED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: transfer.id,
      newValue: dto,
    });

    return transfer;
  }

  private async assertFundInMinistry(fundId: string, ministryId: string) {
    const fund = await this.prisma.ministryFund.findFirst({
      where: { id: fundId, ministryId },
    });
    if (!fund) throw new NotFoundException('Fund not found in ministry');
    return fund;
  }
}

@Injectable()
export class MinistryBudgetsService {
  constructor(
    private prisma: PrismaService,
    private access: MinistryAccessService,
    private audit: AuditService,
  ) {}

  async list(actorUserId: string, ministryId: string) {
    await assertMinistryFinanceAccess(this.access, actorUserId, ministryId);
    return this.prisma.ministryBudget.findMany({
      where: { ministryId },
      include: { categories: true },
      orderBy: [{ fiscalYear: 'desc' }, { name: 'asc' }],
    });
  }

  async create(
    actorUserId: string,
    ministryId: string,
    dto: {
      name: string;
      fiscalYear: number;
      totalBudget: number;
      notes?: string;
      categories?: Array<{ name: string; allocatedAmount: number }>;
    },
  ) {
    await assertMinistryFinanceManage(this.access, actorUserId, ministryId);
    await assertAllowFinance(this.prisma, ministryId);

    const budget = await this.prisma.ministryBudget.create({
      data: {
        ministryId,
        name: dto.name.trim(),
        fiscalYear: dto.fiscalYear,
        totalBudget: dto.totalBudget,
        notes: dto.notes,
        status: 'DRAFT',
        categories: dto.categories?.length
          ? {
              create: dto.categories.map((c) => ({
                name: c.name.trim(),
                allocatedAmount: c.allocatedAmount,
                spentAmount: 0,
                remainingAmount: c.allocatedAmount,
              })),
            }
          : undefined,
      },
      include: { categories: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.BUDGET_CREATED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: budget.id,
      newValue: { ministryId, name: budget.name },
    });

    return budget;
  }

  async activate(actorUserId: string, ministryId: string, budgetId: string) {
    await assertMinistryFinanceManage(this.access, actorUserId, ministryId);
    const budget = await this.prisma.ministryBudget.findFirst({
      where: { id: budgetId, ministryId },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    return this.prisma.ministryBudget.update({
      where: { id: budgetId },
      data: { status: 'ACTIVE' satisfies MinistryBudgetStatus },
      include: { categories: true },
    });
  }
}

@Injectable()
export class MinistryExpensesService {
  constructor(
    private prisma: PrismaService,
    private access: MinistryAccessService,
    private audit: AuditService,
  ) {}

  async list(actorUserId: string, ministryId: string, status?: MinistryExpenseStatus) {
    await assertMinistryFinanceAccess(this.access, actorUserId, ministryId);
    return this.prisma.ministryExpense.findMany({
      where: { ministryId, ...(status ? { status } : {}) },
      include: {
        fund: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { expenseDate: 'desc' },
      take: 200,
    });
  }

  async create(
    actorUserId: string,
    ministryId: string,
    dto: {
      fundId: string;
      amount: number;
      description: string;
      categoryId?: string;
      budgetId?: string;
      expenseDate?: string;
      receiptUrls?: string[];
    },
  ) {
    await assertExpenseCreate(this.access, actorUserId, ministryId);
    await assertAllowFinance(this.prisma, ministryId);

    const actor = await this.access.resolveActor(actorUserId);
    if (!actor.memberId) throw new ForbiddenException('Member profile required');

    const fund = await this.prisma.ministryFund.findFirst({
      where: { id: dto.fundId, ministryId },
    });
    if (!fund) throw new NotFoundException('Fund not found');

    return this.prisma.ministryExpense.create({
      data: {
        ministryId,
        fundId: dto.fundId,
        categoryId: dto.categoryId,
        budgetId: dto.budgetId,
        amount: dto.amount,
        description: dto.description.trim(),
        receiptUrls: dto.receiptUrls,
        requestedById: actor.memberId,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        status: 'DRAFT',
      },
    });
  }

  async submit(actorUserId: string, ministryId: string, expenseId: string) {
    await assertExpenseCreate(this.access, actorUserId, ministryId);
    const expense = await this.getExpenseOrThrow(expenseId, ministryId);
    if (expense.status !== 'DRAFT') {
      throw new BadRequestException('Only draft expenses can be submitted');
    }

    const row = await this.prisma.ministryExpense.update({
      where: { id: expenseId },
      data: { status: 'SUBMITTED' },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.EXPENSE_SUBMITTED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: expenseId,
    });

    return row;
  }

  async approve(actorUserId: string, ministryId: string, expenseId: string) {
    await assertExpenseApprove(this.access, actorUserId, ministryId);
    const actor = await this.access.resolveActor(actorUserId);
    if (!actor.memberId) throw new ForbiddenException('Member profile required');

    const expense = await this.getExpenseOrThrow(expenseId, ministryId);
    if (expense.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted expenses can be approved');
    }

    const row = await this.prisma.ministryExpense.update({
      where: { id: expenseId },
      data: {
        status: 'APPROVED',
        approvedById: actor.memberId,
        approvedAt: new Date(),
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.EXPENSE_APPROVED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: expenseId,
    });

    return row;
  }

  async reject(actorUserId: string, ministryId: string, expenseId: string) {
    await assertExpenseApprove(this.access, actorUserId, ministryId);
    const expense = await this.getExpenseOrThrow(expenseId, ministryId);
    if (expense.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted expenses can be rejected');
    }

    const row = await this.prisma.ministryExpense.update({
      where: { id: expenseId },
      data: { status: 'REJECTED' },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.EXPENSE_REJECTED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: expenseId,
    });

    return row;
  }

  async markPaid(actorUserId: string, ministryId: string, expenseId: string) {
    await assertMinistryFinanceManage(this.access, actorUserId, ministryId);
    const expense = await this.getExpenseOrThrow(expenseId, ministryId);
    if (expense.status !== 'APPROVED') {
      throw new BadRequestException('Only approved expenses can be paid');
    }

    const amount = Number(expense.amount);
    const balance = await computeFundBalance(this.prisma, expense.fundId);
    if (balance < amount) {
      throw new BadRequestException('Insufficient fund balance');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ministryExpense.update({
        where: { id: expenseId },
        data: { status: 'PAID' },
      });

      await tx.ministryFundTransaction.create({
        data: {
          fundId: expense.fundId,
          type: 'EXPENSE' satisfies MinistryFundTransactionType,
          amount: -amount,
          description: expense.description,
          actorId: actorUserId,
          expenseId: expense.id,
        },
      });

      if (expense.categoryId) {
        const cat = await tx.ministryBudgetCategory.findUnique({
          where: { id: expense.categoryId },
        });
        if (cat) {
          const spent = Number(cat.spentAmount) + amount;
          const remaining = Number(cat.allocatedAmount) - spent;
          await tx.ministryBudgetCategory.update({
            where: { id: cat.id },
            data: { spentAmount: spent, remainingAmount: remaining },
          });
        }
      }

      return updated;
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.TRANSACTION_ADDED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: expenseId,
      newValue: { status: 'PAID', amount },
    });

    return row;
  }

  private async getExpenseOrThrow(expenseId: string, ministryId: string) {
    const expense = await this.prisma.ministryExpense.findFirst({
      where: { id: expenseId, ministryId },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }
}
