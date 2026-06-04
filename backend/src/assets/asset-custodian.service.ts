import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssetAccessService } from './asset-access.service';
import { canManageAssetOwnership } from './asset-access.util';
import { AssetActivityService } from './asset-activity.service';
import { ASSET_AUDIT_ACTIONS, ASSET_AUDIT_ENTITY } from './assets.constants';

@Injectable()
export class AssetCustodianService {
  constructor(
    private prisma: PrismaService,
    private access: AssetAccessService,
    private audit: AuditService,
    private activity: AssetActivityService,
  ) {}

  private assertCustodianManage(permissions: string[]) {
    if (
      !canManageAssetOwnership(permissions) &&
      !permissions.includes('asset.custodian.manage')
    ) {
      throw new ForbiddenException('Custodian management denied');
    }
  }

  async getActive(assetId: string) {
    return this.prisma.assetCustodian.findFirst({
      where: { assetId, releasedAt: null },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async history(actorUserId: string, assetId: string) {
    await this.access.assertCanViewAsset(actorUserId, assetId);
    return this.prisma.assetCustodian.findMany({
      where: { assetId },
      orderBy: { assignedAt: 'desc' },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async assign(
    actorUserId: string,
    assetId: string,
    dto: { memberId: string; notes?: string },
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    this.assertCustodianManage(actor.permissions);
    await this.access.assertCanViewAsset(actorUserId, assetId);

    const active = await this.getActive(assetId);
    if (active) {
      throw new BadRequestException('Release current custodian before assigning a new one');
    }

    const row = await this.prisma.assetCustodian.create({
      data: {
        assetId,
        memberId: dto.memberId,
        notes: dto.notes,
      },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: ASSET_AUDIT_ACTIONS.CUSTODIAN_ASSIGNED,
      entity: ASSET_AUDIT_ENTITY,
      entityId: assetId,
      newValue: row,
    });
    await this.activity.record(assetId, 'CUSTODIAN_ASSIGNED', actorUserId, {
      memberId: dto.memberId,
    });
    return row;
  }

  async transfer(
    actorUserId: string,
    assetId: string,
    dto: { memberId: string; notes?: string },
  ) {
    await this.release(actorUserId, assetId, dto.notes);
    return this.assign(actorUserId, assetId, dto);
  }

  async release(actorUserId: string, assetId: string, notes?: string) {
    const actor = await this.access.resolveActor(actorUserId);
    this.assertCustodianManage(actor.permissions);

    const active = await this.getActive(assetId);
    if (!active) throw new NotFoundException('No active custodian');

    return this.prisma.assetCustodian.update({
      where: { id: active.id },
      data: { releasedAt: new Date(), notes: notes ?? active.notes },
    });
  }
}
