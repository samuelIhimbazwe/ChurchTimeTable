import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChurchScheduleNotificationsService } from './church-schedule-notifications.service';

@Injectable()
export class ChurchScheduleDigestTask {
  private readonly logger = new Logger(ChurchScheduleDigestTask.name);

  constructor(private notifications: ChurchScheduleNotificationsService) {}

  /** 07:00 server time — church office morning digest */
  @Cron('0 7 * * *')
  async handleDailyDigest() {
    if (process.env.DISABLE_CHURCH_SCHEDULE_DIGEST === '1') {
      return;
    }
    try {
      const result = await this.notifications.sendDailyDigest();
      if (result.notified > 0) {
        this.logger.log(
          `Digest sent to ${result.notified} admin(s): ${result.addedCount} added, ${result.conflictCount} conflicts`,
        );
      }
    } catch (err) {
      this.logger.error(
        err instanceof Error ? err.message : 'Church schedule digest failed',
      );
    }
  }
}
