import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { ConflictDetectionService } from './conflict-detection.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [NotificationsModule, MemberPhoneEnforcementModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, ConflictDetectionService],
  exports: [AssignmentsService, ConflictDetectionService],
})
export class AssignmentsModule {}
