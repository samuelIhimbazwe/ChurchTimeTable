import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GovernanceModule } from '../governance/governance.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { FamiliesService } from './families.service';
import { FamilyMetricsService } from './family-metrics.service';
import { FamiliesController } from './families.controller';

@Module({
  imports: [GovernanceModule, AuditModule, AttendanceModule, MemberPhoneEnforcementModule],
  controllers: [FamiliesController],
  providers: [FamiliesService, FamilyMetricsService],
  exports: [FamiliesService, FamilyMetricsService],
})
export class FamiliesModule {}
