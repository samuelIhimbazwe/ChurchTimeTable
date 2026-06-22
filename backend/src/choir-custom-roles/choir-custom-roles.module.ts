import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { RolesCapabilityModule } from '../common/choir/roles-capability.module';
import { ChoirCustomRolesController } from './choir-custom-roles.controller';
import { ChoirCustomRolesService } from './choir-custom-roles.service';
import { ChoirRolesAccessService } from './choir-roles-access.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, MemberPhoneEnforcementModule, AuditModule, RolesCapabilityModule],
  controllers: [ChoirCustomRolesController],
  providers: [ChoirCustomRolesService, ChoirRolesAccessService],
  exports: [ChoirCustomRolesService, ChoirRolesAccessService],
})
export class ChoirCustomRolesModule {}
