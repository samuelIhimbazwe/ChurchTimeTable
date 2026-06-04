import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { AttendanceLockTask } from './attendance-lock.task';
import { ReminderJobsTask } from './reminder-jobs.task';
import { AttendanceModule } from '../attendance/attendance.module';
import { PilotReadyModule } from '../pilot-ready/pilot-ready.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    AttendanceModule,
    forwardRef(() => PilotReadyModule),
  ],
  providers: [AttendanceLockTask, ReminderJobsTask],
})
export class AppScheduleModule {}
