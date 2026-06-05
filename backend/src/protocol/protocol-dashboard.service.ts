import { Injectable } from '@nestjs/common';
import { ProtocolRankingCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { ProtocolMembersService } from './protocol-members.service';
import { ProtocolRankingService } from './protocol-ranking.service';
import { ProtocolTeamLeadersService } from './protocol-team-leaders.service';
import { hasProtocolManage, hasProtocolTeamLeaderExecute } from './protocol-access.util';

@Injectable()
export class ProtocolDashboardService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private members: ProtocolMembersService,
    private ranking: ProtocolRankingService,
    private teamLeaders: ProtocolTeamLeadersService,
  ) {}

  async leaderSummary(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [
      upcomingTeams,
      pendingReplacements,
      profiles,
      recentTeams,
      teamLeadersList,
      teamReports,
      lowParticipation,
    ] = await Promise.all([
      this.prisma.protocolOccurrenceTeam.count({
        where: {
          status: { in: ['GENERATED', 'REVIEWED', 'APPROVED', 'PUBLISHED'] },
          occurrence: { startAt: { gte: now, lte: in30 } },
        },
      }),
      this.prisma.protocolReplacementRequest.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.protocolMemberProfile.findMany({
        where: { active: true },
        orderBy: { totalServicesMonth: 'desc' },
        take: 5,
        include: {
          member: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.protocolOccurrenceTeam.findMany({
        where: { occurrence: { startAt: { gte: now } } },
        take: 5,
        orderBy: { generatedAt: 'asc' },
        include: {
          occurrence: { select: { title: true, startAt: true } },
          members: { select: { id: true } },
          teamLeaders: { take: 1 },
        },
      }),
      this.prisma.protocolTeamLeader.findMany({
        where: { active: true },
        include: {
          member: { select: { firstName: true, lastName: true } },
          choir: { select: { name: true } },
        },
      }),
      this.prisma.protocolTeamReport.findMany({
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: {
          team: {
            include: {
              occurrence: { select: { title: true } },
            },
          },
        },
      }),
      this.prisma.protocolMemberProfile.findMany({
        where: { active: true },
        orderBy: { totalServicesMonth: 'asc' },
        take: 10,
        include: {
          member: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const categories: ProtocolRankingCategory[] = [
      'ATTENDANCE',
      'RELIABILITY',
      'SERVICE_COUNT',
      'REPLACEMENT_SUPPORT',
      'TEAMWORK',
      'OVERALL',
    ];
    const categoryRankings = await Promise.all(
      categories.map(async (category) => ({
        category,
        top: (await this.ranking.listCategoryRankings(year, month, category)).slice(
          0,
          5,
        ),
      })),
    );

    const needsFollowUp = await this.prisma.protocolMemberProfile.findMany({
      where: {
        active: true,
        OR: [{ unexcusedAbsences: { gt: 0 } }, { attendanceRate: { lt: 70 } }],
      },
      take: 10,
      include: {
        member: { select: { firstName: true, lastName: true } },
      },
    });

    const backupPool = await this.prisma.protocolOccurrenceTeamBackup.findMany({
      where: {
        team: {
          occurrence: { startAt: { gte: now } },
        },
      },
      take: 20,
      include: {
        member: { select: { firstName: true, lastName: true } },
        team: {
          include: {
            occurrence: { select: { title: true } },
          },
        },
      },
    });

    const avgAttendance =
      profiles.length > 0
        ? profiles.reduce((s, p) => s + p.attendanceRate, 0) / profiles.length
        : 0;

    return {
      upcomingTeams,
      pendingReplacements,
      attendanceRate: Math.round(avgAttendance * 10) / 10,
      mostActive: profiles,
      mostReliable: [...profiles]
        .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
        .slice(0, 5),
      needsFollowUp,
      upcomingAssignments: recentTeams,
      teamLeaders: teamLeadersList,
      categoryRankings,
      lowParticipationMembers: lowParticipation,
      backupPool,
      teamReports,
      canViewFullRanking: await this.members.canViewFullRanking(
        resolved.permissions,
      ),
    };
  }

  async teamLeaderSummary(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!hasProtocolTeamLeaderExecute(resolved.permissions)) {
      const teams = await this.teamLeaders.myTeams(actorUserId);
      if (teams.length === 0 && !hasProtocolManage(resolved.permissions)) {
        return { teams: [], pendingReplacements: [], reports: [] };
      }
    }

    const teams = await this.teamLeaders.myTeams(actorUserId);
    const teamIds = teams.map((t) => t.id);
    const pendingReplacements =
      teamIds.length > 0
        ? await this.prisma.protocolReplacementRequest.findMany({
            where: {
              status: 'PENDING',
              teamMember: { teamId: { in: teamIds } },
            },
            take: 20,
          })
        : [];

    const reports =
      teamIds.length > 0
        ? await this.prisma.protocolTeamReport.findMany({
            where: { teamId: { in: teamIds } },
            orderBy: { submittedAt: 'desc' },
          })
        : [];

    return { teams, pendingReplacements, reports };
  }

  async memberSummary(actorUserId: string) {
    const dash = await this.members.myDashboard(actorUserId);
    const stats = await this.members.myStatistics(actorUserId);
    const now = new Date();
    const ranking = await this.ranking.myRanking(
      actorUserId,
      now.getFullYear(),
      now.getMonth() + 1,
    );
    return { ...dash, statistics: stats, ranking };
  }
}
