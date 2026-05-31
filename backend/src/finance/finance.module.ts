import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GovernanceModule } from '../governance/governance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinanceService } from './finance.service';
import { FinanceGovernanceService } from './finance-governance.service';
import { FinanceExportService } from './finance-export.service';
import { ContributionService } from './contribution.service';
import { FinanceController } from './finance.controller';
import { ReceiptUploadService } from './receipt/receipt-upload.service';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [
    GovernanceModule,
    AuditModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
  ],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    FinanceGovernanceService,
    FinanceExportService,
    ContributionService,
    ReceiptUploadService,
  ],
  exports: [
    FinanceService,
    FinanceGovernanceService,
    FinanceExportService,
    ContributionService,
  ],
})
export class FinanceModule {}
