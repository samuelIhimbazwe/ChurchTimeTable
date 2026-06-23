import { Module } from '@nestjs/common';
import { MinistryAnnouncementsController, MinistryAnnouncementsNestedController } from './ministry-announcements.controller';
import { MinistryAnnouncementsService } from './ministry-announcements.service';
import { MinistryDocumentsController } from './ministry-documents.controller';
import { MinistryDocumentsService } from './ministry-documents.service';
import { MinistryMeetingsController } from './ministry-meetings.controller';
import { MinistryMeetingsService } from './ministry-meetings.service';
import { MinistryPlatformController } from './ministry-platform.controller';
import { MinistryDashboardService } from './ministry-dashboard.service';
import { MinistryReportsService } from './ministry-reports.service';
import { MinistryActivityService } from './ministry-activity.service';
import { MinistriesModule } from '../ministries/ministries.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { DevotionsModule } from '../devotions/devotions.module';
import { AssetsModule } from '../assets/assets.module';
import { MinistryFinanceModule } from '../ministry-finance/ministry-finance.module';
import { MinistryDevotionsController } from './ministry-devotions.controller';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';

@Module({
  imports: [
    MinistriesModule,
    AuditModule,
    AuthModule,
    NotificationsModule,
    DevotionsModule,
    AssetsModule,
    MinistryFinanceModule,
    MemberPhoneEnforcementModule,
    ChoirHttpAccessModule,
  ],
  controllers: [
    MinistryAnnouncementsController,
    MinistryAnnouncementsNestedController,
    MinistryDocumentsController,
    MinistryMeetingsController,
    MinistryPlatformController,
    MinistryDevotionsController,
  ],
  providers: [
    MinistryAnnouncementsService,
    MinistryDocumentsService,
    MinistryMeetingsService,
    MinistryDashboardService,
    MinistryReportsService,
    MinistryActivityService,
  ],
  exports: [
    MinistryAnnouncementsService,
    MinistryDocumentsService,
    MinistryMeetingsService,
    MinistryDashboardService,
    MinistryReportsService,
    MinistryActivityService,
  ],
})
export class MinistryServicesModule {}
