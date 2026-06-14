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
import { ChoirExecutiveDashboardService } from '../choirs/choir-executive-dashboard.service';

export type ChoirHealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type ChoirParticipationHealth = {
  memberCount: number;
  averageParticipation: number;
  membersAtRisk: number;
  serviceRateAvg: number;
};

export type ChoirHealthSnapshot = {
  choirId: string | null;
  score: number;
  grade: ChoirHealthGrade;
  participation: ChoirParticipationHealth | null;
  factors: {
    participationComponent: number;
    welfarePenalty: number;
    officerAttentionPenalty: number;
  };
  officerAttentionCount: number | null;
  welfareActiveCases: number | null;
  generatedAt: string;
};

@Injectable()
export class ChoirReportsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private welfare: WelfareService,
    private music: MusicService,
    private rehearsals: RehearsalsService,
    private reports: ReportsService,
    private executiveDashboard: ChoirExecutiveDashboardService,
  ) {}

  private async assertChoirReportsAccess(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    const allowed =
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_REPORTS_VIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPS_REPORT) ||
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

  private gradeFromScore(score: number): ChoirHealthGrade {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  private async participationHealth(choirId: string): Promise<ChoirParticipationHealth> {
    const profiles = await this.prisma.choirMemberParticipationProfile.findMany({
      where: { choirId },
    });
    const memberCount = profiles.length;
    const averageParticipation =
      memberCount > 0
        ? profiles.reduce((sum, profile) => sum + profile.overallParticipationScore, 0) /
          memberCount
        : 0;
    const membersAtRisk = profiles.filter((profile) => profile.unexcusedAbsences > 2).length;
    const serviceRateAvg =
      memberCount > 0
        ? profiles.reduce((sum, profile) => sum + profile.serviceAttendanceRate, 0) /
          memberCount
        : 0;

    return {
      memberCount,
      averageParticipation: Math.round(averageParticipation * 10) / 10,
      membersAtRisk,
      serviceRateAvg: Math.round(serviceRateAvg * 10) / 10,
    };
  }

  async health(userId: string, choirId?: string): Promise<ChoirHealthSnapshot> {
    await this.assertChoirReportsAccess(userId);

    const participation = choirId ? await this.participationHealth(choirId) : null;
    const welfare = await this.safeWelfareReports(userId);
    const welfareActiveCases = welfare?.summary?.activeCases ?? null;

    let officerAttentionCount: number | null = null;
    if (choirId) {
      try {
        const sla = await this.executiveDashboard.getOfficerSla(userId, choirId);
        officerAttentionCount = sla.totals.attentionCount;
      } catch {
        officerAttentionCount = null;
      }
    }

    const participationComponent = participation
      ? Math.min(
          100,
          Math.round(
            participation.averageParticipation <= 10
              ? participation.averageParticipation * 10
              : participation.averageParticipation,
          ),
        )
      : 70;

    const welfarePenalty = welfareActiveCases != null
      ? Math.min(welfareActiveCases * 2, 15)
      : 0;
    const officerAttentionPenalty =
      officerAttentionCount != null ? Math.min(officerAttentionCount * 5, 20) : 0;
    const riskPenalty =
      participation && participation.memberCount > 0
        ? Math.round((participation.membersAtRisk / participation.memberCount) * 15)
        : 0;

    const score = Math.max(
      0,
      Math.min(
        100,
        participationComponent - welfarePenalty - officerAttentionPenalty - riskPenalty,
      ),
    );

    return {
      choirId: choirId ?? null,
      score,
      grade: this.gradeFromScore(score),
      participation,
      factors: {
        participationComponent,
        welfarePenalty,
        officerAttentionPenalty: officerAttentionPenalty + riskPenalty,
      },
      officerAttentionCount,
      welfareActiveCases,
      generatedAt: new Date().toISOString(),
    };
  }

  async summary(userId: string, choirId?: string) {
    await this.assertChoirReportsAccess(userId);

    const membershipWhere = choirId
      ? {
          familyMembership: {
            family: { choirId },
          },
        }
      : { ministry: { in: [MinistryScope.CHOIR, MinistryScope.BOTH] } };

    const [membersByStatus, leadershipCount, welfare, music, rehearsal, health] =
      await Promise.all([
        this.prisma.member.groupBy({
          by: ['status'],
          where: membershipWhere,
          _count: true,
        }),
        choirId
          ? this.prisma.familyLeadershipHistory.count({
              where: {
                endedAt: null,
                family: { choirId },
              },
            })
          : this.prisma.familyLeadershipHistory.count({
              where: { endedAt: null },
            }),
        this.safeWelfareReports(userId),
        this.safeMusicAnalytics(userId),
        this.safeRehearsalAnalytics(userId),
        choirId ? this.health(userId, choirId) : null,
      ]);

    return {
      choirId: choirId ?? null,
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
      health,
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

  async exportSummaryPdf(userId: string, choirId?: string) {
    const data = await this.summary(userId, choirId);
    const lines = [
      choirId ? `Choir scope: ${choirId}` : 'Scope: all choir ministry members',
      `Members: ${data.membership.total}`,
      `Leadership roles: ${data.leadership.activeAssignments}`,
      data.health
        ? `Choir health score: ${data.health.score} (${data.health.grade})`
        : 'Choir health: not scoped',
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

  async exportHealthPackPdf(userId: string, choirId: string) {
    const data = await this.summary(userId, choirId);
    const health = data.health ?? await this.health(userId, choirId);
    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { name: true },
    });

    const lines = [
      `Choir: ${choir?.name ?? choirId}`,
      `Generated: ${health.generatedAt}`,
      '',
      `Unified health score: ${health.score} (grade ${health.grade})`,
      `Participation component: ${health.factors.participationComponent}`,
      `Welfare penalty: ${health.factors.welfarePenalty}`,
      `Risk / officer penalty: ${health.factors.officerAttentionPenalty}`,
      '',
      health.participation
        ? [
            `Members tracked: ${health.participation.memberCount}`,
            `Average participation: ${health.participation.averageParticipation}`,
            `Members at risk: ${health.participation.membersAtRisk}`,
            `Service attendance avg: ${health.participation.serviceRateAvg}%`,
          ].join('\n')
        : 'Participation: no profiles',
      '',
      `Membership total: ${data.membership.total}`,
      `Active leadership assignments: ${data.leadership.activeAssignments}`,
      data.welfare
        ? `Welfare active cases: ${data.welfare.summary.activeCases}`
        : 'Welfare: restricted',
      data.music ? `Songs in library: ${data.music.totalSongs}` : 'Music: restricted',
      data.rehearsals
        ? `Rehearsal readiness: ${data.rehearsals.averageReadiness}%`
        : 'Rehearsals: restricted',
      health.officerAttentionCount != null
        ? `Officer queues needing attention: ${health.officerAttentionCount}`
        : 'Officer SLA: restricted',
    ];

    const buffer = await this.reports.exportPdf(
      `Choir health pack — ${choir?.name ?? 'Choir'}`,
      lines,
    );
    return {
      filename: `choir-health-pack-${new Date().toISOString().slice(0, 10)}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    };
  }

  async exportSummaryCsv(userId: string, choirId?: string) {
    const data = await this.summary(userId, choirId);
    const lines = [
      'section,metric,value',
      `membership,total,${data.membership.total}`,
      `leadership,active,${data.leadership.activeAssignments}`,
    ];
    if (data.health) {
      lines.push(
        `health,score,${data.health.score}`,
        `health,grade,${data.health.grade}`,
      );
    }
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
