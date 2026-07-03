import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ChoirSchedulingModule } from '../choir-scheduling/choir-scheduling.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirServiceOpsController } from './choir-service-ops.controller';
import { ChoirServiceRequestsService } from './choir-service-requests.service';
import { ServicePreparationService } from './service-preparation.service';
import { ChoirDissolutionService } from './choir-dissolution.service';
import { ChoirServiceOccurrenceService } from './choir-service-occurrence.service';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';

@Module({
  imports: [AuditModule, AuthModule, ChoirSchedulingModule, MemberPhoneEnforcementModule, ChoirHttpAccessModule],
  controllers: [ChoirServiceOpsController],
  providers: [
    ChoirServiceRequestsService,
    ServicePreparationService,
    ChoirDissolutionService,
    ChoirServiceOccurrenceService,
  ],
  exports: [
    ChoirServiceRequestsService,
    ServicePreparationService,
    ChoirDissolutionService,
  ],
})
export class ChoirServiceOpsModule {}
