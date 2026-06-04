import { Module } from '@nestjs/common';
import { MinistriesController } from './ministries.controller';
import { MinistriesService } from './ministries.service';
import { MinistryAccessService } from './ministry-access.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [AuditModule, AuthModule, MemberPhoneEnforcementModule],
  controllers: [MinistriesController],
  providers: [MinistriesService, MinistryAccessService],
  exports: [MinistriesService, MinistryAccessService],
})
export class MinistriesModule {}
