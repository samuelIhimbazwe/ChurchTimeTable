import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChurchController } from './church.controller';
import { ProtocolPortalController } from './protocol-portal.controller';
import { MemberPortalController } from './member-portal.controller';
import { ChurchBroadcastsService } from './church-broadcasts.service';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';
import { ProtocolInvitationsService } from './protocol-invitations.service';
import { ProtocolClaimsService } from './protocol-claims.service';
import { ProtocolMembershipService } from './protocol-membership.service';
import { MemberPortalDashboardService } from './member-portal-dashboard.service';
import { MemberPortalNotificationsService } from './member-portal-notifications.service';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
    PilotReadyModule,
  ],
  controllers: [
    ChurchController,
    ProtocolPortalController,
    MemberPortalController,
  ],
  providers: [
    ChurchBroadcastsService,
    ChoirMembershipRulesService,
    ProtocolInvitationsService,
    ProtocolClaimsService,
    ProtocolMembershipService,
    MemberPortalDashboardService,
    MemberPortalNotificationsService,
  ],
  exports: [MemberPortalDashboardService],
})
export class MemberPortalModule {}
