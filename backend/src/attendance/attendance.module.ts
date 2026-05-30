import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceScoringService } from './attendance-scoring.service';
import { AttendanceEscalationService } from './attendance-escalation.service';
import { AttendanceGovernanceService } from './attendance-governance.service';

@Module({
  imports: [NotificationsModule, AuditModule, AuthModule, GovernanceModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceScoringService,
    AttendanceEscalationService,
    AttendanceGovernanceService,
  ],
  exports: [
    AttendanceService,
    AttendanceScoringService,
    AttendanceGovernanceService,
  ],
})
export class AttendanceModule {}
