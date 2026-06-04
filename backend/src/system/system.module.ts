import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { SystemController } from './system.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, MemberPhoneEnforcementModule, PilotReadyModule],
  controllers: [SystemController],
})
export class SystemModule {}
