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
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
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
import { ProtocolOfficerSlaService } from './protocol-officer-sla.service';
import { ProtocolDocumentsService } from './protocol-documents.service';
import { ProtocolMemberRecognitionService } from './protocol-member-recognition.service';
import { ProtocolRankingCategory } from '@prisma/client';

@Controller('protocol')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
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
    private officerSla: ProtocolOfficerSlaService,
    private documents: ProtocolDocumentsService,
    private recognition: ProtocolMemberRecognitionService,
  ) {}

  @Get('documents')
  @RequireUiCapability('protocol-view')
  listDocuments(@CurrentUser('sub') userId: string) {
    return this.documents.list(userId);
  }

  @Get('dashboard/team-leader')
  @RequireUiCapability('protocol-team-leadership')
  teamLeaderDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.teamLeaderSummary(userId);
  }

  @Get('dashboard')
  @RequireUiCapability('protocol-view')
  leaderDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.leaderSummary(userId);
  }

  @Get('dashboard/admin')
  @RequireUiCapability('protocol-admin-hub')
  adminDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.adminSummary(userId);
  }

  @Get('dashboard/officer-sla')
  @RequireUiCapability('protocol-rankings-oversight')
  officerSlaDashboard(@CurrentUser('sub') userId: string) {
    return this.officerSla.getOfficerSla(userId);
  }

  @Get('dashboard/me')
  @RequireUiCapability('protocol-view')
  memberDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.memberSummary(userId);
  }

  @Get('recognition/me')
  @RequireUiCapability('protocol-view')
  myRecognition(@CurrentUser('sub') userId: string) {
    return this.recognition.getMyRecognition(userId);
  }

  @Get('my-statistics')
  @RequireUiCapability('protocol-view')
  myStatistics(@CurrentUser('sub') userId: string) {
    return this.members.myStatistics(userId);
  }

  @Get('my-ranking')
  @RequireUiCapability('protocol-view')
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
  @RequireUiCapability('protocol-view')
  listTeamLeaders(@CurrentUser('sub') userId: string) {
    return this.teamLeaders.list(userId);
  }

  @Get('team-leaders/:id')
  @RequireUiCapability('protocol-team-leader-manage')
  getTeamLeader(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.teamLeaders.get(userId, id);
  }

  @Post('team-leaders')
  @RequireUiCapability('protocol-team-leader-manage')
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
  @RequireUiCapability('protocol-team-leader-manage')
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
  @RequireUiCapability('protocol-manage')
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
  @RequireUiCapability('protocol-view')
  recommendTeamLeader(@Param('teamId') teamId: string) {
    return this.teamLeaders.recommendForTeam(teamId);
  }

  @Get('backups')
  @RequireUiCapability('protocol-view')
  listBackups(@Query('teamId') teamId: string, @CurrentUser('sub') userId: string) {
    return this.teams.getBackups(userId, teamId);
  }

  @Post('teams/:teamId/backups/regenerate')
  @RequireUiCapability('protocol-manage')
  regenerateBackups(
    @CurrentUser('sub') userId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.teams.regenerateBackups(userId, teamId);
  }

  @Get('occurrences/:occurrenceId/low-participation')
  @RequireUiCapability('protocol-view')
  lowParticipation(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.teams.lowParticipationRecommendations(userId, occurrenceId);
  }

  @Get('reports')
  @RequireUiCapability('protocol-report-team-ops')
  listReports(@CurrentUser('sub') userId: string) {
    return this.teamReports.list(userId);
  }

  @Post('reports')
  @RequireUiCapability('protocol-report-team-ops')
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
  @RequireUiCapability('protocol-report-team-ops')
  getTeamReport(
    @CurrentUser('sub') userId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.teamReports.getForTeam(userId, teamId);
  }

  @Get('rankings/categories')
  @RequireUiCapability('protocol-rankings-oversight')
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
  @RequireUiCapability('protocol-view')
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
  @RequireUiCapability('protocol-view')
  getTeam(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.teams.getTeam(userId, id);
  }

  @Get('occurrences')
  @RequireUiCapability('protocol-view')
  listTeamOccurrences(@CurrentUser('sub') userId: string) {
    return this.teams.listTeamOccurrences(userId);
  }

  @Post('teams/generate')
  @RequireUiCapability('protocol-team-manage')
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
  @RequireUiCapability('protocol-team-approve-publish')
  transitionTeam(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { status: ProtocolOccurrenceTeamStatus },
  ) {
    return this.teams.transitionStatus(userId, id, body.status);
  }

  @Get('occurrences/:occurrenceId/team')
  @RequireUiCapability('protocol-team-leadership')
  teamForOccurrence(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.teams.getTeamByOccurrence(userId, occurrenceId);
  }

  @Get('occurrences/:occurrenceId/recommendations')
  @RequireUiCapability('protocol-view')
  recommendations(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.teams.recommendations(userId, occurrenceId);
  }

  @Get('members')
  @RequireUiCapability('protocol-view')
  listMembers(@CurrentUser('sub') userId: string) {
    return this.members.listProfiles(userId);
  }

  @Get('members/:memberId')
  @RequireUiCapability('protocol-view')
  getMember(
    @CurrentUser('sub') userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.members.getProfile(userId, memberId);
  }

  @Get('members/:memberId/attendance')
  @RequireUiCapability('protocol-view')
  memberAttendance(
    @CurrentUser('sub') userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.attendance.memberHistory(userId, memberId);
  }

  @Post('attendance')
  @RequireUiCapability('protocol-attendance-manage')
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
  @RequireUiCapability('protocol-attendance-manage')
  teamAttendance(
    @CurrentUser('sub') userId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.attendance.listForTeam(userId, teamId);
  }

  @Get('attendance/history')
  @RequireUiCapability('protocol-view')
  myAttendance(@CurrentUser('sub') userId: string) {
    return this.attendance.myHistory(userId);
  }

  @Get('replacements')
  @RequireUiCapability('protocol-replacement-manage')
  pendingReplacements(@CurrentUser('sub') userId: string) {
    return this.replacements.listPending(userId);
  }

  @Post('replacements')
  @RequireUiCapability('protocol-replacement-manage')
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
  @RequireUiCapability('protocol-replacement-manage')
  reviewReplacement(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { status: ProtocolReplacementStatus },
  ) {
    return this.replacements.review(userId, id, body.status);
  }

  @Get('rankings/monthly')
  @RequireUiCapability('protocol-view')
  monthlyRankings(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.ranking.listMonthly(Number(year), Number(month));
  }

  @Get('rankings/lifetime')
  @RequireUiCapability('protocol-view')
  lifetimeRankings() {
    return this.ranking.listLifetime();
  }

  @Post('rankings/generate')
  @RequireUiCapability('protocol-rankings-oversight')
  generateRankings(
    @CurrentUser('sub') userId: string,
    @Body() body: { year: number; month: number },
  ) {
    return this.ranking.generateMonthly(userId, body.year, body.month);
  }

  @Get('settings')
  @RequireUiCapability('protocol-view')
  settings() {
    return this.quota.getSettings();
  }

  @Patch('settings')
  @RequireUiCapability('protocol-manage')
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

  @Get('reports/health')
  @RequireUiCapability('protocol-report')
  healthReport(@CurrentUser('sub') userId: string) {
    return this.reports.health(userId);
  }

  @Get('reports/health-pack.pdf')
  @RequireUiCapability('protocol-report')
  async healthPackPdf(@CurrentUser('sub') userId: string, @Res() res: Response) {
    const exported = await this.reports.exportHealthPackPdf(userId);
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Get('reports/:type/export')
  @RequireUiCapability('protocol-report')
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
  @RequireUiCapability('protocol-view')
  search(@CurrentUser('sub') userId: string, @Query('q') q: string) {
    return this.protocolSearch.search(userId, q ?? '');
  }

  @Get('reports/monthly-service')
  @RequireUiCapability('protocol-report')
  monthlyServiceReport(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.reports.monthlyServiceReport(Number(year), Number(month));
  }
}
