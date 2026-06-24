import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ChoirActivityType,
  ChoirAttendanceOutcome,
  ChoirRankingCategory,
  ChoirScheduleAdjustmentAction,
  ChoirSchedulePlanPeriod,
  ChoirServiceAssignmentRole,
} from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { ChoirActivitiesService } from './choir-activities.service';
import { ChoirServiceAssignmentsService } from './choir-service-assignments.service';
import { ChoirAttendanceService } from './choir-attendance.service';
import { ChoirSchedulePlansService } from './choir-schedule-plans.service';
import { ChoirScheduleAdjustmentsService } from './choir-schedule-adjustments.service';
import { ChoirRankingsService } from './choir-rankings.service';
import { ChoirDashboardService } from './choir-dashboard.service';
import { ChoirReportsService } from './choir-reports.service';
import { ChoirCalendarService } from './choir-calendar.service';
import { ChoirSearchService } from './choir-search.service';
import { ChoirServiceRulesService } from './choir-service-rules.service';
import { ChoirMemberRecognitionService } from './choir-member-recognition.service';

@Controller('choir/scheduling')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChoirSchedulingController {
  constructor(
    private activities: ChoirActivitiesService,
    private assignments: ChoirServiceAssignmentsService,
    private attendance: ChoirAttendanceService,
    private plans: ChoirSchedulePlansService,
    private adjustments: ChoirScheduleAdjustmentsService,
    private rankings: ChoirRankingsService,
    private dashboard: ChoirDashboardService,
    private reports: ChoirReportsService,
    private calendar: ChoirCalendarService,
    private search: ChoirSearchService,
    private rules: ChoirServiceRulesService,
    private recognition: ChoirMemberRecognitionService,
  ) {}

  @Get('dashboard')
  @RequireUiCapability('ops-scheduling-hub')
  leaderDashboard(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.dashboard.leaderSummary(userId, choirId);
  }

  @Get('dashboard/me')
  @RequireUiCapability('ops-member-scheduling')
  memberDashboard(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.dashboard.memberSummary(userId, choirId);
  }

  @Get('calendar')
  @RequireUiCapability('ops-scheduling-hub')
  calendarView(
    @CurrentUser('sub') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.calendar.listForRange(
      userId,
      new Date(from),
      new Date(to),
      choirId,
    );
  }

  @Post('activities')
  @RequireUiCapability('ops-activities-manage')
  createActivity(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      choirId: string;
      title: string;
      description?: string;
      activityType: ChoirActivityType;
      startAt: string;
      endAt: string;
      location?: string;
      notes?: string;
      occurrenceId?: string;
    },
  ) {
    return this.activities.create(userId, body);
  }

  @Get('activities')
  @RequireUiCapability('ops-activities-hub')
  listActivities(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('activityType') activityType?: ChoirActivityType,
  ) {
    return this.activities.list(userId, {
      choirId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      activityType,
    });
  }

  @Get('occurrences/:occurrenceId/recommendations')
  @RequireUiCapability('ops-schedule-manage')
  recommend(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.assignments.recommend(userId, occurrenceId);
  }

  @Get('assignments/pending-acceptance')
  @RequireUiCapability('ops-schedule-manage')
  listPendingAcceptance(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
  ) {
    return this.assignments.listPendingChoirAcceptance(userId, choirId);
  }

  @Get('assignments')
  @RequireUiCapability('ops-scheduling-hub')
  listChoirAssignments(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
  ) {
    return this.assignments.listForChoir(userId, choirId);
  }

  @Get('occurrences/:occurrenceId/assignments')
  @RequireUiCapability('ops-scheduling-hub')
  listAssignments(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.assignments.listForOccurrence(userId, occurrenceId);
  }

  @Post('assignments/:id/accept')
  @RequireUiCapability('ops-schedule-manage')
  acceptAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.assignments.acceptByChoir(userId, id, body.notes);
  }

  @Post('assignments/:id/decline')
  @RequireUiCapability('ops-schedule-manage')
  declineAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.assignments.declineByChoir(userId, id, body.reason);
  }

  @Post('assignments')
  @RequireUiCapability('church-service-request-schedule')
  assign(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      choirId: string;
      occurrenceId: string;
      role?: ChoirServiceAssignmentRole;
      overrideReason?: string;
      bypassRules?: boolean;
    },
  ) {
    return this.assignments.churchDirectAssign(userId, body);
  }

  @Post('occurrences/:occurrenceId/auto-assign')
  @RequireUiCapability('church-service-request-schedule')
  autoAssign(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.assignments.autoAssignForOccurrence(userId, occurrenceId);
  }

  @Post('adjustments')
  @RequireUiCapability('ops-schedule-manage')
  adjust(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      occurrenceId: string;
      action: ChoirScheduleAdjustmentAction;
      choirId?: string;
      newChoirId?: string;
      role?: ChoirServiceAssignmentRole;
      reason?: string;
    },
  ) {
    return this.adjustments.adjust(userId, body);
  }

  @Get('adjustments')
  @RequireUiCapability('ops-scheduling-hub')
  listAdjustments(
    @CurrentUser('sub') userId: string,
    @Query('occurrenceId') occurrenceId?: string,
  ) {
    return this.adjustments.list(userId, occurrenceId);
  }

  @Post('plans/generate')
  @RequireUiCapability('ops-schedule-manage')
  generatePlan(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      label: string;
      periodType: ChoirSchedulePlanPeriod;
      year: number;
      month?: number;
      quarter?: number;
      startAt: string;
      endAt: string;
    },
  ) {
    return this.plans.generate(userId, body);
  }

  @Get('plans')
  @RequireUiCapability('ops-scheduling-hub')
  listPlans(@CurrentUser('sub') userId: string) {
    return this.plans.list(userId);
  }

  @Get('plans/:id')
  @RequireUiCapability('ops-scheduling-hub')
  getPlan(@Param('id') id: string) {
    return this.plans.get(id);
  }

  @Post('attendance')
  @RequireUiCapability('ops-attendance-manage')
  recordAttendance(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      activityId: string;
      memberId: string;
      outcome: ChoirAttendanceOutcome;
      notes?: string;
    },
  ) {
    return this.attendance.record(userId, body);
  }

  @Get('activities/:activityId/attendance')
  @RequireUiCapability('ops-attendance-view')
  listAttendance(
    @CurrentUser('sub') userId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.attendance.listForActivity(userId, activityId);
  }

  @Get('attendance/me')
  @RequireUiCapability('ops-member-scheduling')
  myAttendance(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.attendance.myHistory(userId, choirId);
  }

  @Get('recognition/me')
  @RequireUiCapability('ops-member-scheduling')
  myRecognition(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
  ) {
    return this.recognition.getMyRecognition(userId, choirId);
  }

  @Post('rankings/generate')
  @RequireUiCapability('ops-rankings-view')
  generateRankings(
    @CurrentUser('sub') userId: string,
    @Body() body: { choirId: string; year: number; month?: number },
  ) {
    return this.rankings.generate(userId, body.choirId, body.year, body.month);
  }

  @Get('rankings')
  @RequireUiCapability('ops-rankings-view')
  listRankings(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Query('year') year: string,
    @Query('month') month?: string,
    @Query('category') category?: ChoirRankingCategory,
  ) {
    return this.rankings.list(
      userId,
      choirId,
      Number(year),
      month ? Number(month) : undefined,
      category,
    );
  }

  @Get('rankings/me')
  @RequireUiCapability('ops-member-scheduling')
  myRanking(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Query('year') year: string,
    @Query('month') month?: string,
  ) {
    return this.rankings.myRanking(
      userId,
      choirId,
      Number(year),
      month ? Number(month) : undefined,
    );
  }

  @Get('reports/participation')
  @RequireUiCapability('ops-reports-hub')
  participationReport(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
  ) {
    return this.reports.participationReport(userId, choirId);
  }

  @Get('reports/health')
  @RequireUiCapability('ops-reports-hub')
  healthReport(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
  ) {
    return this.reports.choirHealth(userId, choirId);
  }

  @Get('reports/attendance')
  @RequireUiCapability('ops-reports-hub')
  attendanceReport(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Query('type') type: 'SERVICE' | 'REHEARSAL' | 'PRAYER',
  ) {
    return this.reports.attendanceByType(userId, choirId, type);
  }

  @Get('search')
  @RequireUiCapability('ops-scheduling-hub')
  choirSearch(@CurrentUser('sub') userId: string, @Query('q') q: string) {
    return this.search.search(userId, q);
  }

  @Get('service-rules/slots')
  @RequireUiCapability('ops-scheduling-hub')
  slotRules(
    @Query('templateCode') templateCode: string,
    @Query('startAt') startAt: string,
  ) {
    return this.rules.resolveSlots(templateCode, new Date(startAt));
  }
}
