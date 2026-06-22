import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DisciplineCapabilityModule } from '../common/choir/discipline-capability.module';
import { DisciplineService } from './discipline.service';
import { DisciplineController } from './discipline.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [
    AuthModule,
    DisciplineCapabilityModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
  ],
  controllers: [DisciplineController],
  providers: [DisciplineService],
})
export class DisciplineModule {}
