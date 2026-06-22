import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { MusicModule } from '../music/music.module';
import { VoiceCapabilityModule } from '../common/choir/voice-capability.module';
import { RehearsalsController } from './rehearsals.controller';
import { RehearsalsService } from './rehearsals.service';
import { ChoirVoiceAccessService } from './choir-voice-access.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    NotificationsModule,
    ReportsModule,
    MemberPhoneEnforcementModule,
    MusicModule,
    VoiceCapabilityModule,
  ],
  controllers: [RehearsalsController],
  providers: [RehearsalsService, ChoirVoiceAccessService],
  exports: [RehearsalsService, ChoirVoiceAccessService],
})
export class RehearsalsModule {}
