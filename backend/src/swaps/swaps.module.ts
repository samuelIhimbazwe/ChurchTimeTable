import { Module } from '@nestjs/common';
import { SwapsService } from './swaps.service';
import { SwapsController } from './swaps.controller';
import { AssignmentsModule } from '../assignments/assignments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AssignmentsModule, NotificationsModule],
  controllers: [SwapsController],
  providers: [SwapsService],
})
export class SwapsModule {}
