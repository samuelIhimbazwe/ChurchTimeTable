import { ForbiddenException, Injectable } from '@nestjs/common';
import { MemberStatus, MinistryScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { WelfareService } from '../welfare/welfare.service';
import { MusicService } from '../music/music.service';
import { RehearsalsService } from '../rehearsals/rehearsals.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class ChoirReportsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private welfare: WelfareService,
    private music: MusicService,
    private rehearsals: RehearsalsService,
    private reports: ReportsService,
  ) {}

  private async assertChoirReportsAccess(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    const allowed =
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_WELFARE_VIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_WELFARE_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_MUSIC_VIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_MUSIC_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_REHEARSAL_VIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_REHEARSAL_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE);
    if (!allowed) {
      throw new ForbiddenException('Not allowed');
    }
    return resolved;
  }

  async summary(userId: string) {
    await this.assertChoirReportsAccess(userId);

    const [membersByStatus, leadershipCount, welfare, music, rehearsal] =
      await Promise.all([
        this.prisma.member.groupBy({
          by: ['status'],
          where: { ministry: { in: [MinistryScope.CHOIR, MinistryScope.BOTH] } },
          _count: true,
        }),
        this.prisma.familyLeadershipHistory.count({
          where: { endedAt: null },
        }),
        this.safeWelfareReports(userId),
        this.safeMusicAnalytics(userId),
        this.safeRehearsalAnalytics(userId),
      ]);

    return {
      membership: {
        byStatus: membersByStatus.map((row) => ({
          status: row.status,
          count: row._count,
        })),
        total: membersByStatus.reduce((sum, row) => sum + row._count, 0),
      },
      leadership: { activeAssignments: leadershipCount },
      welfare,
      music,
      rehearsals: rehearsal,
    };
  }

  private async safeWelfareReports(userId: string) {
    try {
      return await this.welfare.getReports(userId);
    } catch {
      return null;
    }
  }

  private async safeMusicAnalytics(userId: string) {
    try {
      return await this.music.analytics(userId);
    } catch {
      return null;
    }
  }

  private async safeRehearsalAnalytics(userId: string) {
    try {
      return await this.rehearsals.analytics(userId);
    } catch {
      return null;
    }
  }

  async exportSummaryPdf(userId: string) {
    const data = await this.summary(userId);
    const lines = [
      `Members: ${data.membership.total}`,
      `Leadership roles: ${data.leadership.activeAssignments}`,
      data.welfare
        ? `Welfare active cases: ${data.welfare.summary.activeCases}`
        : 'Welfare: restricted',
      data.music ? `Songs: ${data.music.totalSongs}` : 'Music: restricted',
      data.rehearsals
        ? `Rehearsal readiness avg: ${data.rehearsals.averageReadiness}%`
        : 'Rehearsals: restricted',
    ];
    const buffer = await this.reports.exportPdf('Choir Reports Summary', lines);
    return {
      filename: `choir-reports-${new Date().toISOString().slice(0, 10)}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    };
  }

  async exportSummaryCsv(userId: string) {
    const data = await this.summary(userId);
    const lines = [
      'section,metric,value',
      `membership,total,${data.membership.total}`,
      `leadership,active,${data.leadership.activeAssignments}`,
    ];
    if (data.welfare) {
      lines.push(
        `welfare,active_cases,${data.welfare.summary.activeCases}`,
        `welfare,contributions,${data.welfare.summary.totalContributions}`,
      );
    }
    return {
      filename: `choir-reports-${new Date().toISOString().slice(0, 10)}.csv`,
      mimeType: 'text/csv',
      content: lines.join('\n'),
    };
  }
}
