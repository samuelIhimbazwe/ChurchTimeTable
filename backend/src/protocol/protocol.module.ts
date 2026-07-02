import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ReportsModule } from '../reports/reports.module';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';
import { FinanceModule } from '../finance/finance.module';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';
import { ChoirSchedulingModule } from '../choir-scheduling/choir-scheduling.module';
import { ProtocolController } from './protocol.controller';
import { ProtocolTeamsService } from './protocol-teams.service';
import { ProtocolAssignmentEngine } from './protocol-assignment.engine';
import { ServiceQuotaEngine } from './service-quota.engine';
import { ProtocolAttendanceService } from './protocol-attendance.service';
import { ProtocolReplacementsService } from './protocol-replacements.service';
import { ProtocolRankingService } from './protocol-ranking.service';
import { ProtocolPerformanceService } from './protocol-performance.service';
import { ProtocolReliabilityService } from './protocol-reliability.service';
import { ProtocolDashboardService } from './protocol-dashboard.service';
import { ProtocolMembersService } from './protocol-members.service';
import { ProtocolReportsService } from './protocol-reports.service';
import { ProtocolSearchService } from './protocol-search.service';
import { ProtocolTeamLeadersService } from './protocol-team-leaders.service';
import { ProtocolTeamLeaderAccessService } from './protocol-team-leader-access.service';
import { ProtocolBackupsService } from './protocol-backups.service';
import { ProtocolTeamReportsService } from './protocol-team-reports.service';
import { ProtocolNotificationsService } from './protocol-notifications.service';
import { ProtocolOfficerSlaService } from './protocol-officer-sla.service';
import { ProtocolDocumentsService } from './protocol-documents.service';
import { ProtocolMemberRecognitionService } from './protocol-member-recognition.service';
import { ProtocolMonthlyScheduleService } from './protocol-monthly-schedule.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
    ReportsModule,
    PilotReadyModule,
    FinanceModule,
    ChoirHttpAccessModule,
    ChoirSchedulingModule,
  ],
  controllers: [ProtocolController],
  providers: [
    ProtocolTeamsService,
    ProtocolAssignmentEngine,
    ServiceQuotaEngine,
    ProtocolAttendanceService,
    ProtocolReplacementsService,
    ProtocolRankingService,
    ProtocolPerformanceService,
    ProtocolReliabilityService,
    ProtocolDashboardService,
    ProtocolMembersService,
    ProtocolReportsService,
    ProtocolSearchService,
    ProtocolTeamLeadersService,
    ProtocolTeamLeaderAccessService,
    ProtocolBackupsService,
    ProtocolTeamReportsService,
    ProtocolNotificationsService,
    ProtocolOfficerSlaService,
    ProtocolDocumentsService,
    ProtocolMemberRecognitionService,
    ProtocolMonthlyScheduleService,
  ],
  exports: [ProtocolTeamsService, ProtocolDashboardService],
})
export class ProtocolModule {}
