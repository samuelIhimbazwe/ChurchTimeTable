import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionScopeService } from './contribution-scope.service';
import { toNumber } from './contribution-effective.util';

@Injectable()
export class ContributionAdjustmentsListService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
  ) {}

  async listRecent(actorUserId: string, limit = 20) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertNotChurchAdminAccountOnly(ctx);
    if (!this.scope.canViewAll(ctx)) {
      this.scope.denyHiddenFeature();
    }

    const take = Math.min(Math.max(limit, 1), 50);
    const rows = await this.prisma.contributionAdjustment.findMany({
      where: {
        contributionRecord: { member: { ministry: 'CHOIR' } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        contributionRecord: {
          select: {
            id: true,
            referenceNumber: true,
            familyId: true,
            member: {
              select: {
                id: true,
                memberNumber: true,
                firstName: true,
                lastName: true,
              },
            },
            contributionCampaign: { select: { name: true } },
          },
        },
      },
    });

    const familyIds = [
      ...new Set(
        rows
          .map((row) => row.contributionRecord.familyId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const families = familyIds.length
      ? await this.prisma.family.findMany({
          where: { id: { in: familyIds } },
          select: { id: true, familyCode: true, familyName: true },
        })
      : [];
    const familyMeta = new Map(families.map((f) => [f.id, f]));

    return {
      items: rows.map((row) => {
        const record = row.contributionRecord;
        const member = record.member;
        const family = record.familyId
          ? familyMeta.get(record.familyId)
          : undefined;
        return {
          adjustmentId: row.id,
          contributionId: record.id,
          referenceNumber: record.referenceNumber,
          adjustmentAmount: toNumber(row.adjustmentAmount),
          category: row.category,
          reason: row.reason,
          createdAt: row.createdAt,
          memberId: member.id,
          memberNumber: member.memberNumber,
          memberName: `${member.firstName} ${member.lastName}`.trim(),
          familyId: record.familyId,
          familyCode: family?.familyCode ?? null,
          familyName: family?.familyName ?? null,
          campaignName: record.contributionCampaign?.name ?? null,
        };
      }),
    };
  }
}
