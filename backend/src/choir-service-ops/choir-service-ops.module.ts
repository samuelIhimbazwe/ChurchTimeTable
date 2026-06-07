import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ChoirSchedulingModule } from '../choir-scheduling/choir-scheduling.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirServiceOpsController } from './choir-service-ops.controller';
import { ChurchServiceRequestsService } from './church-service-requests.service';
import { ServicePreparationService } from './service-preparation.service';
import { ChoirDissolutionService } from './choir-dissolution.service';

@Module({
  imports: [AuditModule, AuthModule, ChoirSchedulingModule, MemberPhoneEnforcementModule],
  controllers: [ChoirServiceOpsController],
  providers: [
    ChurchServiceRequestsService,
    ServicePreparationService,
    ChoirDissolutionService,
  ],
  exports: [
    ChurchServiceRequestsService,
    ServicePreparationService,
    ChoirDissolutionService,
  ],
})
export class ChoirServiceOpsModule {}
