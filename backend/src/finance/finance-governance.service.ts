import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  FinanceApprovalStatus,
  MinistryScope,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OperationalScopeService } from '../governance/operational-scope.service';
import {
  buildFinanceScopeContext,
  canAccessMinistryFinance,
  ministryScopeFilter,
  type FinanceScopeContext,
} from '../common/governance/finance-scope.util';
import { AuditService } from '../audit/audit.service';
import { ReceiptUploadService } from './receipt/receipt-upload.service';

@Injectable()
export class FinanceGovernanceService {
  constructor(
    private prisma: PrismaService,
    private operationalScope: OperationalScopeService,
    private audit: AuditService,
    private receiptUpload: ReceiptUploadService,
  ) {}

  async scopeForUser(actorUserId: string): Promise<FinanceScopeContext> {
    const operational = await this.operationalScope.buildForUser(actorUserId);
    return buildFinanceScopeContext(operational);
  }

  private assertScope(ctx: FinanceScopeContext, ministryScope: MinistryScope) {
    if (!canAccessMinistryFinance(ctx, ministryScope)) {
      throw new ForbiddenException('Finance access denied for this ministry');
    }
  }

  async analytics(actorUserId: string, ministryScope?: MinistryScope) {
    const ctx = await this.scopeForUser(actorUserId);
    const scopes = ministryScope
      ? ctx.ministryScopes.filter((s) => s === ministryScope)
      : ctx.ministryScopes;

    if (!scopes.length) {
      return this.emptyAnalytics(ctx);
    }

    const scopeWhere = ministryScopeFilter(scopes);
    const txLimit = ctx.executiveSummaryOnly ? 0 : 50;

    const [transactions, dues, budgets] = await Promise.all([
      txLimit > 0
        ? this.prisma.financeTransaction.findMany({
            where: scopeWhere,
            orderBy: { transactionDate: 'desc' },
            take: txLimit,
          })
        : Promise.resolve([]),
      this.prisma.memberDues.findMany({
        where: {
          ...scopeWhere,
          status: { in: ['UNPAID', 'PARTIAL'] },
        },
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
        },
        take: ctx.executiveSummaryOnly ? 10 : 30,
      }),
      this.prisma.budget.findMany({
        where: scopeWhere,
        orderBy: { periodEnd: 'desc' },
        take: 10,
      }),
    ]);

    let income = 0;
    let expense = 0;
    const allTx = await this.prisma.financeTransaction.findMany({
      where: { ...scopeWhere, approvalStatus: 'APPROVED' },
      select: { type: true, amount: true },
    });
    for (const t of allTx) {
      const amount = Number(t.amount);
      if (t.type === TransactionType.INCOME) income += amount;
      else expense += amount;
    }

    const unpaidMembers = new Set(dues.map((d) => d.memberId));
    const totalUnpaid = dues.reduce((s, d) => {
      const due = Number(d.amountDue ?? d.amount);
      const paid = Number(d.amountPaid ?? 0);
      return s + Math.max(0, due - paid);
    }, 0);

    const memberCount = await this.prisma.member.count({
      where: {
        ministry: scopes.length === 1 ? scopes[0] : { in: scopes },
        status: 'ACTIVE',
      },
    });

    const budgetHealth = budgets.map((b) => {
      const planned = Number(b.amount);
      const actual = Number(b.actualAmount);
      return {
        id: b.id,
        name: b.name,
        ministryScope: b.ministryScope,
        planned,
        actual,
        remaining: planned - actual,
        overBudget: actual > planned,
      };
    });

    const trendStart = new Date();
    trendStart.setMonth(trendStart.getMonth() - 11);
    const recentTx = await this.prisma.financeTransaction.findMany({
      where: {
        ...scopeWhere,
        transactionDate: { gte: trendStart },
        approvalStatus: 'APPROVED',
      },
    });
    const monthlyTrend = this.buildMonthlyTrend(recentTx, trendStart);

