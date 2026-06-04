import { Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import {
  assertFinanceReport,
  assertMinistryFinanceAccess,
  computeFundBalance,
} from './ministry-finance.util';
import {
  MINISTRY_FINANCE_AUDIT,
  MINISTRY_FINANCE_AUDIT_ENTITY,
} from './ministry-finance.constants';
import { MinistryFundsService } from './ministry-finance.services';

@Injectable()
export class MinistryFinanceReportsService {
  constructor(
    private prisma: PrismaService,
    private access: MinistryAccessService,
    private funds: MinistryFundsService,
    private audit: AuditService,
    private reports: ReportsService,
  ) {}

  async summary(actorUserId: string, ministryId: string) {
    await assertMinistryFinanceAccess(this.access, actorUserId, ministryId);
    const fundRows = await this.funds.list(actorUserId, ministryId);
    const budgets = await this.prisma.ministryBudget.findMany({
      where: { ministryId, status: 'ACTIVE' },
      include: { categories: true },
    });
    const recentExpenses = await this.prisma.ministryExpense.findMany({
      where: { ministryId },
      orderBy: { expenseDate: 'desc' },
      take: 10,
    });

    const totalFundBalance = fundRows.reduce((s, f) => s + (f.balance ?? 0), 0);
    const budgetUtilization = budgets.map((b) => {
      const allocated = b.categories.reduce(
        (s, c) => s + Number(c.allocatedAmount),
        0,
      );
      const spent = b.categories.reduce((s, c) => s + Number(c.spentAmount), 0);
      return {
        budgetId: b.id,
        name: b.name,
        fiscalYear: b.fiscalYear,
        allocated,
        spent,
        utilizationPct: allocated > 0 ? (spent / allocated) * 100 : 0,
      };
    });

    return {
      ministryId,
      fundBalances: fundRows.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        balance: f.balance,
      })),
      totalFundBalance,
      activeBudgets: budgets.length,
      budgetUtilization,
      recentExpenses,
      alerts: fundRows
        .filter((f) => (f.balance ?? 0) < 0)
        .map((f) => ({ type: 'LOW_BALANCE', fundId: f.id, name: f.name })),
    };
  }

  async fundBalances(actorUserId: string, ministryId: string) {
    return this.funds.list(actorUserId, ministryId);
  }

  async expenseSummary(actorUserId: string, ministryId: string) {
    await assertFinanceReport(this.access, actorUserId, ministryId);
    const rows = await this.prisma.ministryExpense.groupBy({
      by: ['status'],
      where: { ministryId },
      _sum: { amount: true },
      _count: true,
    });
    return rows.map((r) => ({
      status: r.status,
      count: r._count,
      totalAmount: Number(r._sum.amount ?? 0),
    }));
  }

  async categorySpending(actorUserId: string, ministryId: string) {
    await assertFinanceReport(this.access, actorUserId, ministryId);
    const categories = await this.prisma.ministryBudgetCategory.findMany({
      where: { budget: { ministryId } },
      include: { budget: { select: { name: true, fiscalYear: true } } },
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      budget: c.budget.name,
      fiscalYear: c.budget.fiscalYear,
      allocated: Number(c.allocatedAmount),
      spent: Number(c.spentAmount),
      remaining: Number(c.remainingAmount),
    }));
  }

  async yearSummary(actorUserId: string, ministryId: string, year: number) {
    await assertFinanceReport(this.access, actorUserId, ministryId);
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year + 1}-01-01`);
    const expenses = await this.prisma.ministryExpense.findMany({
      where: {
        ministryId,
        expenseDate: { gte: start, lt: end },
        status: 'PAID',
      },
    });
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    return { year, expenseCount: expenses.length, totalPaid: total };
  }

  async exportCsv(actorUserId: string, ministryId: string) {
    const data = await this.summary(actorUserId, ministryId);
    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.REPORT_EXPORTED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: ministryId,
      newValue: { format: 'csv' },
    });

    const lines = [
      'fund,balance',
      ...data.fundBalances.map((f) => `${f.name},${f.balance}`),
    ];
    return {
      filename: `ministry-finance-${ministryId}.csv`,
      mimeType: 'text/csv',
      content: lines.join('\n'),
    };
  }

  async exportPdf(actorUserId: string, ministryId: string) {
    const data = await this.summary(actorUserId, ministryId);
    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_FINANCE_AUDIT.REPORT_EXPORTED,
      entity: MINISTRY_FINANCE_AUDIT_ENTITY,
      entityId: ministryId,
      newValue: { format: 'pdf' },
    });

    const buffer = await this.reports.exportPdf('Ministry Finance Report', [
      `Total fund balance: ${data.totalFundBalance}`,
      `Active budgets: ${data.activeBudgets}`,
      ...data.fundBalances.map((f) => `${f.name}: ${f.balance}`),
    ]);
    return {
      filename: `ministry-finance-${ministryId}.pdf`,
      mimeType: 'application/pdf',
      content: buffer,
    };
  }
}

@Injectable()
export class MinistryFinanceDashboardService {
  constructor(
    private reports: MinistryFinanceReportsService,
    private prisma: PrismaService,
  ) {}

  async widgetSummary(actorUserId: string, ministryId: string) {
    const settings = await this.prisma.ministrySettings.findUnique({
      where: { ministryId },
    });
    if (settings?.allowFinance === false) return null;

    try {
      return await this.reports.summary(actorUserId, ministryId);
    } catch {
      return null;
    }
  }
}
