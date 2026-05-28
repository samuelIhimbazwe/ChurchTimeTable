import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class AttendanceLockTask {
  private readonly logger = new Logger(AttendanceLockTask.name);

  constructor(private attendanceService: AttendanceService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async lockExpiredAttendance() {
    const result = await this.attendanceService.lockExpiredRecords();
    if (result.count > 0) {
      this.logger.log(`Locked ${result.count} attendance records`);
    }
  }
}
