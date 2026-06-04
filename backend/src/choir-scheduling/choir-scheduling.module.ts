import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirSchedulingController } from './choir-scheduling.controller';
import { ChoirActivitiesService } from './choir-activities.service';
import { ChoirServiceRulesService } from './choir-service-rules.service';
import { ChoirServiceAssignmentsService } from './choir-service-assignments.service';
import { ChoirParticipationService } from './choir-participation.service';
import { ChoirAttendanceService } from './choir-attendance.service';
import { ChoirSchedulePlansService } from './choir-schedule-plans.service';
import { ChoirScheduleAdjustmentsService } from './choir-schedule-adjustments.service';
import { ChoirRankingsService } from './choir-rankings.service';
import { ChoirDashboardService } from './choir-dashboard.service';
import { ChoirReportsService } from './choir-reports.service';
import { ChoirCalendarService } from './choir-calendar.service';
import { ChoirSearchService } from './choir-search.service';
import { ChoirSchedulingNotificationsService } from './choir-scheduling-notifications.service';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
    PilotReadyModule,
  ],
  controllers: [ChoirSchedulingController],
  providers: [
    ChoirActivitiesService,
    ChoirServiceRulesService,
    ChoirServiceAssignmentsService,
    ChoirParticipationService,
    ChoirAttendanceService,
    ChoirSchedulePlansService,
    ChoirScheduleAdjustmentsService,
    ChoirRankingsService,
    ChoirDashboardService,
    ChoirReportsService,
    ChoirCalendarService,
    ChoirSearchService,
    ChoirSchedulingNotificationsService,
  ],
  exports: [ChoirCalendarService, ChoirServiceAssignmentsService],
})
export class ChoirSchedulingModule {}
