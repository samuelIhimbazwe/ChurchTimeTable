import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ProtocolModule } from '../protocol/protocol.module';
import { ChoirSchedulingModule } from '../choir-scheduling/choir-scheduling.module';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { ServiceRulesService } from './service-rules.service';
import { RotationService } from './rotation.service';
import { OperationsNotificationsService } from './operations-notifications.service';
import { OperationsDashboardService } from './operations-dashboard.service';
import { OperationsReportsService } from './operations-reports.service';
import { OperationsSeedService } from './operations-seed.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    NotificationsModule,
    ReportsModule,
    MemberPhoneEnforcementModule,
    forwardRef(() => ProtocolModule),
    forwardRef(() => ChoirSchedulingModule),
    PilotReadyModule,
  ],
  controllers: [OperationsController],
  providers: [
    OperationsService,
    ServiceRulesService,
    RotationService,
    OperationsNotificationsService,
    OperationsDashboardService,
    OperationsReportsService,
    OperationsSeedService,
  ],
  exports: [OperationsService, OperationsDashboardService],
})
export class OperationsModule {}
