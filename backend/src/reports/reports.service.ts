import { Injectable } from '@nestjs/common';
import { MinistryScope, Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { ParticipationRecordsService } from '../common/participation/participation-records.service';
import type { ParticipationScoreInput } from '../common/participation/participation-records.service';
import { ParticipationScoringService } from '../common/participation/participation-scoring.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private participationRecords: ParticipationRecordsService,
    private participationScoring: ParticipationScoringService,
  ) {}

  async participationSummary(from?: string, to?: string, ministryScope?: string) {
    const since = from ? new Date(from) : undefined;
    const until = to ? new Date(to) : undefined;
    const ministry =
      ministryScope && ministryScope !== 'ALL'
        ? (ministryScope as MinistryScope)
        : ('ALL' as const);

    const records = await this.participationRecords.fetchRecords({
      since,
      until,
      ministry,
    });

    const byStatus = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
    };

    for (const record of records) {
      if (
        record.operationalStatus === 'ATTENDED' ||
        record.operationalStatus === 'REPLACEMENT_SERVED'
      ) {
        byStatus.PRESENT += 1;
      } else if (record.operationalStatus === 'LATE') {
        byStatus.LATE += 1;
      } else {
        byStatus.ABSENT += 1;
      }
    }

    return {
      total: records.length,
      byStatus,
      excused: records.filter((r) => r.operationalStatus === 'EXCUSED_ABSENCE')
        .length,
    };
  }

  /** @deprecated Use participationSummary */
  async attendanceSummary(from?: string, to?: string, ministryScope?: string) {
    return this.participationSummary(from, to, ministryScope);
  }

  async disciplineSummary(ministryScope?: string) {
    const where: Prisma.DisciplineCaseWhereInput = {};
    if (ministryScope && ministryScope !== 'ALL') {
      where.ministry = ministryScope as MinistryScope;
    }
    const cases = await this.prisma.disciplineCase.findMany({ where });
    const byStage: Record<string, number> = {};
    for (const c of cases) {
      byStage[c.stage] = (byStage[c.stage] ?? 0) + 1;
    }
    return { total: cases.length, byStage };
  }

  async financeSummary() {
    const txs = await this.prisma.financeTransaction.findMany();
    let income = 0;
    let expense = 0;
    for (const t of txs) {
      const amt = Number(t.amount);
      if (t.type === 'INCOME') income += amt;
      else expense += amt;
    }
    return { income, expense, balance: income - expense };
  }

  async protocolQuotaCompliance(month?: string) {
    const ref = month ? new Date(`${month}-01`) : new Date();
    const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59);

    const assignments = await this.prisma.operationAssignment.findMany({
      where: {
        assignmentType: 'PROTOCOL_TEAM',
        occurrence: {
          startAt: { gte: monthStart, lte: monthEnd },
        },
        memberId: { not: null },
      },
      include: { member: true },
    });

    const counts: Record<string, { name: string; count: number }> = {};
    for (const a of assignments) {
      if (!a.memberId || !a.member) continue;
      if (!counts[a.memberId]) {
        counts[a.memberId] = {
          name: `${a.member.firstName} ${a.member.lastName}`,
          count: 0,
        };
      }
      counts[a.memberId].count++;
    }

    const members = Object.entries(counts).map(([memberId, v]) => ({
      memberId,
      name: v.name,
      servicesThisMonth: v.count,
      compliant: v.count <= 3,
    }));

    return {
      month: `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`,
      members,
      violations: members.filter((m) => !m.compliant),
    };
  }

  exportCsv(data: Record<string, unknown>[], filename: string) {
    if (!data.length) {
      return { filename, content: '', mimeType: 'text/csv' };
    }
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
    );
    const content = [headers.join(','), ...rows].join('\n');
    return { filename, content, mimeType: 'text/csv' };
  }

  async exportPdf(title: string, lines: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(title, { underline: true });
      doc.moveDown();
      doc.fontSize(11);
      for (const line of lines) {
        doc.text(line);
      }
      doc.end();
    });
  }

  async buildAttendancePdf(from?: string, to?: string) {
    const summary = await this.participationSummary(from, to);
    const lines = [
      `Generated: ${new Date().toISOString()}`,
      `Total records: ${summary.total}`,
      `Present: ${summary.byStatus.PRESENT}`,
      `Absent: ${summary.byStatus.ABSENT}`,
      `Late: ${summary.byStatus.LATE}`,
      `Excused: ${summary.excused}`,
    ];
    return this.exportPdf('Participation Summary Report', lines);
  }

  async buildFinancePdf() {
    const summary = await this.financeSummary();
    const lines = [
      `Generated: ${new Date().toISOString()}`,
      `Income: ${summary.income}`,
      `Expense: ${summary.expense}`,
      `Balance: ${summary.balance}`,
    ];
    return this.exportPdf('Finance Summary Report', lines);
  }

  async responsibilityScoreTrends(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const records = await this.participationRecords.fetchRecords({ since });
    const weights = await this.participationScoring.getWeights();
    const byMonth = new Map<string, ParticipationScoreInput[]>();

    for (const record of records) {
      const key = `${record.recordedAt.getFullYear()}-${String(record.recordedAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byMonth.get(key) ?? [];
      bucket.push({
        operationalStatus: record.operationalStatus,
        voluntaryExtra: record.voluntaryExtra,
      });
      byMonth.set(key, bucket);
    }

    return [...byMonth.entries()].map(([month, monthRecords]) => ({
      month,
      score: this.participationScoring.scoreRecords(monthRecords, weights),
    }));
  }

  async buildDisciplinePdf() {
    const summary = await this.disciplineSummary();
    const lines = [
      `Generated: ${new Date().toISOString()}`,
      `Total cases: ${summary.total}`,
      ...Object.entries(summary.byStage).map(([stage, count]) => `${stage}: ${count}`),
    ];
    return this.exportPdf('Discipline Summary Report', lines);
  }

  async buildProtocolQuotaPdf(month?: string) {
    const summary = await this.protocolQuotaCompliance(month);
    const lines = [
      `Generated: ${new Date().toISOString()}`,
      `Month: ${summary.month}`,
      `Members tracked: ${summary.members.length}`,
      `Violations: ${summary.violations.length}`,
      ...summary.members.map(
        (m) => `${m.name}: ${m.servicesThisMonth} services (${m.compliant ? 'ok' : 'over quota'})`,
      ),
    ];
    return this.exportPdf('Protocol Quota Compliance Report', lines);
  }
}
