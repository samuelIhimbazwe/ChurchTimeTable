import { Module } from '@nestjs/common';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { ParticipationModule } from '../common/participation/participation.module';
import { GovernanceModule } from '../governance/governance.module';
import { AuditModule } from '../audit/audit.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { FamilyMetricsService } from './family-metrics.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    GovernanceModule,
    AuditModule,
    ParticipationModule,
    MemberPhoneEnforcementModule,
    FinanceModule,
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService, FamilyMetricsService],
  exports: [FamiliesService, FamilyMetricsService],
})
export class FamiliesModule {}
