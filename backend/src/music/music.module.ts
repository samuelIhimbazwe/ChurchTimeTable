import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { MusicSeedService } from './music-seed.service';

@Module({
  imports: [AuthModule, AuditModule, MemberPhoneEnforcementModule],
  controllers: [MusicController],
  providers: [MusicService, MusicSeedService],
  exports: [MusicService],
})
export class MusicModule {}
