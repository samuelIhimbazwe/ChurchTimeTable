import { ForbiddenException, Injectable } from '@nestjs/common';
import { MinistryScope, Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FinanceGovernanceService } from './finance-governance.service';
import {
  canAccessMinistryFinance,
  ministryScopeFilter,
} from '../common/governance/finance-scope.util';

export interface FinanceExportFilters {
  ministryScope?: MinistryScope;
  from?: string;
  to?: string;
  memberId?: string;
}

@Injectable()
export class FinanceExportService {
  constructor(
    private prisma: PrismaService,
    private financeGovernance: FinanceGovernanceService,
    private audit: AuditService,
  ) {}

  async exportMinistryCsv(actorUserId: string, filters: FinanceExportFilters) {
    const rows = await this.scopedExportRows(actorUserId, filters);
    const ministry = filters.ministryScope ?? 'ALL';
    const content = this.toCsv(rows);
    await this.logExport(actorUserId, 'FINANCE_EXPORT_CSV', { ministry, rows: rows.length });
    return {
      filename: `finance-${ministry.toLowerCase()}-${this.dateStamp()}.csv`,
      content,
      mimeType: 'text/csv',
    };
  }

  async exportMinistryPdf(actorUserId: string, filters: FinanceExportFilters) {
    const rows = await this.scopedExportRows(actorUserId, filters);
    const ministry = filters.ministryScope ?? 'ALL';
    const lines = [
      `Ministry: ${ministry}`,
      `Generated: ${new Date().toISOString()}`,
      `Records: ${rows.length}`,
      '',
      ...rows.slice(0, 80).map(
        (r) =>
          `${r.date} | ${r.kind} | ${r.type} | ${r.amount} | ${r.status} | ${r.label}`,
      ),
    ];
    const buffer = await this.buildPdf('Ministry Finance Export', lines);
    await this.logExport(actorUserId, 'FINANCE_EXPORT_PDF', { ministry, rows: rows.length });
    return {
      filename: `finance-${ministry.toLowerCase()}-${this.dateStamp()}.pdf`,
      buffer,
      mimeType: 'application/pdf',
    };
  }

  async exportMemberContributionsCsv(actorUserId: string) {
    const data = await this.financeGovernance.memberContributions(actorUserId);
    const rows = data.history.map((h) => ({
      date: h.date,
      ministry: h.ministryScope,
      type: h.contributionType,
      amount: h.amount,
      status: h.status,
      receiptUrl: h.receiptUrl ?? '',
    }));
    const content = this.toCsv(rows);
    await this.logExport(actorUserId, 'MEMBER_CONTRIBUTIONS_EXPORT_CSV', {
      rows: rows.length,
    });
    return {
      filename: `my-contributions-${this.dateStamp()}.csv`,
      content,
      mimeType: 'text/csv',
    };
  }

  async exportMemberContributionsPdf(actorUserId: string) {
    const data = await this.financeGovernance.memberContributions(actorUserId);
    const lines = [
      `Total contributed: ${data.summary.totalContributed}`,
      `Outstanding: ${data.summary.outstandingBalance}`,
      `Consistency: ${data.summary.consistencyRate}%`,
      '',
      ...data.history.slice(0, 60).map(
        (h) =>
          `${h.date} | ${h.ministryScope} | ${h.contributionType} | ${h.amount} | ${h.status}`,
      ),
    ];
    const buffer = await this.buildPdf('My Contributions', lines);
    await this.logExport(actorUserId, 'MEMBER_CONTRIBUTIONS_EXPORT_PDF', {
      rows: data.history.length,
    });
    return {
      filename: `my-contributions-${this.dateStamp()}.pdf`,
      buffer,
      mimeType: 'application/pdf',
    };
  }

  private async scopedExportRows(
    actorUserId: string,
    filters: FinanceExportFilters,
  ) {
    const ctx = await this.financeGovernance.scopeForUser(actorUserId);
    const scopes = filters.ministryScope
      ? ctx.ministryScopes.filter((s) => s === filters.ministryScope)
      : ctx.ministryScopes;

    if (!scopes.length) {
      throw new ForbiddenException('No finance export scope for this actor');
    }
    if (
      filters.ministryScope &&
      !canAccessMinistryFinance(ctx, filters.ministryScope)
    ) {
      throw new ForbiddenException('Cannot export this ministry');
    }

    const scopeWhere = ministryScopeFilter(scopes);
    const dateWhere: Prisma.FinanceTransactionWhereInput = {};
    if (filters.from || filters.to) {
      dateWhere.transactionDate = {};
      if (filters.from) dateWhere.transactionDate.gte = new Date(filters.from);
      if (filters.to) dateWhere.transactionDate.lte = new Date(filters.to);
    }

    if (filters.memberId) {
      if (ctx.memberId && filters.memberId !== ctx.memberId) {
        const canViewOthers =
          ctx.canManageChoir ||
          ctx.canManageProtocol ||
          ctx.canApproveChoir ||
          ctx.canApproveProtocol;
        if (!canViewOthers) {
          throw new ForbiddenException('Cannot export another member');
        }
      }
    }

    const memberFilter = filters.memberId
      ? { memberId: filters.memberId }
      : {};

    const [transactions, dues] = await Promise.all([
      this.prisma.financeTransaction.findMany({
        where: { ...scopeWhere, ...dateWhere, ...memberFilter },
        orderBy: { transactionDate: 'desc' },
        take: 500,
      }),
      this.prisma.memberDues.findMany({
        where: { ...scopeWhere, ...memberFilter },
        orderBy: { updatedAt: 'desc' },
        take: 500,
        include: {
          member: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const txRows = transactions.map((t) => ({
      date: t.transactionDate.toISOString().slice(0, 10),
      kind: 'transaction',
      type: t.type,
      amount: Number(t.amount),
      status: t.approvalStatus,
      label: t.description ?? t.category,
      receiptUrl: t.receiptUrl ?? '',
      memberName: t.memberId ?? '',
    }));

    const dueRows = dues.map((d) => ({
      date: d.updatedAt.toISOString().slice(0, 10),
      kind: 'dues',
      type: d.dueType,
      amount: Number(d.amountDue ?? d.amount),
      status: d.status,
      label: d.period,
      receiptUrl: '',
      memberName: d.member
        ? `${d.member.firstName} ${d.member.lastName}`
        : '',
    }));

    return [...txRows, ...dueRows].sort((a, b) => b.date.localeCompare(a.date));
  }

  private toCsv(data: Record<string, unknown>[]) {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  }

  private buildPdf(title: string, lines: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(18).text(title, { underline: true });
      doc.moveDown();
      doc.fontSize(10);
      for (const line of lines) doc.text(line);
      doc.end();
    });
  }

  private async logExport(
    userId: string,
    action: string,
    meta: Record<string, unknown>,
  ) {
    await this.audit.log({
      userId,
      action,
      entity: 'FinanceExport',
      entityId: 'export',
      newValue: meta as Prisma.InputJsonValue,
    });
  }

  private dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }
}
