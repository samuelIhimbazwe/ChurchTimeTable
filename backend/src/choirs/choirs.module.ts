import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirsController } from './choirs.controller';
import { ChoirContextService } from './choir-context.service';
import { ChoirDiscoveryService } from '../member-portal/choir-discovery.service';
import { ChoirJoinRequestsService } from '../member-portal/choir-join-requests.service';
import { ChoirJoinAccessService } from '../member-portal/choir-join-access.service';
import { ChoirSponsorAccessService } from '../member-portal/choir-sponsor-access.service';
import { ChoirSponsorRequestsService } from '../member-portal/choir-sponsor-requests.service';
import { ChoirMembershipRulesService } from '../member-portal/choir-membership-rules.service';
import { MemberPortalNotificationsService } from '../member-portal/member-portal-notifications.service';
import { ChoirMembersService } from './choir-members.service';
import { ChoirRosterAccessService } from './choir-roster-access.service';
import { ChoirGovernanceService } from './choir-governance.service';
import { ChoirExecutiveDashboardService } from './choir-executive-dashboard.service';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';
import { ProtocolMembershipService } from '../member-portal/protocol-membership.service';
import { MemberMinistryScopeService } from '../member-portal/member-ministry-scope.service';
import { RosterCapabilityModule } from '../common/choir/roster-capability.module';
import { ChoirCustomRolesModule } from '../choir-custom-roles/choir-custom-roles.module';
import { MemberNumberModule } from '../members/member-number.module';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
    forwardRef(() => PilotReadyModule),
    RosterCapabilityModule,
    ChoirCustomRolesModule,
    MemberNumberModule,
  ],
  controllers: [ChoirsController],
  providers: [
    ChoirContextService,
    ChoirDiscoveryService,
    ChoirJoinRequestsService,
    ChoirJoinAccessService,
    ChoirSponsorAccessService,
    ChoirSponsorRequestsService,
    ChoirMembershipRulesService,
    MemberPortalNotificationsService,
    ChoirMembersService,
    ChoirRosterAccessService,
    ChoirGovernanceService,
    ChoirExecutiveDashboardService,
    ProtocolMembershipService,
    MemberMinistryScopeService,
  ],
  exports: [
    ChoirContextService,
    ChoirMembershipRulesService,
    ChoirExecutiveDashboardService,
  ],
})
export class ChoirsModule {}
