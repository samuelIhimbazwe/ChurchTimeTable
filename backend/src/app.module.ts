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
import { FamiliesModule } from './families/families.module';
import { SearchModule } from './search/search.module';
import { VisibilityModule } from './common/visibility/visibility.module';
import { ChoirMvpModule } from './choir-mvp/choir-mvp.module';
import { ChoirsModule } from './choirs/choirs.module';
import { DevotionsModule } from './devotions/devotions.module';
import { ChoirCustomRolesModule } from './choir-custom-roles/choir-custom-roles.module';
import { MinistriesModule } from './ministries/ministries.module';
import { OperationalUnitsModule } from './operational-units/operational-units.module';
import { MinistryServicesModule } from './ministry-services/ministry-services.module';
import { AssetsModule } from './assets/assets.module';
import { MinistryFinanceModule } from './ministry-finance/ministry-finance.module';
import { ChurchIntelligenceModule } from './church-intelligence/church-intelligence.module';
import { OperationsModule } from './operations/operations.module';
import { ProtocolModule } from './protocol/protocol.module';
import { ChoirSchedulingModule } from './choir-scheduling/choir-scheduling.module';
import { MemberPortalModule } from './member-portal/member-portal.module';
import { PilotReadyModule } from './pilot-ready/pilot-ready.module';
import { ChoirContextMiddleware } from './common/middleware/choir-context.middleware';

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
    FamiliesModule,
    SearchModule,
    ChoirMvpModule,
    ChoirsModule,
    DevotionsModule,
    ChoirCustomRolesModule,
    MinistriesModule,
    OperationalUnitsModule,
    MinistryServicesModule,
    AssetsModule,
    MinistryFinanceModule,
    ChurchIntelligenceModule,
    OperationsModule,
    ProtocolModule,
    ChoirSchedulingModule,
    MemberPortalModule,
    PilotReadyModule,
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
    consumer
      .apply(LocaleMiddleware, ChoirContextMiddleware)
      .forRoutes('*');
  }
}
