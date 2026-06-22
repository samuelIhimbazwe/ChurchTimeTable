import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChoirLogisticsAccessService } from './choir-logistics-access.service';

@Injectable()
export class ChoirDocumentsService {
  constructor(
    private prisma: PrismaService,
    private logisticsAccess: ChoirLogisticsAccessService,
  ) {}

  async list(userId: string, choirId?: string) {
    await this.logisticsAccess.requireViewDocuments(userId, choirId);
    return this.prisma.choirDocument.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        currentVersion: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  }

  async get(userId: string, id: string, choirId?: string) {
    await this.logisticsAccess.requireViewDocuments(userId, choirId);
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
    choirId?: string,
  ) {
    await this.logisticsAccess.requireManageDocuments(userId, choirId);

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
