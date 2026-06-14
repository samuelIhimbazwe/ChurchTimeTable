import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PROTOCOL_UNIT_CODE } from './protocol.constants';
import {
  hasProtocolManage,
  hasProtocolView,
} from './protocol-access.util';

/** Deacons ministry hosts protocol committee documents (MF-1 shelf). */
const PROTOCOL_DOCUMENTS_MINISTRY_CODE = 'DEACONS';

@Injectable()
export class ProtocolDocumentsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertDocumentAccess(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!hasProtocolView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }

    const isOfficer =
      hasProtocolManage(resolved.permissions) ||
      resolved.permissions.some((p) =>
        [
          'protocol.team.manage',
          'protocol.oversight',
          'protocol.secretary',
          'event:write',
        ].includes(p),
      );

    if (!isOfficer && resolved.memberId) {
      const unit = await this.prisma.operationalUnit.findFirst({
        where: { code: PROTOCOL_UNIT_CODE, isActive: true },
        select: { id: true },
      });
      if (!unit) throw new ForbiddenException('Protocol unit not configured');

      const membership = await this.prisma.operationalUnitMembership.findFirst({
        where: {
          memberId: resolved.memberId,
          operationalUnitId: unit.id,
          status: 'ACTIVE',
        },
      });
      if (!membership) {
        throw new ForbiddenException('Active protocol membership required');
      }
    }
  }

  async list(actorUserId: string) {
    await this.assertDocumentAccess(actorUserId);

    const ministry = await this.prisma.ministry.findFirst({
      where: { code: PROTOCOL_DOCUMENTS_MINISTRY_CODE, isActive: true },
      select: { id: true, name: true, code: true },
    });
    if (!ministry) return { ministry: null, items: [] };

    const settings = await this.prisma.ministrySettings.findUnique({
      where: { ministryId: ministry.id },
      select: { allowDocuments: true },
    });
    if (settings && !settings.allowDocuments) {
      return { ministry, items: [], documentsDisabled: true };
    }

    const rows = await this.prisma.ministryDocument.findMany({
      where: { ministryId: ministry.id, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      include: { currentVersion: true },
    });

    return {
      ministry,
      items: rows.map((doc) => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        description: doc.description,
        fileName: doc.currentVersion?.fileName,
        fileUrl: doc.currentVersion?.fileUrl,
        mimeType: doc.currentVersion?.mimeType,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    };
  }
}
