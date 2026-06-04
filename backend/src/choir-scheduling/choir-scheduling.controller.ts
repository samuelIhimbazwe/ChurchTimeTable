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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
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

@Controller('choir/scheduling')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
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
  ) {}

  @Get('dashboard')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_VIEW,
    PERMISSIONS.CHOIR_OPS_MANAGE,
    PERMISSIONS.CHOIR_OVERSIGHT,
  )
  leaderDashboard(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.dashboard.leaderSummary(userId, choirId);
  }

  @Get('dashboard/me')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_VIEW,
    PERMISSIONS.CHOIR_REHEARSAL_VIEW,
    PERMISSIONS.MEMBER_READ,
  )
  memberDashboard(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.dashboard.memberSummary(userId, choirId);
  }

  @Get('calendar')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_VIEW,
    PERMISSIONS.OPERATIONS_VIEW,
    PERMISSIONS.CHOIR_OVERSIGHT,
  )
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
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_MANAGE,
    PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
  )
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
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_VIEW,
    PERMISSIONS.CHOIR_REHEARSAL_VIEW,
  )
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
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_SCHEDULE, PERMISSIONS.CHOIR_OPS_VIEW)
  recommend(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.assignments.recommend(userId, occurrenceId);
  }

  @Get('occurrences/:occurrenceId/assignments')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.CHOIR_OPS_SCHEDULE)
  listAssignments(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.assignments.listForOccurrence(userId, occurrenceId);
  }

  @Post('assignments')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_SCHEDULE,
    PERMISSIONS.CHOIR_OPS_MANAGE,
  )
  assign(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      choirId: string;
      occurrenceId: string;
      role?: ChoirServiceAssignmentRole;
      overrideReason?: string;
    },
  ) {
    return this.assignments.assign(userId, body);
  }

  @Post('occurrences/:occurrenceId/auto-assign')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_SCHEDULE, PERMISSIONS.CHOIR_OPS_MANAGE)
  autoAssign(
    @CurrentUser('sub') userId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.assignments.autoAssignForOccurrence(userId, occurrenceId);
  }

  @Post('adjustments')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_SCHEDULE, PERMISSIONS.CHOIR_OPS_MANAGE)
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
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_SCHEDULE, PERMISSIONS.CHOIR_OPS_VIEW)
  listAdjustments(
    @CurrentUser('sub') userId: string,
    @Query('occurrenceId') occurrenceId?: string,
  ) {
    return this.adjustments.list(userId, occurrenceId);
  }

  @Post('plans/generate')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_SCHEDULE, PERMISSIONS.CHOIR_OPS_MANAGE)
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
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_SCHEDULE, PERMISSIONS.CHOIR_OPS_VIEW)
  listPlans(@CurrentUser('sub') userId: string) {
    return this.plans.list(userId);
  }

  @Get('plans/:id')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_SCHEDULE, PERMISSIONS.CHOIR_OPS_VIEW)
  getPlan(@Param('id') id: string) {
    return this.plans.get(id);
  }

  @Post('attendance')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_ATTENDANCE,
    PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
  )
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
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.CHOIR_OPS_ATTENDANCE)
  listAttendance(
    @CurrentUser('sub') userId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.attendance.listForActivity(userId, activityId);
  }

  @Get('attendance/me')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.MEMBER_READ)
  myAttendance(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.attendance.myHistory(userId, choirId);
  }

  @Post('rankings/generate')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_RANKING_VIEW,
    PERMISSIONS.CHOIR_OPS_MANAGE,
  )
  generateRankings(
    @CurrentUser('sub') userId: string,
    @Body() body: { choirId: string; year: number; month?: number },
  ) {
    return this.rankings.generate(userId, body.choirId, body.year, body.month);
  }

  @Get('rankings')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_RANKING_VIEW,
    PERMISSIONS.CHOIR_OPS_MANAGE,
  )
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
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.MEMBER_READ)
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
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_REPORT, PERMISSIONS.CHOIR_REPORTS_VIEW)
  participationReport(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
  ) {
    return this.reports.participationReport(userId, choirId);
  }

  @Get('reports/health')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_REPORT, PERMISSIONS.CHOIR_REPORTS_VIEW)
  healthReport(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
  ) {
    return this.reports.choirHealth(userId, choirId);
  }

  @Get('reports/attendance')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_REPORT, PERMISSIONS.CHOIR_REPORTS_VIEW)
  attendanceReport(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Query('type') type: 'SERVICE' | 'REHEARSAL' | 'PRAYER',
  ) {
    return this.reports.attendanceByType(userId, choirId, type);
  }

  @Get('search')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.CHOIR_OVERSIGHT)
  choirSearch(@CurrentUser('sub') userId: string, @Query('q') q: string) {
    return this.search.search(userId, q);
  }

  @Get('service-rules/slots')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.CHOIR_OPS_SCHEDULE)
  slotRules(
    @Query('templateCode') templateCode: string,
    @Query('startAt') startAt: string,
  ) {
    return this.rules.resolveSlots(templateCode, new Date(startAt));
  }
}
