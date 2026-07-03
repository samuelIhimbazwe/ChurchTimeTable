import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { MembersModule } from '../members/members.module';
import { ChoirsModule } from '../choirs/choirs.module';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationRuleGateService } from './notification-rule-gate.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { AutomatedRemindersService } from './automated-reminders.service';

/** Notification delivery only — church admin / import / deployment surfaces removed. */
@Module({
  imports: [
    AuditModule,
    AuthModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
    forwardRef(() => MembersModule),
    ChoirsModule,
    ChoirHttpAccessModule,
  ],
  providers: [
    NotificationRulesService,
    NotificationRuleGateService,
    NotificationDeliveryService,
    AutomatedRemindersService,
  ],
  exports: [
    NotificationRulesService,
    NotificationRuleGateService,
    NotificationDeliveryService,
    AutomatedRemindersService,
  ],
})
export class PilotReadyModule {}
