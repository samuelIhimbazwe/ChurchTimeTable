import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

@Injectable()
export class RemindersDashboardService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertView(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_READINESS_VIEW) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_SETTINGS_MANAGE)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async dashboard(actorUserId: string) {
    await this.assertView(actorUserId);

    const rules = await this.prisma.notificationRule.findMany({
      orderBy: { trigger: 'asc' },
    });

    const jobKeys = ['REHEARSAL_TOMORROW', 'EVENT_REMINDER'] as const;
    const executions = await Promise.all(
      jobKeys.map(async (jobKey) => {
        const last = await this.prisma.reminderJobRun.findFirst({
          where: { jobKey },
          orderBy: { lastRunAt: 'desc' },
        });
        return { jobKey, last };
      }),
    );

    const recentDeliveries = await this.prisma.notificationDeliveryLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: { recipient: { select: { email: true } } },
    });

    const failures = await this.prisma.notificationDeliveryLog.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { recipient: { select: { email: true } } },
    });

    const failureCount7d = await this.prisma.notificationDeliveryLog.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    });

    return {
      enabledRules: rules.filter((r) => r.enabled),
      disabledRules: rules.filter((r) => !r.enabled),
      executions: executions.map(({ jobKey, last }) => ({
        jobKey,
        trigger: last?.trigger ?? null,
        lastExecution: last?.lastRunAt ?? null,
        nextExecution: last?.nextRunAt ?? null,
        status: last?.status ?? null,
        recipients: last?.recipientCount ?? 0,
        failureMessage: last?.failureMessage ?? null,
      })),
      recentDeliveries,
      failures,
      failureCount7d,
    };
  }
}