    return {
      ministryScopes: scopes,
      executiveSummary: ctx.executiveSummaryOnly,
      balance: income - expense,
      income,
      expense,
      transactionCount: allTx.length,
      unpaidBalance: totalUnpaid,
      unpaidMemberCount: unpaidMembers.size,
      complianceRate:
        memberCount === 0
          ? 100
          : Math.max(
              0,
              Math.round(
                ((memberCount - unpaidMembers.size) / memberCount) * 100,
              ),
            ),
      unpaidMembers: dues.slice(0, 10).map((d) => ({
        memberId: d.memberId,
        name: `${d.member.firstName} ${d.member.lastName}`,
        period: d.period,
        dueType: d.dueType,
        amountDue: Number(d.amountDue ?? d.amount),
        amountPaid: Number(d.amountPaid ?? 0),
        status: d.status,
      })),
      budgets: budgetHealth,
      monthlyTrend,
      recentTransactions: ctx.executiveSummaryOnly
        ? []
        : transactions.slice(0, 15).map((t) => ({
            id: t.id,
            type: t.type,
            category: t.category,
            amount: Number(t.amount),
            ministryScope: t.ministryScope,
            transactionDate: t.transactionDate,
            description: t.description,
            approvalStatus: t.approvalStatus,
            receiptUrl: t.receiptUrl,
          })),
      alerts: this.buildAlerts(budgetHealth, dues, transactions),
    };
  }

  async memberContributions(actorUserId: string) {
    const ctx = await this.scopeForUser(actorUserId);
    if (!ctx.memberId) {
      throw new ForbiddenException('Member profile required');
    }

    const dues = await this.prisma.memberDues.findMany({
      where: { memberId: ctx.memberId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    const transactions = await this.prisma.financeTransaction.findMany({
      where: {
        memberId: ctx.memberId,
        type: TransactionType.INCOME,
      },
      orderBy: { transactionDate: 'desc' },
      take: 100,
    });

    const summary = this.buildMemberContributionSummary(dues, transactions);
    const byMinistry = this.buildMemberMinistryBreakdown(dues, transactions);
    const history = this.buildMemberContributionHistory(dues, transactions);
    const reminders = dues
      .filter((d) => d.status === 'UNPAID' || d.status === 'PARTIAL')
      .map((d) => ({
        id: d.id,
        ministryScope: d.ministryScope,
        dueType: d.dueType,
        period: d.period,
        amountDue: Number(d.amountDue ?? d.amount),
        remaining: Math.max(
          0,
          Number(d.amountDue ?? d.amount) - Number(d.amountPaid ?? 0),
        ),
        status: d.status,
      }));

    return {
      summary,
      byMinistry,
      history,
      reminders,
      dues: dues.map((d) => ({
        id: d.id,
        ministryScope: d.ministryScope,
        dueType: d.dueType,
        period: d.period,
        amountDue: Number(d.amountDue ?? d.amount),
        amountPaid: Number(d.amountPaid ?? 0),
        remaining: Math.max(
          0,
          Number(d.amountDue ?? d.amount) - Number(d.amountPaid ?? 0),
        ),
        status: d.status,
        paid: d.paid,
        paidAt: d.paidAt,
        waivedReason: d.waivedReason,
        receiptUrl: null as string | null,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        ministryScope: t.ministryScope,
        type: t.type,
        category: t.category,
        amount: Number(t.amount),
        transactionDate: t.transactionDate,
        description: t.description,
        receiptUrl: t.receiptUrl,
      })),
    };
  }

  /** Widget-friendly slice for member dashboard (no leader/admin assumptions). */
  memberContributionWidget(payload: {
    summary: {
      totalObligations: number;
      paidCount: number;
      unpaidCount: number;
      consistencyRate: number;
      outstandingBalance: number;
      upToDate: boolean;
    };
    history: Array<{
      period: string | null;
      date: string;
      amount: number;
      status: string;
      ministryScope: MinistryScope;
    }>;
  }) {
    return {
      total: payload.summary.totalObligations,
      paid: payload.summary.paidCount,
      unpaid: payload.summary.unpaidCount,
      completionRate: payload.summary.consistencyRate,
      outstandingAmount: payload.summary.outstandingBalance,
      upToDate: payload.summary.upToDate,
      recent: payload.history.slice(0, 6).map((h) => ({
        period: h.period ?? h.date,
        amount: h.amount,
        paid: h.status === 'PAID' || h.status === 'WAIVED',
        paidAt: h.date,
        ministryScope: h.ministryScope,
        status: h.status,
      })),
    };
  }

  private buildMemberContributionSummary(
    dues: Array<{
      amountDue: Prisma.Decimal | null;
      amount: Prisma.Decimal;
      amountPaid: Prisma.Decimal | null;
      status: string;
      paid: boolean;
    }>,
    transactions: Array<{ amount: Prisma.Decimal }>,
  ) {
    const totalContributed = transactions.reduce(
      (s, t) => s + Number(t.amount),
      0,
    );
    const outstandingBalance = dues.reduce((s, d) => {
      if (d.status === 'PAID' || d.status === 'WAIVED') return s;
      const due = Number(d.amountDue ?? d.amount);
      const paid = Number(d.amountPaid ?? 0);
      return s + Math.max(0, due - paid);
    }, 0);
    const totalObligations = dues.length;
    const paidCount = dues.filter(
      (d) => d.status === 'PAID' || d.status === 'WAIVED' || d.paid,
    ).length;
    const unpaidCount = totalObligations - paidCount;
    const consistencyRate = totalObligations
      ? Math.round((paidCount / totalObligations) * 100)
      : 100;

    return {
      totalContributed,
      outstandingBalance,
      consistencyRate,
      totalObligations,
      paidCount,
      unpaidCount,
      upToDate: outstandingBalance <= 0 && unpaidCount === 0,
    };
  }

  private buildMemberMinistryBreakdown(
    dues: Array<{ ministryScope: MinistryScope; amountDue: Prisma.Decimal | null; amount: Prisma.Decimal; amountPaid: Prisma.Decimal | null; status: string }>,
    transactions: Array<{ ministryScope: MinistryScope; amount: Prisma.Decimal }>,
  ) {
    const scopes = new Set<MinistryScope>();
    for (const d of dues) scopes.add(d.ministryScope);
    for (const t of transactions) scopes.add(t.ministryScope);

    return [...scopes].map((ministryScope) => {
      const ministryDues = dues.filter((d) => d.ministryScope === ministryScope);
      const ministryTx = transactions.filter(
        (t) => t.ministryScope === ministryScope,
      );
      const contributed = ministryTx.reduce((s, t) => s + Number(t.amount), 0);
      const outstanding = ministryDues.reduce((s, d) => {
        if (d.status === 'PAID' || d.status === 'WAIVED') return s;
        const due = Number(d.amountDue ?? d.amount);
        const paid = Number(d.amountPaid ?? 0);
        return s + Math.max(0, due - paid);
      }, 0);
      return {
        ministryScope,
        contributed,
        outstanding,
        obligationCount: ministryDues.length,
      };
    });
  }

  private buildMemberContributionHistory(
    dues: Array<{
      id: string;
      ministryScope: MinistryScope;
      dueType: string;
      period: string;
      amountDue: Prisma.Decimal | null;
      amount: Prisma.Decimal;
      amountPaid: Prisma.Decimal | null;
      status: string;
      paidAt: Date | null;
      updatedAt: Date;
      waivedReason: string | null;
    }>,
    transactions: Array<{
      id: string;
      ministryScope: MinistryScope;
      category: string;
      amount: Prisma.Decimal;
      transactionDate: Date;
      description: string | null;
      receiptUrl: string | null;
    }>,
  ) {
    const dueItems = dues.map((d) => ({
      id: d.id,
      date: (d.paidAt ?? d.updatedAt).toISOString().slice(0, 10),
      ministryScope: d.ministryScope,
      contributionType: d.dueType,
      period: d.period,
      amount: Number(d.amountDue ?? d.amount),
      status: d.status,
      receiptUrl: null as string | null,
    }));
    const txItems = transactions.map((t) => ({
      id: t.id,
      date: t.transactionDate.toISOString().slice(0, 10),
      ministryScope: t.ministryScope,
      contributionType: t.category,
      period: null as string | null,
      amount: Number(t.amount),
      status: 'PAID',
      receiptUrl: t.receiptUrl,
    }));
    return [...dueItems, ...txItems].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }

  async approveTransaction(
    actorUserId: string,
    transactionId: string,
    approve: boolean,
  ) {
    const ctx = await this.scopeForUser(actorUserId);
    const tx = await this.prisma.financeTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    this.assertScope(ctx, tx.ministryScope);

    const canApprove =
      (tx.ministryScope === MinistryScope.CHOIR && ctx.canApproveChoir) ||
      (tx.ministryScope === MinistryScope.PROTOCOL && ctx.canApproveProtocol) ||
      ctx.canManageChoir ||
      ctx.canManageProtocol;

    if (!canApprove) {
      throw new ForbiddenException('Cannot approve transactions for this ministry');
    }

    const updated = await this.prisma.financeTransaction.update({
      where: { id: transactionId },
      data: {
        approvalStatus: approve
          ? FinanceApprovalStatus.APPROVED
          : FinanceApprovalStatus.REJECTED,
        approvedById: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: approve ? 'FINANCE_TX_APPROVED' : 'FINANCE_TX_REJECTED',
      entity: 'FinanceTransaction',
      entityId: transactionId,
      newValue: updated,
    });

    return updated;
  }

  async attachReceipt(
    actorUserId: string,
    transactionId: string,
    receiptUrl: string,
  ) {
    const ctx = await this.scopeForUser(actorUserId);
    const tx = await this.prisma.financeTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    this.assertScope(ctx, tx.ministryScope);

    if (!this.receiptUpload.validateReceiptUrl(receiptUrl)) {
      throw new BadRequestException('Invalid receipt URL');
    }

    const updated = await this.prisma.financeTransaction.update({
      where: { id: transactionId },
      data: { receiptUrl },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'FINANCE_RECEIPT_ATTACHED',
      entity: 'FinanceTransaction',
      entityId: transactionId,
      newValue: { receiptUrl },
    });

    return updated;
  }

  private emptyAnalytics(ctx: FinanceScopeContext) {
    return {
      ministryScopes: [],
      executiveSummary: ctx.executiveSummaryOnly,
      balance: 0,
      income: 0,
      expense: 0,
      transactionCount: 0,
      unpaidBalance: 0,
      unpaidMemberCount: 0,
      complianceRate: 100,
      unpaidMembers: [],
      budgets: [],
      monthlyTrend: [],
      recentTransactions: [],
      alerts: [],
    };
  }

  private buildMonthlyTrend(
    rows: Array<{ transactionDate: Date; type: TransactionType; amount: Prisma.Decimal }>,
    start: Date,
  ) {
    const buckets: Record<string, { income: number; expense: number; label: string }> =
      {};
    const cursor = new Date(start);
    const now = new Date();
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      buckets[key] = {
        label: cursor.toLocaleString('default', { month: 'short', year: '2-digit' }),
        income: 0,
        expense: 0,
      };
      cursor.setMonth(cursor.getMonth() + 1);
    }
    for (const row of rows) {
      const key = `${row.transactionDate.getFullYear()}-${row.transactionDate.getMonth()}`;
      if (!buckets[key]) continue;
      const amount = Number(row.amount);
      if (row.type === TransactionType.INCOME) buckets[key].income += amount;
      else buckets[key].expense += amount;
    }
    return Object.values(buckets);
  }

  private buildAlerts(
    budgets: Array<{ overBudget: boolean; name: string }>,
    dues: Array<{ status: string }>,
    transactions: Array<{ receiptUrl: string | null; approvalStatus: string }>,
  ) {
    const alerts: Array<{
      id: string;
      severity: 'info' | 'warning' | 'critical';
      title: string;
      message: string;
    }> = [];

    const unpaid = dues.filter((d) => d.status === 'UNPAID' || d.status === 'PARTIAL')
      .length;
    if (unpaid > 0) {
      alerts.push({
        id: 'unpaid-dues',
        severity: 'warning',
        title: 'Outstanding contributions',
        message: `${unpaid} contribution record(s) need attention.`,
      });
    }

    for (const b of budgets.filter((x) => x.overBudget)) {
      alerts.push({
        id: `budget-${b.name}`,
        severity: 'warning',
        title: 'Over budget',
        message: `${b.name} has exceeded its planned amount.`,
      });
    }

    const missingReceipt = transactions.filter(
      (t) => t.approvalStatus === 'APPROVED' && !t.receiptUrl,
    ).length;
    if (missingReceipt > 3) {
      alerts.push({
        id: 'missing-receipts',
        severity: 'info',
        title: 'Receipts pending',
        message: `${missingReceipt} approved transaction(s) lack receipt evidence.`,
      });
    }

    return alerts.slice(0, 5);
  }
}
