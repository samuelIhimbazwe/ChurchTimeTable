import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from '../reports/reports.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { hasOperationsReport } from './operations-access.util';
import { OPERATIONS_AUDIT, OPERATIONS_AUDIT_ENTITY } from './operations.constants';

@Injectable()
export class OperationsReportsService {
  constructor(
    private prisma: PrismaService,
    private permissionsResolver: PermissionsResolver,
    private reports: ReportsService,
    private audit: AuditService,
  ) {}

  async catalog(actorUserId: string) {
    await this.assertReport(actorUserId);
    return [
      { id: 'operations', title: 'Operation Reports' },
      { id: 'assignments', title: 'Assignment Reports' },
      { id: 'choir-utilization', title: 'Choir Utilization' },
      { id: 'protocol-utilization', title: 'Protocol Utilization' },
      { id: 'conflicts', title: 'Conflict Reports' },
      { id: 'publications', title: 'Publication Reports' },
    ];
  }

  async generate(actorUserId: string, reportId: string) {
    await this.assertReport(actorUserId);
    switch (reportId) {
      case 'operations':
        return this.prisma.operationOccurrence.findMany({
          include: { template: true, assignments: true },
          orderBy: { startAt: 'desc' },
          take: 100,
        });
      case 'assignments':
        return this.prisma.operationAssignment.findMany({
          include: { occurrence: true, operationalUnit: true },
          orderBy: { createdAt: 'desc' },
          take: 200,
        });
      case 'choir-utilization':
        return this.utilization('MAIN_CHOIR');
      case 'protocol-utilization':
        return this.utilization('PROTOCOL_TEAM');
      case 'conflicts':
        return { note: 'Run per-occurrence conflict endpoint for details' };
      case 'publications':
        return this.prisma.operationOccurrence.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
        });
      default:
        return [];
    }
  }

  async exportCsv(actorUserId: string, reportId: string, res: Response) {
    const data = await this.generate(actorUserId, reportId);
    const rows = Array.isArray(data) ? data : [data];
    const header = rows.length ? Object.keys(rows[0] as object).join(',') : 'data';
    const body = rows
      .map((r) =>
        Object.values(r as object)
          .map((v) => JSON.stringify(v ?? ''))
          .join(','),
      )
      .join('\n');
    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONS_AUDIT.REPORT_EXPORTED,
      entity: OPERATIONS_AUDIT_ENTITY,
      entityId: reportId,
      newValue: { format: 'csv' },
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportId}.csv"`);
    res.send(`${header}\n${body}`);
  }

  async exportPdf(actorUserId: string, reportId: string, res: Response) {
    const data = await this.generate(actorUserId, reportId);
    const buffer = await this.reports.exportPdf(
      reportId,
      JSON.stringify(data, null, 2).split('\n').slice(0, 50),
    );
    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONS_AUDIT.REPORT_EXPORTED,
      entity: OPERATIONS_AUDIT_ENTITY,
      entityId: reportId,
      newValue: { format: 'pdf' },
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportId}.pdf"`);
    res.send(buffer);
  }

  private async utilization(assignmentType: string) {
    const assignments = await this.prisma.operationAssignment.groupBy({
      by: ['operationalUnitId'],
      where: { assignmentType: assignmentType as never },
      _count: { id: true },
    });
    const units = await this.prisma.operationalUnit.findMany({
      where: { id: { in: assignments.map((a) => a.operationalUnitId) } },
    });
    return assignments.map((a) => ({
      unit: units.find((u) => u.id === a.operationalUnitId)?.name,
      count: a._count.id,
    }));
  }

  private async assertReport(actorUserId: string) {
    const { permissions } = await this.permissionsResolver.resolveForUser(actorUserId);
    if (!hasOperationsReport(permissions)) {
      throw new ForbiddenException('Operations report access denied');
    }
  }
}
