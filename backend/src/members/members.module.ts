import { Module, forwardRef } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MemberNumberModule } from './member-number.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GovernanceModule } from '../governance/governance.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { ParticipationModule } from '../common/participation/participation.module';
import { AuditModule } from '../audit/audit.module';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';
import { MemberProfileAccessService } from './member-profile-access.service';
import { MemberProfileService } from './member-profile.service';
import { MemberTimelineService } from './member-timeline.service';

@Module({
  imports: [
    MemberNumberModule,
    NotificationsModule,
    GovernanceModule,
    MemberPhoneEnforcementModule,
    AuthModule,
    FinanceModule,
    ParticipationModule,
    AuditModule,
    forwardRef(() => PilotReadyModule),
  ],
  controllers: [MembersController],
  providers: [
    MembersService,
    MemberProfileAccessService,
    MemberProfileService,
    MemberTimelineService,
  ],
  exports: [MembersService, MemberNumberModule],
})
export class MembersModule {}
