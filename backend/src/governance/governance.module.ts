import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { ProtocolTeamGenerationService } from './protocol-team-generation.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GovernanceController],
  providers: [GovernanceService, ProtocolTeamGenerationService],
  exports: [GovernanceService, ProtocolTeamGenerationService],
})
export class GovernanceModule {}
