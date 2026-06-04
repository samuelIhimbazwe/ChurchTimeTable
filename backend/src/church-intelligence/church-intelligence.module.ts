import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MinistriesModule } from '../ministries/ministries.module';
import { ReportsModule } from '../reports/reports.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';
import {
  ChurchActivityController,
  ChurchIntelligenceController,
  LeadershipAnalyticsController,
} from './church-intelligence.controller';
import { ChurchHealthService } from './church-health.service';
import { MinistryHealthService } from './ministry-health.service';
import { OperationalUnitHealthService } from './operational-unit-health.service';
import { GovernanceAlertsService } from './governance-alerts.service';
import { ChurchActivityService } from './church-activity.service';
import { LeadershipAnalyticsService } from './leadership-analytics.service';
import { LeadershipTermService } from './leadership-term.service';
import {
  ChurchIntelligenceDashboardService,
  ChurchIntelligenceReportsService,
} from './church-intelligence-reports.service';

@Module({
  imports: [
    AuditModule,
    MinistriesModule,
    ReportsModule,
    MemberPhoneEnforcementModule,
    PilotReadyModule,
  ],
  controllers: [
    ChurchIntelligenceController,
    ChurchActivityController,
    LeadershipAnalyticsController,
  ],
  providers: [
    ChurchHealthService,
    MinistryHealthService,
    OperationalUnitHealthService,
    GovernanceAlertsService,
    ChurchActivityService,
    LeadershipAnalyticsService,
    LeadershipTermService,
    ChurchIntelligenceReportsService,
    ChurchIntelligenceDashboardService,
  ],
  exports: [ChurchIntelligenceDashboardService, ChurchHealthService],
})
export class ChurchIntelligenceModule {}
