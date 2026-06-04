import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { AuditService } from '../audit/audit.service';
import { PILOT_READY_AUDIT } from './pilot-ready.constants';
import type { Prisma } from '@prisma/client';

@Injectable()
export class ExportCenterService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private audit: AuditService,
  ) {}

  private async assertExport(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_EXPORT) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.REPORT_EXPORT) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.MEMBER_READ)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async exportCsv(actorUserId: string, type: string) {
    await this.assertExport(actorUserId);
    let rows: string[][] = [];
    let filename = 'export.csv';

    switch (type) {
      case 'members':
        filename = 'members.csv';
        rows = [
          ['id', 'memberNumber', 'firstName', 'lastName', 'email', 'phone', 'status'],
          ...(await this.prisma.member.findMany({
            include: { user: { select: { email: true } } },
            orderBy: { lastName: 'asc' },
          })).map((m) => [
            m.id,
            m.memberNumber ?? '',
            m.firstName,
            m.lastName,
            m.user.email,
            m.phone ?? '',
            m.status,
          ]),
        ];
        break;
      case 'choirs':
        filename = 'choirs.csv';
        rows = [
          ['id', 'code', 'name', 'kind', 'active'],
          ...(await this.prisma.choir.findMany()).map((c) => [
            c.id,
            c.code,
            c.name,
            c.choirKind,
            String(c.isActive),
          ]),
        ];
        break;
      default:
        throw new ForbiddenException(`Export type ${type} not available`);
    }

    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    await this.audit.log({
      userId: actorUserId,
      action: PILOT_READY_AUDIT.EXPORT,
      entity: 'Export',
      newValue: { type, format: 'csv' } as Prisma.InputJsonValue,
    });

    return { filename, mimeType: 'text/csv', content: csv };
  }

  async exportPdf(actorUserId: string, type: string) {
    const csv = await this.exportCsv(actorUserId, type);
    await this.audit.log({
      userId: actorUserId,
      action: PILOT_READY_AUDIT.EXPORT,
      entity: 'Export',
      newValue: { type, format: 'pdf' } as Prisma.InputJsonValue,
    });
    return {
      filename: `${type}.pdf`,
      mimeType: 'application/pdf',
      content: Buffer.from(
        `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%% CMMS export: ${type}\n${csv.content}`,
      ).toString('base64'),
      encoding: 'base64',
      note: 'Lightweight PDF placeholder — use domain report endpoints for full PDFs',
    };
  }

  async exportExcel(actorUserId: string, type: string) {
    const csv = await this.exportCsv(actorUserId, type);
    await this.audit.log({
      userId: actorUserId,
      action: PILOT_READY_AUDIT.EXPORT,
      entity: 'Export',
      newValue: { type, format: 'xlsx' } as Prisma.InputJsonValue,
    });
    return {
      filename: `${type}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      content: csv.content,
      note: 'Excel-compatible CSV until native xlsx writer is added',
    };
  }

  listAvailable(actorUserId: string) {
    return this.assertExport(actorUserId).then(() => ({
      types: [
        { id: 'members', formats: ['csv', 'pdf', 'xlsx'] },
        { id: 'choirs', formats: ['csv', 'pdf', 'xlsx'] },
        { id: 'protocol', formats: ['csv', 'pdf'], note: 'Use protocol reports API' },
        { id: 'schedules', formats: ['csv', 'pdf'], note: 'Use operations reports API' },
        { id: 'attendance', formats: ['csv', 'pdf'] },
        { id: 'rankings', formats: ['csv', 'pdf'] },
        { id: 'reports', formats: ['csv', 'pdf', 'xlsx'] },
        { id: 'assets', formats: ['csv', 'pdf'] },
        { id: 'finance', formats: ['csv', 'pdf'], note: 'Governance scoped' },
      ],
    }));
  }
}
