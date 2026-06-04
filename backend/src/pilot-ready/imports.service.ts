import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ImportJobType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { MemberNumberService } from '../members/member-number.service';
import { ChoirContextService } from '../choirs/choir-context.service';
import { PILOT_READY_AUDIT } from './pilot-ready.constants';
import { parseImportFile } from './import-xlsx.util';
import { buildImportPreview } from './import-preview.build';
import { ImportConfirmHandlers } from './import-confirm.handlers';

export type ImportConflictStrategy = 'SKIP' | 'REPLACE' | 'MERGE' | 'MANUAL_REVIEW';

export type ImportPreview = {
  validRows: Array<Record<string, unknown>>;
  invalidRows: Array<{ row: number; errors: string[]; data: Record<string, string> }>;
  duplicateRows: Array<{ row: number; reason: string; data: Record<string, string> }>;
  conflictRows: Array<{ row: number; reason: string; data: Record<string, string> }>;
  warningRows: Array<{ row: number; warning: string; data: Record<string, string> }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    conflicts: number;
    warnings: number;
  };
};

export type ImportResultsReport = {
  applied: Array<{ row: number; memberId?: string; entityId?: string; entityType?: string }>;
  failed: Array<{ row: number; error: string }>;
  skipped: Array<{ row: number; reason: string }>;
  conflictStrategy: ImportConflictStrategy;
  appliedCount: number;
  failedCount: number;
  skippedCount: number;
  report: {
    type: ImportJobType;
    generatedAt: string;
    summary: ImportPreview['summary'];
  };
};

@Injectable()
export class ImportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private confirmHandlers: ImportConfirmHandlers,
  ) {}

  private async assertImport(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_IMPORT_MANAGE) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_USERS_MANAGE)
    ) {
      throw new ForbiddenException('Denied');
    }
    return resolved;
  }

  async createPreview(
    actorUserId: string,
    type: ImportJobType,
    fileName: string,
    mimeType: string,
    content: string | Buffer,
  ) {
    await this.assertImport(actorUserId);
    const isCsv =
      mimeType.includes('csv') ||
      mimeType.includes('text/plain') ||
      fileName.endsWith('.csv');
    const isXlsx =
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls');
    if (!isCsv && !isXlsx) {
      throw new BadRequestException('Upload CSV or XLSX files only.');
    }

    const buffer = Buffer.isBuffer(content)
      ? content
      : Buffer.from(content, isXlsx ? 'base64' : 'utf8');
    const parsed = parseImportFile(fileName, mimeType, buffer);
    const preview = await buildImportPreview(this.prisma, type, parsed);

    const job = await this.prisma.importJob.create({
      data: {
        type,
        status: 'PREVIEWING',
        fileName,
        mimeType,
        uploadedById: actorUserId,
        preview: preview as unknown as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: PILOT_READY_AUDIT.IMPORT_PREVIEW,
      entity: 'ImportJob',
      entityId: job.id,
      newValue: { type, summary: preview.summary } as Prisma.InputJsonValue,
    });

    return job;
  }

  async cancel(actorUserId: string, id: string) {
    await this.assertImport(actorUserId);
    const job = await this.prisma.importJob.findUniqueOrThrow({ where: { id } });
    if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
      throw new BadRequestException('Import cannot be cancelled');
    }
    return this.prisma.importJob.update({
      where: { id },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });
  }

  async getResults(actorUserId: string, id: string) {
    await this.assertImport(actorUserId);
    const job = await this.prisma.importJob.findUniqueOrThrow({ where: { id } });
    const preview = job.preview as ImportPreview | null;
    const results = job.results as ImportResultsReport | null;
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      preview,
      results,
      report: results?.report ?? null,
      errorMessage: job.errorMessage,
      completedAt: job.completedAt,
    };
  }

  async list(actorUserId: string) {
    await this.assertImport(actorUserId);
    return this.prisma.importJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { uploadedBy: { select: { email: true } } },
    });
  }

  async get(actorUserId: string, id: string) {
    await this.assertImport(actorUserId);
    return this.prisma.importJob.findUniqueOrThrow({
      where: { id },
      include: { uploadedBy: { select: { email: true } } },
    });
  }

  async confirm(
    actorUserId: string,
    id: string,
    options?: { conflictStrategy?: ImportConflictStrategy },
  ) {
    await this.assertImport(actorUserId);
    const job = await this.prisma.importJob.findUniqueOrThrow({ where: { id } });
    if (job.status !== 'PREVIEWING') {
      throw new BadRequestException('Import is not awaiting confirmation');
    }

    await this.prisma.importJob.update({
      where: { id },
      data: { status: 'RUNNING' },
    });

    const preview = job.preview as ImportPreview | null;
    if (!preview) {
      throw new BadRequestException(`Import type ${job.type} has no preview data`);
    }

    const strategy = options?.conflictStrategy ?? 'SKIP';

    try {
      const applyResult = await this.confirmHandlers.confirm(
        job.type,
        preview,
        strategy,
        actorUserId,
      );

      const results: ImportResultsReport = {
        applied: applyResult.applied,
        failed: applyResult.failed,
        skipped: applyResult.skipped,
        conflictStrategy: strategy,
        appliedCount: applyResult.applied.length,
        failedCount: applyResult.failed.length,
        skippedCount: applyResult.skipped.length,
        report: {
          type: job.type,
          generatedAt: new Date().toISOString(),
          summary: preview.summary,
        },
      };

      const updated = await this.prisma.importJob.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          results: results as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      await this.audit.log({
        userId: actorUserId,
        action: PILOT_READY_AUDIT.IMPORT_CONFIRMED,
        entity: 'ImportJob',
        entityId: id,
        newValue: results as unknown as Prisma.InputJsonValue,
      });

      return updated;
    } catch (err) {
      await this.prisma.importJob.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorMessage: err instanceof Error ? err.message : 'Import failed',
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }
}
