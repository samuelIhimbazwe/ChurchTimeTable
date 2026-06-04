import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import type {
  DeploymentReadinessIndicator,
  DeploymentReadinessLevel,
} from './deployment-readiness.types';

@Injectable()
export class DeploymentReadinessService {
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

  private toLevel(score: number, setupCompleted: boolean): DeploymentReadinessLevel {
    if (score >= 90 && setupCompleted) return 'LIVE_READY';
    if (score >= 75 && setupCompleted) return 'PILOT_READY';
    if (score >= 55) return 'READY';
    if (score >= 30) return 'PARTIAL';
    return 'NOT_READY';
  }

  async score(actorUserId: string) {
    await this.assertView(actorUserId);

    const config = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });

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
      enabledRules,
      leadershipRoles,
      deliveryLogs,
      recentReminderRun,
    ] = await Promise.all([
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.choir.count({ where: { isActive: true } }),
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
      this.prisma.userRole.count({
        where: {
          role: {
            name: {
              in: [
                'SUPER_ADMIN',
                'CHURCH_ADMIN',
                'CHOIR_PRESIDENT',
                'PROTOCOL_LEADER',
              ],
            },
          },
        },
      }),
      this.prisma.notificationDeliveryLog.count({ where: { status: 'SENT' } }),
      this.prisma.reminderJobRun.findFirst({
        where: {
          jobKey: { in: ['REHEARSAL_TOMORROW', 'EVENT_REMINDER'] },
          status: 'SUCCESS',
          lastRunAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        orderBy: { lastRunAt: 'desc' },
      }),
    ]);

    let protocolMembers = 0;
    if (protocolUnit) {
      protocolMembers = await this.prisma.operationalUnitMembership.count({
        where: { operationalUnitId: protocolUnit.id, status: 'ACTIVE' },
      });
    }

    const leadershipConfigured =
      leadershipRoles >= 2 ||
      (config?.leadership != null &&
        typeof config.leadership === 'object' &&
        Object.keys(config.leadership as object).length > 0);

    const indicators: DeploymentReadinessIndicator[] = [
      {
        key: 'leadershipConfigured',
        label: 'Leadership configured',
        ready: leadershipConfigured,
        count: leadershipRoles,
        target: 2,
      },
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
        ready: choirs >= 1,
        count: choirs,
        target: 1,
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
        key: 'notificationsActive',
        label: 'Notifications active',
        ready: enabledRules >= 3,
        count: enabledRules,
        target: 3,
      },
      {
        key: 'assetsImported',
        label: 'Assets imported',
        ready: assets >= 0,
        count: assets,
      },
      {
        key: 'broadcastsConfigured',
        label: 'Broadcasts configured',
        ready: broadcasts >= 0,
        count: broadcasts,
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
        ready: completedImports >= 1,
        count: completedImports,
        target: 1,
      },
      {
        key: 'importUiReady',
        label: 'Import UI ready',
        ready: true,
        count: 1,
        target: 1,
      },
      {
        key: 'reminderJobsActive',
        label: 'Reminder jobs active',
        ready: !!recentReminderRun,
        count: recentReminderRun ? 1 : 0,
        target: 1,
      },
      {
        key: 'notificationLogsActive',
        label: 'Notification logs active',
        ready: deliveryLogs >= 0,
        count: deliveryLogs,
      },
      {
        key: 'e2ePassing',
        label: 'E2E passing',
        ready:
          (config?.goLiveE2eVerified ?? false) ||
          process.env.CMMS_E2E_VERIFIED === 'true',
        count: config?.goLiveE2eVerified ? 1 : 0,
        target: 1,
      },
    ];

    const readinessScore = Math.round(
      (indicators.filter((i) => i.ready).length / indicators.length) * 100,
    );
    const setupCompleted = config?.setupCompleted ?? false;
    const level = this.toLevel(readinessScore, setupCompleted);

    return {
      indicators,
      readinessScore,
      level,
      setupCompleted,
      setupStep: config?.setupStep ?? 0,
      pilotReady: level === 'PILOT_READY' || level === 'LIVE_READY',
      liveReady: level === 'LIVE_READY',
      notificationsDelivered: notifications,
    };
  }
}
