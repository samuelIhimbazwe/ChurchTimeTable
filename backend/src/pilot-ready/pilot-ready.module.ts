import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { MembersModule } from '../members/members.module';
import { ChoirsModule } from '../choirs/choirs.module';
import {
  ImportsController,
  PilotReadyController,
} from './pilot-ready.controller';
import { SetupController } from './setup.controller';
import { ChurchSetupService } from './church-setup.service';
import { DeploymentReadinessService } from './deployment-readiness.service';
import { DemoModeService } from './demo-mode.service';
import { ImportsService } from './imports.service';
import { BulkActionsService } from './bulk-actions.service';
import { DataQualityService } from './data-quality.service';
import { PilotReadinessService } from './pilot-readiness.service';
import { PermissionAuditService } from './permission-audit.service';
import { ExportCenterService } from './export-center.service';
import { WorkflowSimulationService } from './workflow-simulation.service';
import { NotificationRulesService } from './notification-rules.service';
import { ImportConfirmHandlers } from './import-confirm.handlers';
import { NotificationRuleGateService } from './notification-rule-gate.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { AutomatedRemindersService } from './automated-reminders.service';
import { GoLiveReportService } from './go-live-report.service';
import { RemindersDashboardService } from './reminders-dashboard.service';
import { DeploymentController, RemindersController } from './deployment.controller';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
    forwardRef(() => MembersModule),
    ChoirsModule,
  ],
  controllers: [
    ImportsController,
    PilotReadyController,
    SetupController,
    DeploymentController,
    RemindersController,
  ],
  providers: [
    ImportsService,
    BulkActionsService,
    DataQualityService,
    PilotReadinessService,
    DeploymentReadinessService,
    ChurchSetupService,
    DemoModeService,
    PermissionAuditService,
    ExportCenterService,
    WorkflowSimulationService,
    NotificationRulesService,
    ImportConfirmHandlers,
    NotificationRuleGateService,
    NotificationDeliveryService,
    AutomatedRemindersService,
    GoLiveReportService,
    RemindersDashboardService,
  ],
  exports: [
    DataQualityService,
    PilotReadinessService,
    DeploymentReadinessService,
    NotificationRulesService,
    NotificationRuleGateService,
    NotificationDeliveryService,
    AutomatedRemindersService,
  ],
})
export class PilotReadyModule {}
