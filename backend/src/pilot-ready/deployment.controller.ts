import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { GoLiveReportService } from './go-live-report.service';
import { RemindersDashboardService } from './reminders-dashboard.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { AutomatedRemindersService } from './automated-reminders.service';

@Controller('deployment')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class DeploymentController {
  constructor(
    private goLiveReport: GoLiveReportService,
    private remindersDashboard: RemindersDashboardService,
    private deliveryLogs: NotificationDeliveryService,
  ) {}

  @Get('go-live-report')
  @RequireUiCapability('pilot-readiness-view')
  report(@CurrentUser('sub') userId: string) {
    return this.goLiveReport.build(userId);
  }
}

@Controller('reminders')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class RemindersController {
  constructor(
    private remindersDashboard: RemindersDashboardService,
    private deliveryService: NotificationDeliveryService,
    private automatedReminders: AutomatedRemindersService,
  ) {}

  @Get('dashboard')
  @RequireUiCapability('admin-settings-manage')
  dashboard(@CurrentUser('sub') userId: string) {
    return this.remindersDashboard.dashboard(userId);
  }

  @Get('delivery-logs')
  @RequireUiCapability('admin-settings-manage')
  listDeliveryLogs(@CurrentUser('sub') userId: string) {
    return this.deliveryService.listDeliveryLogs({ limit: 100 });
  }

  @Post('run-now')
  @RequireUiCapability('admin-settings-manage')
  async runNow() {
    await this.automatedReminders.runAll();
    return { ok: true };
  }
}
