import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MinistryIntelligenceService } from './ministry-intelligence.service';
import { ReportsModule } from '../reports/reports.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { GovernanceModule } from '../governance/governance.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [ReportsModule, AttendanceModule, GovernanceModule, FinanceModule],
  controllers: [DashboardController],
  providers: [DashboardService, MinistryIntelligenceService],
  exports: [DashboardService, MinistryIntelligenceService],
})
export class DashboardModule {}
