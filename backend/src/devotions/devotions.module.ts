import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { DevotionsController } from './devotions.controller';
import { DevotionsService } from './devotions.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    MemberPhoneEnforcementModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [DevotionsController],
  providers: [DevotionsService],
  exports: [DevotionsService],
})
export class DevotionsModule {}
