import { Module } from '@nestjs/common';
import { OperationalUnitsController } from './operational-units.controller';
import { OperationalUnitsService } from './operational-units.service';
import { OperationalUnitAccessService } from './operational-unit-access.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [AuditModule, AuthModule, MemberPhoneEnforcementModule],
  controllers: [OperationalUnitsController],
  providers: [OperationalUnitsService, OperationalUnitAccessService],
  exports: [OperationalUnitsService, OperationalUnitAccessService],
})
export class OperationalUnitsModule {}
