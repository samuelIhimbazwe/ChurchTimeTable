import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirsController } from './choirs.controller';
import { ChoirContextService } from './choir-context.service';
import { ChoirDiscoveryService } from '../member-portal/choir-discovery.service';
import { ChoirJoinRequestsService } from '../member-portal/choir-join-requests.service';
import { ChoirMembershipRulesService } from '../member-portal/choir-membership-rules.service';
import { MemberPortalNotificationsService } from '../member-portal/member-portal-notifications.service';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
    forwardRef(() => PilotReadyModule),
  ],
  controllers: [ChoirsController],
  providers: [
    ChoirContextService,
    ChoirDiscoveryService,
    ChoirJoinRequestsService,
    ChoirMembershipRulesService,
    MemberPortalNotificationsService,
  ],
  exports: [ChoirContextService, ChoirMembershipRulesService],
})
export class ChoirsModule {}
