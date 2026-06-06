import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthUxModule } from '../auth-ux/auth-ux.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChurchController } from './church.controller';
import { ProtocolPortalController } from './protocol-portal.controller';
import { MemberPortalController } from './member-portal.controller';
import { ChurchBroadcastsService } from './church-broadcasts.service';
import { ChoirDiscoveryService } from './choir-discovery.service';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';
import { ProtocolInvitationsService } from './protocol-invitations.service';
import { ProtocolClaimsService } from './protocol-claims.service';
import { ProtocolMembershipService } from './protocol-membership.service';
import { MemberPortalDashboardService } from './member-portal-dashboard.service';
import { ChoirDashboardContextService } from './choir-dashboard-context.service';
import { ChoirMyFamilyService } from './choir-my-family.service';
import { ProtocolDashboardContextService } from './protocol-dashboard-context.service';
import { MemberPortalChoirProfileService } from './member-portal-choir-profile.service';
import { MemberPortalDevotionService } from './member-portal-devotion.service';
import { MemberPortalPrayerService } from './member-portal-prayer.service';
import { MemberPortalWeeklyActivitiesService } from './member-portal-weekly-activities.service';
import { MemberPortalNotificationsService } from './member-portal-notifications.service';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    AuthUxModule,
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
    ChoirDiscoveryService,
    ChoirMembershipRulesService,
    ProtocolInvitationsService,
    ProtocolClaimsService,
    ProtocolMembershipService,
    MemberPortalDashboardService,
    MemberPortalNotificationsService,
    MemberPortalDevotionService,
    MemberPortalPrayerService,
    MemberPortalWeeklyActivitiesService,
    MemberPortalChoirProfileService,
    ChoirDashboardContextService,
    ChoirMyFamilyService,
    ProtocolDashboardContextService,
  ],
  exports: [MemberPortalDashboardService],
})
export class MemberPortalModule {}
