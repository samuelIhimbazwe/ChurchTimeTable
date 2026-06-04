import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { GoLiveReportService } from './go-live-report.service';
import { RemindersDashboardService } from './reminders-dashboard.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { AutomatedRemindersService } from './automated-reminders.service';

@Controller('deployment')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class DeploymentController {
  constructor(
    private goLiveReport: GoLiveReportService,
    private remindersDashboard: RemindersDashboardService,
    private deliveryLogs: NotificationDeliveryService,
  ) {}

  @Get('go-live-report')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.ADMIN_USERS_VIEW,
  )
  report(@CurrentUser('sub') userId: string) {
    return this.goLiveReport.build(userId);
  }
}

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class RemindersController {
  constructor(
    private remindersDashboard: RemindersDashboardService,
    private deliveryService: NotificationDeliveryService,
    private automatedReminders: AutomatedRemindersService,
  ) {}

  @Get('dashboard')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.ADMIN_SETTINGS_MANAGE,
  )
  dashboard(@CurrentUser('sub') userId: string) {
    return this.remindersDashboard.dashboard(userId);
  }

  @Get('delivery-logs')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.ADMIN_SETTINGS_MANAGE,
  )
  listDeliveryLogs(@CurrentUser('sub') userId: string) {
    return this.deliveryService.listDeliveryLogs({ limit: 100 });
  }

  @Post('run-now')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.ADMIN_SETTINGS_MANAGE,
  )
  async runNow() {
    await this.automatedReminders.runAll();
    return { ok: true };
  }
}
