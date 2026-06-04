import { ForbiddenException, Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssetAccessService } from './asset-access.service';
import { PERMISSIONS } from '../common/constants/roles';

@Injectable()
export class AssetReportsService {
  constructor(
    private prisma: PrismaService,
    private access: AssetAccessService,
    private reports: ReportsService,
  ) {}

  private async assertReport(actorUserId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    if (
      !actor.permissions.includes(PERMISSIONS.ASSET_REPORT) &&
      !actor.permissions.includes(PERMISSIONS.ASSET_MANAGE)
    ) {
      throw new ForbiddenException('Asset reporting denied');
    }
  }

  private async scopedAssets(actorUserId: string) {
    const where = await this.access.visibleAssetWhere(actorUserId);
    return this.prisma.asset.findMany({
      where,
      include: {
        category: true,
        ownerships: true,
        assignments: { where: { returnedAt: null } },
        maintenance: { orderBy: { performedAt: 'desc' }, take: 1 },
      },
    });
  }

  async inventory(actorUserId: string) {
    await this.assertReport(actorUserId);
    const assets = await this.scopedAssets(actorUserId);
    return {
      total: assets.length,
      byStatus: this.groupCount(assets, (a) => a.status),
      byCondition: this.groupCount(assets, (a) => a.condition),
      byCategory: this.groupCount(assets, (a) => a.category.name),
      items: assets.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        status: a.status,
        condition: a.condition,
        category: a.category.name,
      })),
    };
  }

  async ownership(actorUserId: string) {
    await this.assertReport(actorUserId);
    const assets = await this.scopedAssets(actorUserId);
    return assets.map((a) => ({
      assetId: a.id,
      code: a.code,
      name: a.name,
      ownerships: a.ownerships,
    }));
  }

  async assignments(actorUserId: string) {
    await this.assertReport(actorUserId);
    const assetWhere = await this.access.visibleAssetWhere(actorUserId);
    const rows = await this.prisma.assetAssignment.findMany({
      where: { asset: assetWhere },
      include: { asset: { select: { code: true, name: true } } },
      orderBy: { assignedAt: 'desc' },
      take: 500,
    });
    return { total: rows.length, items: rows };
  }

  async maintenance(actorUserId: string) {
    await this.assertReport(actorUserId);
    const assetWhere = await this.access.visibleAssetWhere(actorUserId);
    const rows = await this.prisma.assetMaintenance.findMany({
      where: { asset: assetWhere },
      include: { asset: { select: { code: true, name: true } } },
      orderBy: { performedAt: 'desc' },
      take: 500,
    });
    return { total: rows.length, items: rows };
  }

  async losses(actorUserId: string) {
    await this.assertReport(actorUserId);
    const assetWhere = await this.access.visibleAssetWhere(actorUserId);
    return this.prisma.asset.findMany({
      where: { ...assetWhere, status: { in: ['LOST', 'DAMAGED'] } },
      select: { id: true, code: true, name: true, status: true, condition: true },
    });
  }

  async valuation(actorUserId: string) {
    await this.assertReport(actorUserId);
    const assets = await this.scopedAssets(actorUserId);
    const total = assets.reduce(
      (sum, a) => sum + Number(a.purchaseValue ?? 0),
      0,
    );
    return {
      assetCount: assets.length,
      totalPurchaseValue: total,
      items: assets.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        purchaseValue: a.purchaseValue,
      })),
    };
  }

  async exportInventoryCsv(actorUserId: string) {
    const data = await this.inventory(actorUserId);
    const lines = [
      'code,name,status,condition,category',
      ...data.items.map(
        (i) =>
          `${i.code},${escapeCsv(i.name)},${i.status},${i.condition},${escapeCsv(i.category)}`,
      ),
    ];
    return {
      filename: 'asset-inventory.csv',
      content: lines.join('\n'),
      mimeType: 'text/csv',
    };
  }

  async exportInventoryPdf(actorUserId: string) {
    const data = await this.inventory(actorUserId);
    const lines = [
      `Total assets: ${data.total}`,
      ...data.items.map((i) => `${i.code} — ${i.name} (${i.status})`),
    ];
    const buffer = await this.reports.exportPdf('Asset Inventory Report', lines);
    return {
      filename: 'asset-inventory.pdf',
      content: buffer,
      mimeType: 'application/pdf',
    };
  }

  private groupCount<T>(items: T[], keyFn: (item: T) => string) {
    const map: Record<string, number> = {};
    for (const item of items) {
      const k = keyFn(item);
      map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }
}

function escapeCsv(value: string) {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
