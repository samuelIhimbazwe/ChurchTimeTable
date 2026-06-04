import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { assertChoirOpsManage, assertChoirOpsView } from './choir-operations.util';

@Injectable()
export class ChoirDocumentsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async list(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(resolved.permissions, PERMISSIONS.CHOIR_DOCUMENT_MANAGE);
    return this.prisma.choirDocument.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        currentVersion: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  }

  async get(userId: string, id: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(resolved.permissions, PERMISSIONS.CHOIR_DOCUMENT_MANAGE);
    const row = await this.prisma.choirDocument.findUnique({
      where: { id },
      include: {
        currentVersion: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!row) throw new NotFoundException('Not found');
    return row;
  }

  async create(
    userId: string,
    dto: {
      title: string;
      category?: string;
      description?: string;
      fileName: string;
      fileUrl: string;
      mimeType?: string;
    },
  ) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsManage(resolved.permissions, PERMISSIONS.CHOIR_DOCUMENT_MANAGE);

    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.choirDocument.create({
        data: {
          title: dto.title,
          category: (dto.category as never) ?? 'OTHER',
          description: dto.description,
          createdByUserId: userId,
        },
      });
      const version = await tx.choirDocumentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          mimeType: dto.mimeType,
          uploadedByUserId: userId,
        },
      });
      return tx.choirDocument.update({
        where: { id: doc.id },
        data: { currentVersionId: version.id },
        include: { currentVersion: true, versions: true },
      });
    });
  }
}
