import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MinistriesModule } from '../ministries/ministries.module';
import { OperationalUnitsModule } from '../operational-units/operational-units.module';
import { ReportsModule } from '../reports/reports.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetAccessService } from './asset-access.service';
import { AssetOwnershipService } from './asset-ownership.service';
import { AssetCustodianService } from './asset-custodian.service';
import { AssetAssignmentService } from './asset-assignment.service';
import { AssetMaintenanceService } from './asset-maintenance.service';
import { AssetActivityService } from './asset-activity.service';
import { AssetReportsService } from './asset-reports.service';
import { AssetSeedService } from './asset-seed.service';
import { AssetDashboardService } from './asset-dashboard.service';

@Module({
  imports: [
    AuditModule,
    MinistriesModule,
    OperationalUnitsModule,
    ReportsModule,
    MemberPhoneEnforcementModule,
  ],
  controllers: [AssetsController],
  providers: [
    AssetsService,
    AssetAccessService,
    AssetOwnershipService,
    AssetCustodianService,
    AssetAssignmentService,
    AssetMaintenanceService,
    AssetActivityService,
    AssetReportsService,
    AssetSeedService,
    AssetDashboardService,
  ],
  exports: [AssetAccessService, AssetsService, AssetDashboardService],
})
export class AssetsModule {}
