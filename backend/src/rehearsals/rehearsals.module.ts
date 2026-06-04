import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { RehearsalsController } from './rehearsals.controller';
import { RehearsalsService } from './rehearsals.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    NotificationsModule,
    ReportsModule,
    MemberPhoneEnforcementModule,
  ],
  controllers: [RehearsalsController],
  providers: [RehearsalsService],
  exports: [RehearsalsService],
})
export class RehearsalsModule {}
