import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirCustomRolesController } from './choir-custom-roles.controller';
import { ChoirCustomRolesService } from './choir-custom-roles.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, MemberPhoneEnforcementModule, AuditModule],
  controllers: [ChoirCustomRolesController],
  providers: [ChoirCustomRolesService],
  exports: [ChoirCustomRolesService],
})
export class ChoirCustomRolesModule {}
