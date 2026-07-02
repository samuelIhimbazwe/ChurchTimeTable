import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { MemberNumberModule } from '../members/member-number.module';
import { MemberMinistryScopeService } from '../member-portal/member-ministry-scope.service';
import { ProtocolMembershipService } from '../member-portal/protocol-membership.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountInvitesController } from './account-invites.controller';
import { AccountInvitesService } from './account-invites.service';

@Module({
  imports: [PrismaModule, MessagingModule, MemberNumberModule, MemberPhoneEnforcementModule],
  controllers: [AccountInvitesController],
  providers: [
    AccountInvitesService,
    MemberMinistryScopeService,
    ProtocolMembershipService,
  ],
  exports: [AccountInvitesService],
})
export class AccountInvitesModule {}
