import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ReminderJobsTask } from './reminder-jobs.task';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    forwardRef(() => PilotReadyModule),
  ],
  providers: [ReminderJobsTask],
})
export class AppScheduleModule {}
