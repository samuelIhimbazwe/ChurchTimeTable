import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ProtocolAttendanceOutcome,
  ProtocolOccurrenceTeamStatus,
  ProtocolReplacementStatus,
} from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions, RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { ProtocolTeamsService } from './protocol-teams.service';
import { ProtocolAttendanceService } from './protocol-attendance.service';
import { ProtocolReplacementsService } from './protocol-replacements.service';
import { ProtocolRankingService } from './protocol-ranking.service';
import { ProtocolDashboardService } from './protocol-dashboard.service';
import { ProtocolMembersService } from './protocol-members.service';
import { ProtocolReportsService } from './protocol-reports.service';
import { ServiceQuotaEngine } from './service-quota.engine';
import { ProtocolSearchService } from './protocol-search.service';
import { ProtocolTeamLeadersService } from './protocol-team-leaders.service';
import { ProtocolTeamReportsService } from './protocol-team-reports.service';
import { ProtocolRankingCategory } from '@prisma/client';

@Controller('protocol')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ProtocolController {
  constructor(
    private teams: ProtocolTeamsService,
    private attendance: ProtocolAttendanceService,
    private replacements: ProtocolReplacementsService,
    private ranking: ProtocolRankingService,
    private dashboard: ProtocolDashboardService,
    private members: ProtocolMembersService,
    private reports: ProtocolReportsService,
    private quota: ServiceQuotaEngine,
    private protocolSearch: ProtocolSearchService,
    private teamLeaders: ProtocolTeamLeadersService,
    private teamReports: ProtocolTeamReportsService,
  ) {}

  @Get('dashboard/team-leader')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
    PERMISSIONS.PROTOCOL_TEAM_HEAD,
    PERMISSIONS.PROTOCOL_MANAGE,
  )
  teamLeaderDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.teamLeaderSummary(userId);
  }

  @Get('dashboard')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_VIEW,
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  )
  leaderDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.leaderSummary(userId);
  }

  @Get('dashboard/admin')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_CLAIM_REVIEW,
    PERMISSIONS.PROTOCOL_INVITE,
    PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE,
  )
  adminDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.adminSummary(userId);
  }

  @Get('dashboard/me')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.MEMBER_READ)
  memberDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.memberSummary(userId);
  }

  @Get('my-statistics')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.MEMBER_READ)
  myStatistics(@CurrentUser('sub') userId: string) {
    return this.members.myStatistics(userId);
  }

  @Get('my-ranking')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.MEMBER_READ)
  myRanking(
    @CurrentUser('sub') userId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    return this.ranking.myRanking(
      userId,
      year ? Number(year) : now.getFullYear(),
      month ? Number(month) : now.getMonth() + 1,
    );
  }

  @Get('team-leaders')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  listTeamLeaders(@CurrentUser('sub') userId: string) {
    return this.teamLeaders.list(userId);
  }

  @Get('team-leaders/:id')
  @RequirePermissions(PERMISSIONS.PROTOCOL_TEAM_LEADER_MANAGE)
  getTeamLeader(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.teamLeaders.get(userId, id);
  }

  @Post('team-leaders')
  @RequirePermissions(PERMISSIONS.PROTOCOL_TEAM_LEADER_MANAGE)
  createTeamLeader(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      memberId: string;
      choirId?: string;
      label?: string;
      isNonChoirLeader?: boolean;
      notes?: string;
    },
  ) {
    return this.teamLeaders.create(userId, body);
  }

  @Patch('team-leaders/:id')
  @RequirePermissions(PERMISSIONS.PROTOCOL_TEAM_LEADER_MANAGE)
  updateTeamLeader(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body()
    body: {
      active?: boolean;
      label?: string;
      notes?: string;
      choirId?: string | null;
    },
  ) {
    return this.teamLeaders.update(userId, id, body);
  }

  @Post('teams/:teamId/leader')
  @RequirePermissions(PERMISSIONS.PROTOCOL_MANAGE)
  assignTeamLeader(
    @CurrentUser('sub') userId: string,
    @Param('teamId') teamId: string,
    @Body()
    body: { protocolTeamLeaderId: string; overrideReason?: string },
  ) {
    return this.teams.assignTeamLeader(
      userId,
      teamId,
      body.protocolTeamLeaderId,
      body.overrideReason,
    );
  }

  @Get('teams/:teamId/leader/recommendation')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  recommendTeamLeader(@Param('teamId') teamId: string) {
    return this.teamLeaders.recommendForTeam(teamId);
  }

  @Get('backups')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  listBackups(@Query('teamId') teamId: string, @CurrentUser('sub') userId: string) {
    return this.teams.getBackups(userId, teamId);
  }

  @Post('teams/:teamId/backups/regenerate')
  @RequirePermissions(PERMISSIONS.PROTOCOL_MANAGE)
  regenerateBackups(
    @CurrentUser('sub') userId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.teams.regenerateBackups(userId, teamId);
  }

  @Get('occurrences/:occurrenceId/low-participation')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  lowParticipation(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.teams.lowParticipationRecommendations(userId, occurrenceId);
  }

  @Get('reports')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_REPORT,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
  )
  listReports(@CurrentUser('sub') userId: string) {
    return this.teamReports.list(userId);
  }

  @Post('reports')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
    PERMISSIONS.PROTOCOL_TEAM_HEAD,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
    PERMISSIONS.PROTOCOL_MANAGE,
  )
  submitReport(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      teamId: string;
      summary: string;
      issues?: string;
      recommendations?: string;
    },
  ) {
    return this.teamReports.submit(userId, body.teamId, body);
  }

  @Get('teams/:teamId/report')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_VIEW,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
  )
  getTeamReport(
    @CurrentUser('sub') userId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.teamReports.getForTeam(userId, teamId);
  }

  @Get('rankings/categories')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_RANKING_VIEW,
    PERMISSIONS.PROTOCOL_VIEW,
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
  )
  categoryRankings(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('category') category: ProtocolRankingCategory,
  ) {
    return this.ranking.listCategoryRankings(
      Number(year),
      Number(month),
      category ?? 'OVERALL',
    );
  }

  @Get('teams')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  listTeams(
    @CurrentUser('sub') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.teams.listTeams(
      userId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('teams/:id')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  getTeam(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.teams.getTeam(userId, id);
  }

  @Get('occurrences')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_VIEW,
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  )
  listTeamOccurrences(@CurrentUser('sub') userId: string) {
    return this.teams.listTeamOccurrences(userId);
  }

  @Post('teams/generate')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  )
  generateTeam(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      occurrenceId: string;
      memberIds?: string[];
      overrideReason?: string;
    },
  ) {
    return this.teams.generateForOccurrence(userId, body.occurrenceId, body);
  }

  @Patch('teams/:id/status')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_TEAM_APPROVE,
    PERMISSIONS.PROTOCOL_TEAM_PUBLISH,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
    PERMISSIONS.PROTOCOL_MANAGE,
  )
  transitionTeam(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { status: ProtocolOccurrenceTeamStatus },
  ) {
    return this.teams.transitionStatus(userId, id, body.status);
  }

  @Get('occurrences/:occurrenceId/team')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_VIEW,
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
    PERMISSIONS.PROTOCOL_TEAM_HEAD,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
  )
  teamForOccurrence(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.teams.getTeamByOccurrence(userId, occurrenceId);
  }

  @Get('occurrences/:occurrenceId/recommendations')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_VIEW,
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  )
  recommendations(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.teams.recommendations(userId, occurrenceId);
  }

  @Get('members')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  listMembers(@CurrentUser('sub') userId: string) {
    return this.members.listProfiles(userId);
  }

  @Get('members/:memberId')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.MEMBER_READ)
  getMember(
    @CurrentUser('sub') userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.members.getProfile(userId, memberId);
  }

  @Post('attendance')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
    PERMISSIONS.PROTOCOL_TEAM_HEAD,
    PERMISSIONS.PROTOCOL_MANAGE,
  )
  recordAttendance(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      teamMemberId: string;
      outcome: ProtocolAttendanceOutcome;
      notes?: string;
    },
  ) {
    return this.attendance.record(
      userId,
      body.teamMemberId,
      body.outcome,
      body.notes,
    );
  }

  @Get('teams/:teamId/attendance')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE)
  teamAttendance(
    @CurrentUser('sub') userId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.attendance.listForTeam(userId, teamId);
  }

  @Get('attendance/history')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.MEMBER_READ)
  myAttendance(@CurrentUser('sub') userId: string) {
    return this.attendance.myHistory(userId);
  }

  @Get('replacements')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_REPLACEMENT_MANAGE,
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_TEAM_HEAD,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
    PERMISSIONS.PROTOCOL_VIEW,
  )
  pendingReplacements(@CurrentUser('sub') userId: string) {
    return this.replacements.listPending(userId);
  }

  @Post('replacements')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_VIEW,
    PERMISSIONS.PROTOCOL_REPLACEMENT_MANAGE,
  )
  createReplacement(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      teamMemberId: string;
      replacementMemberId: string;
      reason?: string;
    },
  ) {
    return this.replacements.createRequest(userId, body);
  }

  @Patch('replacements/:id')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_REPLACEMENT_MANAGE,
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_TEAM_HEAD,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
  )
  reviewReplacement(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { status: ProtocolReplacementStatus },
  ) {
    return this.replacements.review(userId, id, body.status);
  }

  @Get('rankings/monthly')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_RANKING_VIEW)
  monthlyRankings(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.ranking.listMonthly(Number(year), Number(month));
  }

  @Get('rankings/lifetime')
  @RequirePermissions(PERMISSIONS.PROTOCOL_RANKING_VIEW)
  lifetimeRankings() {
    return this.ranking.listLifetime();
  }

  @Post('rankings/generate')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_MANAGE,
    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  )
  generateRankings(
    @CurrentUser('sub') userId: string,
    @Body() body: { year: number; month: number },
  ) {
    return this.ranking.generateMonthly(userId, body.year, body.month);
  }

  @Get('settings')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  settings() {
    return this.quota.getSettings();
  }

  @Patch('settings')
  @RequirePermissions(PERMISSIONS.PROTOCOL_MANAGE)
  updateSettings(
    @Body()
    body: {
      maxOfficialServicesPerMonth?: number;
      maxNonChoirMembers?: number;
      backupPoolSize?: number;
      membersCanViewFullRanking?: boolean;
    },
  ) {
    return this.quota.updateSettings(body);
  }

  @Get('reports/:type/export')
  @RequirePermissions(PERMISSIONS.PROTOCOL_REPORT)
  exportReport(
    @CurrentUser('sub') userId: string,
    @Param('type') type: string,
    @Query('year') year: string | undefined,
    @Query('month') month: string | undefined,
    @Res() res: Response,
  ) {
    return this.reports.exportCsv(userId, type, res, {
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
    });
  }

  @Get('search')
  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE)
  search(@CurrentUser('sub') userId: string, @Query('q') q: string) {
    return this.protocolSearch.search(userId, q ?? '');
  }

  @Get('reports/monthly-service')
  @RequirePermissions(PERMISSIONS.PROTOCOL_REPORT)
  monthlyServiceReport(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.reports.monthlyServiceReport(Number(year), Number(month));
  }
}
