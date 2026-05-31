import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { I18nModule } from './i18n/i18n.module';
import { LocaleMiddleware } from './common/middleware/locale.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MembersModule } from './members/members.module';
import { SwapsModule } from './swaps/swaps.module';
import { ReplacementsModule } from './replacements/replacements.module';
import { CoverageModule } from './coverage/coverage.module';
import { DisciplineModule } from './discipline/discipline.module';
import { FinanceModule } from './finance/finance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SyncModule } from './sync/sync.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { ChoirModule } from './choir/choir.module';
import { SystemModule } from './system/system.module';
import { AppScheduleModule } from './schedule/schedule.module';
import { GovernanceModule } from './governance/governance.module';
import { VisibilityModule } from './common/visibility/visibility.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    I18nModule,
    PrismaModule,
    VisibilityModule,
    AppScheduleModule,
    AuditModule,
    AuthModule,
    UsersModule,
    EventsModule,
    AssignmentsModule,
    AttendanceModule,
    MembersModule,
    SwapsModule,
    ReplacementsModule,
    CoverageModule,
    DisciplineModule,
    FinanceModule,
    ChoirModule,
    GovernanceModule,
    SystemModule,
    NotificationsModule,
    SyncModule,
    ReportsModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LocaleMiddleware).forRoutes('*');
  }
}
