import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WelfareCapabilityModule } from '../common/choir/welfare-capability.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { WelfareController } from './welfare.controller';
import { WelfareService } from './welfare.service';
import { WelfareSeedService } from './welfare-seed.service';

@Module({
  imports: [
    AuthModule,
    WelfareCapabilityModule,
    AuditModule,
    NotificationsModule,
    ReportsModule,
    MemberPhoneEnforcementModule,
  ],
  controllers: [WelfareController],
  providers: [WelfareService, WelfareSeedService],
  exports: [WelfareService],
})
export class WelfareModule {}
