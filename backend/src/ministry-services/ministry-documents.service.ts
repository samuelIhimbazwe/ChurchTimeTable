import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { hasGlobalMinistryManage } from '../ministries/ministry-access.util';
import { NotificationsService } from '../notifications/notifications.service';
import { MinistryActivityService } from './ministry-activity.service';
import { MINISTRY_SERVICES_AUDIT, MINISTRY_ACTIVITY_ENTITY } from './ministry-services.constants';
import {
  assertMinistryServicesAccess,
  assertMinistrySetting,
  notifyMinistryMembers,
} from './ministry-services.util';

@Injectable()
export class MinistryDocumentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private access: MinistryAccessService,
    private activity: MinistryActivityService,
    private notifications: NotificationsService,
  ) {}

  async list(actorUserId: string, ministryId: string) {
    await assertMinistryServicesAccess(this.access, actorUserId, ministryId);
    return this.prisma.ministryDocument.findMany({
      where: { ministryId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      include: {
        currentVersion: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  }

  async get(actorUserId: string, id: string) {
    const doc = await this.prisma.ministryDocument.findUnique({
      where: { id },
      include: {
        currentVersion: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    await assertMinistryServicesAccess(this.access, actorUserId, doc.ministryId);
    return doc;
  }

  async upload(
    actorUserId: string,
    dto: {
      ministryId: string;
      title: string;
      description?: string;
      category?: string;
      fileName: string;
      fileUrl: string;
      mimeType?: string;
      fileSize?: number;
      changeNotes?: string;
    },
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalMinistryManage(actor.permissions)) {
      throw new ForbiddenException('Document upload denied');
    }
    await assertMinistrySetting(this.prisma, dto.ministryId, 'allowDocuments');

    const doc = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ministryDocument.create({
        data: {
          ministryId: dto.ministryId,
          title: dto.title.trim(),
          description: dto.description,
          category: (dto.category as never) ?? 'OTHER',
          uploadedByUserId: actorUserId,
        },
      });
      const version = await tx.ministryDocumentVersion.create({
        data: {
          documentId: created.id,
          versionNumber: 1,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
          changeNotes: dto.changeNotes,
          uploadedByUserId: actorUserId,
        },
      });
      return tx.ministryDocument.update({
        where: { id: created.id },
        data: { currentVersionId: version.id },
        include: { currentVersion: true, versions: true },
      });
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_SERVICES_AUDIT.DOCUMENT_UPLOADED,
      entity: MINISTRY_ACTIVITY_ENTITY.DOCUMENT,
      entityId: doc.id,
      newValue: { title: doc.title, fileUrl: dto.fileUrl },
    });
    await this.activity.record({
      ministryId: dto.ministryId,
      type: 'DOCUMENT_UPLOADED',
      actorUserId,
      entityType: MINISTRY_ACTIVITY_ENTITY.DOCUMENT,
      entityId: doc.id,
      summary: doc.title,
    });
    await notifyMinistryMembers(
      this.prisma,
      this.notifications,
      dto.ministryId,
      NotificationType.MINISTRY_DOCUMENT,
      'New ministry document',
      doc.title,
      { documentId: doc.id, ministryId: dto.ministryId },
    );

    return doc;
  }

  async addVersion(
    actorUserId: string,
    documentId: string,
    dto: {
      fileName: string;
      fileUrl: string;
      mimeType?: string;
      fileSize?: number;
      changeNotes?: string;
    },
  ) {
    const doc = await this.get(actorUserId, documentId);
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalMinistryManage(actor.permissions)) {
      throw new ForbiddenException('Document version denied');
    }

    const latest = await this.prisma.ministryDocumentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await this.prisma.ministryDocumentVersion.create({
      data: {
        documentId,
        versionNumber,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        changeNotes: dto.changeNotes,
        uploadedByUserId: actorUserId,
      },
    });

    return this.prisma.ministryDocument.update({
      where: { id: documentId },
      data: { currentVersionId: version.id },
      include: { currentVersion: true, versions: { orderBy: { versionNumber: 'desc' } } },
    });
  }

  async archive(actorUserId: string, id: string) {
    const doc = await this.get(actorUserId, id);
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalMinistryManage(actor.permissions)) {
      throw new ForbiddenException('Document archive denied');
    }

    const archived = await this.prisma.ministryDocument.update({
      where: { id },
      data: { isArchived: true },
    });

    await this.activity.record({
      ministryId: doc.ministryId,
      type: 'DOCUMENT_ARCHIVED',
      actorUserId,
      entityType: MINISTRY_ACTIVITY_ENTITY.DOCUMENT,
      entityId: id,
      summary: doc.title,
    });

    return archived;
  }
}
