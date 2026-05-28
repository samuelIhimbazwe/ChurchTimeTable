import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { AttendanceLockTask } from './attendance-lock.task';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [NestScheduleModule.forRoot(), AttendanceModule],
  providers: [AttendanceLockTask],
})
export class AppScheduleModule {}
