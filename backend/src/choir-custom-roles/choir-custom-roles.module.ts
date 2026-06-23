import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { RolesCapabilityModule } from '../common/choir/roles-capability.module';
import { JoinCapabilityModule } from '../common/choir/join-capability.module';
import { ChoirCustomRolesController } from './choir-custom-roles.controller';
import { ChoirCustomRolesService } from './choir-custom-roles.service';
import { ChoirRolesAccessService } from './choir-roles-access.service';
import { AuditModule } from '../audit/audit.module';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';

@Module({
  imports: [AuthModule, MemberPhoneEnforcementModule, AuditModule, RolesCapabilityModule, JoinCapabilityModule, ChoirHttpAccessModule],
  controllers: [ChoirCustomRolesController],
  providers: [ChoirCustomRolesService, ChoirRolesAccessService],
  exports: [ChoirCustomRolesService, ChoirRolesAccessService],
})
export class ChoirCustomRolesModule {}
