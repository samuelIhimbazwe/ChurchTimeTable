import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { MusicCapabilityModule } from '../common/choir/music-capability.module';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { ChoirMusicAccessService } from './choir-music-access.service';
import { MusicSeedService } from './music-seed.service';

@Module({
  imports: [AuthModule, AuditModule, MemberPhoneEnforcementModule, MusicCapabilityModule, ChoirHttpAccessModule],
  controllers: [MusicController],
  providers: [MusicService, ChoirMusicAccessService, MusicSeedService],
  exports: [MusicService, ChoirMusicAccessService],
})
export class MusicModule {}
