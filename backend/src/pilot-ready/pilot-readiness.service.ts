import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

export type PilotReadinessIndicator = {
  key: string;
  label: string;
  ready: boolean;
  count: number;
  target?: number;
};

@Injectable()
export class PilotReadinessService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertView(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_READINESS_VIEW) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.CHURCH_INTELLIGENCE_VIEW) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_USERS_VIEW)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async indicators(actorUserId: string) {
    await this.assertView(actorUserId);

    const [
      members,
      choirs,
      protocolUnit,
      occurrences,
      broadcasts,
      notifications,
      assets,
      ministries,
      completedImports,
      rules,
    ] = await Promise.all([
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.choir.count({ where: { isActive: true, isPublicJoinable: true } }),
      this.prisma.operationalUnit.findFirst({ where: { code: 'PROTOCOL_TEAM' } }),
      this.prisma.operationOccurrence.count({
        where: { status: { in: ['PUBLISHED', 'APPROVED'] } },
      }),
      this.prisma.churchBroadcast.count(),
      this.prisma.notification.count(),
      this.prisma.asset.count({ where: { status: 'ACTIVE' } }),
      this.prisma.ministry.count({ where: { isActive: true } }),
      this.prisma.importJob.count({ where: { status: 'COMPLETED' } }),
      this.prisma.notificationRule.count({ where: { enabled: true } }),
    ]);

    let protocolMembers = 0;
    if (protocolUnit) {
      protocolMembers = await this.prisma.operationalUnitMembership.count({
        where: { operationalUnitId: protocolUnit.id, status: 'ACTIVE' },
      });
    }

    const items: PilotReadinessIndicator[] = [
      {
        key: 'membersImported',
        label: 'Members imported',
        ready: members >= 5,
        count: members,
        target: 5,
      },
      {
        key: 'choirsConfigured',
        label: 'Choirs configured',
        ready: choirs >= 2,
        count: choirs,
        target: 2,
      },
      {
        key: 'protocolConfigured',
        label: 'Protocol configured',
        ready: protocolMembers >= 3,
        count: protocolMembers,
        target: 3,
      },
      {
        key: 'schedulesCreated',
        label: 'Schedules created',
        ready: occurrences >= 1,
        count: occurrences,
        target: 1,
      },
      {
        key: 'broadcastsConfigured',
        label: 'Broadcasts configured',
        ready: broadcasts >= 0,
        count: broadcasts,
      },
      {
        key: 'notificationsWorking',
        label: 'Notifications working',
        ready: notifications > 0 && rules > 0,
        count: notifications,
      },
      {
        key: 'assetsConfigured',
        label: 'Assets configured',
        ready: assets >= 0,
        count: assets,
      },
      {
        key: 'ministriesActive',
        label: 'Ministries active',
        ready: ministries >= 1,
        count: ministries,
        target: 1,
      },
      {
        key: 'importsCompleted',
        label: 'Data imports completed',
        ready: completedImports >= 0,
        count: completedImports,
      },
    ];

    const score =
      items.filter((i) => i.ready).length / Math.max(items.length, 1);

    return {
      indicators: items,
      readinessScore: Math.round(score * 100),
      pilotReady: score >= 0.7,
    };
  }
}
