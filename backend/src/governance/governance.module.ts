import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { ProtocolTeamGenerationService } from './protocol-team-generation.service';
import { OperationalScopeService } from './operational-scope.service';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

import { ChoirCustomRolesModule } from '../choir-custom-roles/choir-custom-roles.module';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, MemberPhoneEnforcementModule, ChoirCustomRolesModule, ChoirHttpAccessModule],
  controllers: [GovernanceController],
  providers: [
    GovernanceService,
    ProtocolTeamGenerationService,
    OperationalScopeService,
  ],
  exports: [
    GovernanceService,
    ProtocolTeamGenerationService,
    OperationalScopeService,
  ],
})
export class GovernanceModule {}
