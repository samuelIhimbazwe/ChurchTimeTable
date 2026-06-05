import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [PrismaModule, MemberPhoneEnforcementModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
