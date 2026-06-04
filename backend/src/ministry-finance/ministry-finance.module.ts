import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MinistriesModule } from '../ministries/ministries.module';
import { ReportsModule } from '../reports/reports.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { MinistryFinanceController } from './ministry-finance.controller';
import {
  MinistryBudgetsService,
  MinistryExpensesService,
  MinistryFundsService,
} from './ministry-finance.services';
import {
  MinistryFinanceDashboardService,
  MinistryFinanceReportsService,
} from './ministry-finance-reports.service';

@Module({
  imports: [
    AuditModule,
    MinistriesModule,
    ReportsModule,
    MemberPhoneEnforcementModule,
  ],
  controllers: [MinistryFinanceController],
  providers: [
    MinistryFundsService,
    MinistryBudgetsService,
    MinistryExpensesService,
    MinistryFinanceReportsService,
    MinistryFinanceDashboardService,
  ],
  exports: [MinistryFinanceDashboardService, MinistryFinanceReportsService],
})
export class MinistryFinanceModule {}
