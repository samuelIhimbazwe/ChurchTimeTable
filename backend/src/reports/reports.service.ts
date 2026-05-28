import { Injectable } from '@nestjs/common';
import { EventType } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async attendanceSummary(from?: string, to?: string) {
    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const records = await this.prisma.attendance.findMany({ where });
    const byStatus = { PRESENT: 0, ABSENT: 0, LATE: 0 };
    for (const r of records) {
      byStatus[r.physicalStatus]++;
    }

    return {
      total: records.length,
      byStatus,
      excused: records.filter((r) => r.reasonCategory === 'EXCUSED').length,
    };
  }

  async disciplineSummary() {
    const cases = await this.prisma.disciplineCase.findMany();
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

    const assignments = await this.prisma.eventAssignment.findMany({
      where: {
        event: {
          type: EventType.PROTOCOL_SERVICE,
          startTime: { gte: monthStart, lte: monthEnd },
        },
      },
      include: { member: true },
    });

    const counts: Record<string, { name: string; count: number }> = {};
    for (const a of assignments) {
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
    const summary = await this.attendanceSummary(from, to);
    const lines = [
      `Generated: ${new Date().toISOString()}`,
      `Total records: ${summary.total}`,
      `Present: ${summary.byStatus.PRESENT}`,
      `Absent: ${summary.byStatus.ABSENT}`,
      `Late: ${summary.byStatus.LATE}`,
      `Excused: ${summary.excused}`,
    ];
    return this.exportPdf('Attendance Summary Report', lines);
  }

  async buildFinancePdf() {
    const summary = await this.financeSummary();
    const lines = [
      `Income: ${summary.income}`,
      `Expense: ${summary.expense}`,
      `Balance: ${summary.balance}`,
    ];
    return this.exportPdf('Finance Summary Report', lines);
  }

  async buildDisciplinePdf() {
    const summary = await this.disciplineSummary();
    const lines = [
      `Total cases: ${summary.total}`,
      ...Object.entries(summary.byStage).map(([k, v]) => `${k}: ${v}`),
    ];
    return this.exportPdf('Discipline Summary Report', lines);
  }

  async buildProtocolQuotaPdf(month?: string) {
    const data = await this.protocolQuotaCompliance(month);
    const lines = [
      `Month: ${data.month}`,
      `Members tracked: ${data.members.length}`,
      `Violations: ${data.violations.length}`,
      ...data.violations.map(
        (v) => `${v.name}: ${v.servicesThisMonth} services`,
      ),
    ];
    return this.exportPdf('Protocol Quota Compliance Report', lines);
  }

  async responsibilityScoreTrends(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const records = await this.prisma.attendance.findMany({
      where: { createdAt: { gte: since } },
      select: {
        memberId: true,
        physicalStatus: true,
        reasonCategory: true,
        createdAt: true,
        member: { select: { firstName: true, lastName: true } },
      },
    });

    const byMemberMonth = new Map<
      string,
      { name: string; buckets: Map<string, { total: number; present: number; excused: number }> }
    >();

    for (const r of records) {
      const period = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const key = r.memberId;
      if (!byMemberMonth.has(key)) {
        byMemberMonth.set(key, {
          name: `${r.member.firstName} ${r.member.lastName}`,
          buckets: new Map(),
        });
      }
      const entry = byMemberMonth.get(key)!;
      const b = entry.buckets.get(period) ?? { total: 0, present: 0, excused: 0 };
      b.total++;
      if (r.physicalStatus === 'PRESENT' || r.physicalStatus === 'LATE') {
        b.present++;
      }
      if (r.physicalStatus === 'ABSENT' && r.reasonCategory === 'EXCUSED') {
        b.excused++;
      }
      entry.buckets.set(period, b);
    }

    return [...byMemberMonth.entries()].map(([memberId, data]) => ({
      memberId,
      name: data.name,
      trends: [...data.buckets.entries()].map(([period, b]) => ({
        period,
        totalEvents: b.total,
        attendanceRate: b.total
          ? Math.round((b.present / b.total) * 10000) / 100
          : 0,
        responsibilityScore: b.total
          ? Math.round(((b.present + b.excused) / b.total) * 10000) / 100
          : 0,
      })),
    }));
  }
}
