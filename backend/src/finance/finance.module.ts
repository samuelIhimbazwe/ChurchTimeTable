import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GovernanceModule } from '../governance/governance.module';
import { FinanceService } from './finance.service';
import { FinanceGovernanceService } from './finance-governance.service';
import { FinanceExportService } from './finance-export.service';
import { FinanceController } from './finance.controller';
import { ReceiptUploadService } from './receipt/receipt-upload.service';

@Module({
  imports: [GovernanceModule, AuditModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    FinanceGovernanceService,
    FinanceExportService,
    ReceiptUploadService,
  ],
  exports: [FinanceService, FinanceGovernanceService, FinanceExportService],
})
export class FinanceModule {}
