import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { ConflictDetectionService } from './conflict-detection.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, ConflictDetectionService],
  exports: [AssignmentsService, ConflictDetectionService],
})
export class AssignmentsModule {}
