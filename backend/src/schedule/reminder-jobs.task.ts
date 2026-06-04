import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutomatedRemindersService } from '../pilot-ready/automated-reminders.service';

@Injectable()
export class ReminderJobsTask {
  private readonly logger = new Logger(ReminderJobsTask.name);

  constructor(private reminders: AutomatedRemindersService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyReminders() {
    try {
      await this.reminders.runAll();
    } catch (err) {
      this.logger.error(
        err instanceof Error ? err.message : 'Hourly reminder job failed',
      );
    }
  }
}
