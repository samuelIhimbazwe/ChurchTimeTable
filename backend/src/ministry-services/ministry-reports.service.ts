import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { MinistryDashboardService } from './ministry-dashboard.service';
import { MINISTRY_SERVICES_AUDIT } from './ministry-services.constants';
import { assertMinistryServicesAccess } from './ministry-services.util';

@Injectable()
export class MinistryReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private access: MinistryAccessService,
    private dashboard: MinistryDashboardService,
  ) {}

  async summary(actorUserId: string, ministryId: string) {
    const dash = await this.dashboard.getDashboard(actorUserId, ministryId);
    const ministry = await this.prisma.ministry.findUniqueOrThrow({
      where: { id: ministryId },
    });
    return {
      ministry: { id: ministry.id, code: ministry.code, name: ministry.name },
      generatedAt: new Date().toISOString(),
      metrics: dash,
    };
  }

  async exportCsv(actorUserId: string, ministryId: string) {
    const data = await this.summary(actorUserId, ministryId);
    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_SERVICES_AUDIT.REPORT_EXPORTED,
      entity: 'Ministry',
      entityId: ministryId,
      newValue: { format: 'csv' },
    });

    const rows = [
      ['metric', 'value'],
      ['members', String(data.metrics.members)],
      ['operationalUnits', String(data.metrics.operationalUnits)],
      ['leaders', String(data.metrics.leaders)],
      ['announcements', String(data.metrics.announcements)],
      ['documents', String(data.metrics.documents)],
      ['meetings', String(data.metrics.meetings)],
      ['newMembers30d', String(data.metrics.growthMetrics.newMembersLast30Days)],
    ];
    const body = rows.map((r) => r.join(',')).join('\n');
    return {
      filename: `ministry-${data.ministry.code}-summary.csv`,
      mimeType: 'text/csv',
      body,
    };
  }

  async exportPdf(actorUserId: string, ministryId: string) {
    const data = await this.summary(actorUserId, ministryId);
    await assertMinistryServicesAccess(this.access, actorUserId, ministryId);
    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_SERVICES_AUDIT.REPORT_EXPORTED,
      entity: 'Ministry',
      entityId: ministryId,
      newValue: { format: 'pdf' },
    });

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50 });
    doc.on('data', (c) => chunks.push(c as Buffer));

    await new Promise<void>((resolve, reject) => {
      doc.on('end', () => resolve());
      doc.on('error', reject);
      doc.fontSize(18).text(`${data.ministry.name} — Ministry Report`);
      doc.moveDown();
      doc.fontSize(12).text(`Members: ${data.metrics.members}`);
      doc.text(`Operational units: ${data.metrics.operationalUnits}`);
      doc.text(`Leaders: ${data.metrics.leaders}`);
      doc.text(`Announcements: ${data.metrics.announcements}`);
      doc.text(`Documents: ${data.metrics.documents}`);
      doc.text(`Meetings: ${data.metrics.meetings}`);
      doc.end();
    });

    return {
      filename: `ministry-${data.ministry.code}-summary.pdf`,
      mimeType: 'application/pdf',
      body: Buffer.concat(chunks),
    };
  }
}
