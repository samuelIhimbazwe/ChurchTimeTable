import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { DeploymentReadinessService } from './deployment-readiness.service';

@Injectable()
export class GoLiveReportService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private readiness: DeploymentReadinessService,
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

  async build(actorUserId: string) {
    await this.assertView(actorUserId);
    const score = await this.readiness.score(actorUserId);
    const config = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });

    const failedChecks = score.indicators.filter((i) => !i.ready);
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!score.setupCompleted) {
      warnings.push('Church setup wizard is not marked complete.');
      recommendations.push('Finish all 7 setup steps at /dashboard/admin/deployment/setup.');
    }
    if (!score.indicators.find((i) => i.key === 'importUiReady')?.ready) {
      recommendations.push('Complete at least one import via the Import Center UI.');
    }
    if (!score.indicators.find((i) => i.key === 'reminderJobsActive')?.ready) {
      recommendations.push('Ensure reminder cron jobs have run (hourly scheduler).');
    }
    if (!score.indicators.find((i) => i.key === 'e2ePassing')?.ready) {
      recommendations.push('Run the full e2e suite against a seeded database before go-live.');
    }
    if (score.level === 'NOT_READY' || score.level === 'PARTIAL') {
      recommendations.push('Resolve failed readiness indicators before pilot launch.');
    }

    const recentFailures = await this.prisma.notificationDeliveryLog.count({
      where: { status: 'FAILED', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    });
    if (recentFailures > 0) {
      warnings.push(`${recentFailures} notification delivery failure(s) in the last 7 days.`);
    }

    return {
      generatedAt: new Date().toISOString(),
      readinessScore: score.readinessScore,
      level: score.level,
      setupCompleted: score.setupCompleted,
      pilotReady: score.pilotReady,
      liveReady: score.liveReady,
      indicators: score.indicators,
      failedChecks,
      warnings,
      recommendations,
      goLiveE2eVerified: config?.goLiveE2eVerified ?? false,
      summary:
        score.liveReady
          ? 'Church is live-ready. Proceed with pilot deployment.'
          : score.pilotReady
            ? 'Church is pilot-ready. Address warnings before full go-live.'
            : 'Church is not yet ready for pilot deployment.',
    };
  }
}
