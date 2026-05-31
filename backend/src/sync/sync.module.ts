import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { AttendanceModule } from '../attendance/attendance.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { EventsModule } from '../events/events.module';
import { ReplacementsModule } from '../replacements/replacements.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [
    AttendanceModule,
    AssignmentsModule,
    EventsModule,
    ReplacementsModule,
    MemberPhoneEnforcementModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
