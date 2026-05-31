import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MemberNumberModule } from './member-number.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GovernanceModule } from '../governance/governance.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [MemberNumberModule, NotificationsModule, GovernanceModule, MemberPhoneEnforcementModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService, MemberNumberModule],
})
export class MembersModule {}
