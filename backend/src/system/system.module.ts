import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { MemberNumberModule } from '../members/member-number.module';
import { SystemController } from './system.controller';
import { SystemUsersController } from './system-users.controller';
import { SystemUsersService } from './system-users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    MemberNumberModule,
    MemberPhoneEnforcementModule,
    PilotReadyModule,
    ChoirHttpAccessModule,
  ],
  controllers: [SystemController, SystemUsersController],
  providers: [SystemUsersService],
})
export class SystemModule {}
