import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createTransaction(dto: CreateTransactionDto, userId: string) {
    const tx = await this.prisma.financeTransaction.create({
      data: {
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        memberId: dto.memberId,
        recordedById: userId,
        transactionDate: dto.transactionDate
          ? new Date(dto.transactionDate)
          : new Date(),
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

  async listTransactions(page = 1, limit = 20) {
    const { skip, take } = paginate(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.financeTransaction.findMany({
        skip,
        take,
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.financeTransaction.count(),
    ]);
    return paginatedResult(items, total, page, limit);
  }

  async summary() {
    const transactions = await this.prisma.financeTransaction.findMany();
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') income += amount;
      else expense += amount;
    }

    return { income, expense, balance: income - expense, count: transactions.length };
  }

  async upsertMemberDues(
    memberId: string,
    period: string,
    amount: number,
    userId: string,
  ) {
    const dues = await this.prisma.memberDues.upsert({
      where: { memberId_period: { memberId, period } },
      create: { memberId, period, amount },
      update: { amount },
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
    const budget = await this.prisma.budget.create({
      data: {
        name: dto.name,
        amount: dto.amount,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
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

  async listBudgets(page = 1, limit = 20) {
    const { skip, take } = paginate(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.budget.findMany({
        skip,
        take,
        orderBy: { periodStart: 'desc' },
      }),
      this.prisma.budget.count(),
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

    const budget = await this.prisma.budget.update({
      where: { id },
      data: {
        name: dto.name,
        amount: dto.amount,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
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

  async markDuesPaid(memberId: string, period: string, userId: string) {
    const dues = await this.prisma.memberDues.update({
      where: { memberId_period: { memberId, period } },
      data: { paid: true, paidAt: new Date() },
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
}
