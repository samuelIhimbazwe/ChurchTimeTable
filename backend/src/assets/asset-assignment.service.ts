import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetAssignmentTargetType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssetAccessService } from './asset-access.service';
import { canAssignAssets } from './asset-access.util';
import { AssetActivityService } from './asset-activity.service';
import { ASSET_AUDIT_ACTIONS, ASSET_AUDIT_ENTITY } from './assets.constants';

@Injectable()
export class AssetAssignmentService {
  constructor(
    private prisma: PrismaService,
    private access: AssetAccessService,
    private audit: AuditService,
    private activity: AssetActivityService,
  ) {}

  private assertAssign(permissions: string[]) {
    if (!canAssignAssets(permissions)) {
      throw new ForbiddenException('Asset assignment denied');
    }
  }

  async listActive(actorUserId: string, assetId: string) {
    await this.access.assertCanViewAsset(actorUserId, assetId);
    return this.prisma.assetAssignment.findMany({
      where: { assetId, returnedAt: null },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async history(actorUserId: string, assetId: string) {
    await this.access.assertCanViewAsset(actorUserId, assetId);
    return this.prisma.assetAssignment.findMany({
      where: { assetId },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async overdue(actorUserId: string) {
    const where = await this.access.visibleAssetWhere(actorUserId);
    const now = new Date();
    return this.prisma.assetAssignment.findMany({
      where: {
        returnedAt: null,
        expectedReturnAt: { lt: now },
        asset: where,
      },
      include: {
        asset: { select: { id: true, code: true, name: true } },
      },
      orderBy: { expectedReturnAt: 'asc' },
    });
  }

  async assign(
    actorUserId: string,
    assetId: string,
    dto: {
      assignedToType: AssetAssignmentTargetType;
      assignedToId: string;
      purpose?: string;
      expectedReturnAt?: string;
      notes?: string;
    },
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    this.assertAssign(actor.permissions);
    await this.access.assertCanViewAsset(actorUserId, assetId);

    const row = await this.prisma.assetAssignment.create({
      data: {
        assetId,
        assignedToType: dto.assignedToType,
        assignedToId: dto.assignedToId,
        purpose: dto.purpose,
        expectedReturnAt: dto.expectedReturnAt
          ? new Date(dto.expectedReturnAt)
          : null,
        notes: dto.notes,
      },
    });

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { status: 'IN_USE' },
    });

    await this.audit.log({
      userId: actorUserId,
      action: ASSET_AUDIT_ACTIONS.ASSIGNED,
      entity: ASSET_AUDIT_ENTITY,
      entityId: assetId,
      newValue: { assignmentId: row.id, assignedToId: row.assignedToId },
    });
    await this.activity.record(assetId, 'ASSIGNED', actorUserId, {
      assignmentId: row.id,
    });
    return row;
  }

  async return(actorUserId: string, assetId: string, assignmentId: string, notes?: string) {
    const actor = await this.access.resolveActor(actorUserId);
    this.assertAssign(actor.permissions);

    const assignment = await this.prisma.assetAssignment.findFirst({
      where: { id: assignmentId, assetId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.returnedAt) {
      throw new BadRequestException('Assignment already returned');
    }

    const row = await this.prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: { returnedAt: new Date(), notes: notes ?? assignment.notes },
    });

    const open = await this.prisma.assetAssignment.count({
      where: { assetId, returnedAt: null },
    });
    if (open === 0) {
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { status: 'ACTIVE' },
      });
    }

    await this.audit.log({
      userId: actorUserId,
      action: ASSET_AUDIT_ACTIONS.RETURNED,
      entity: ASSET_AUDIT_ENTITY,
      entityId: assetId,
      newValue: row,
    });
    await this.activity.record(assetId, 'RETURNED', actorUserId, {
      assignmentId: row.id,
    });
    return row;
  }

  async transfer(
    actorUserId: string,
    assetId: string,
    assignmentId: string,
    dto: {
      assignedToType: AssetAssignmentTargetType;
      assignedToId: string;
      purpose?: string;
      expectedReturnAt?: string;
      notes?: string;
    },
  ) {
    await this.return(actorUserId, assetId, assignmentId, 'Transferred');
    const row = await this.assign(actorUserId, assetId, dto);
    await this.activity.record(assetId, 'TRANSFERRED', actorUserId, row);
    await this.audit.log({
      userId: actorUserId,
      action: ASSET_AUDIT_ACTIONS.TRANSFERRED,
      entity: ASSET_AUDIT_ENTITY,
      entityId: assetId,
      newValue: row,
    });
    return row;
  }
}
