import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { DevotionCapabilityModule } from '../common/choir/devotion-capability.module';
import { DevotionsController } from './devotions.controller';
import { DevotionsService } from './devotions.service';
import { ChoirDevotionAccessService } from './choir-devotion-access.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    MemberPhoneEnforcementModule,
    AuditModule,
    NotificationsModule,
    DevotionCapabilityModule,
  ],
  controllers: [DevotionsController],
  providers: [DevotionsService, ChoirDevotionAccessService],
  exports: [DevotionsService, ChoirDevotionAccessService],
})
export class DevotionsModule {}
