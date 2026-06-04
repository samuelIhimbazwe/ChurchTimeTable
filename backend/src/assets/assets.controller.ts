import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AssetActivityType,
  AssetCondition,
  AssetMaintenanceType,
  AssetStatus,
} from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { AssetsService } from './assets.service';
import { AssetOwnershipService } from './asset-ownership.service';
import { AssetCustodianService } from './asset-custodian.service';
import { AssetAssignmentService } from './asset-assignment.service';
import { AssetMaintenanceService } from './asset-maintenance.service';
import { AssetActivityService } from './asset-activity.service';
import { AssetReportsService } from './asset-reports.service';
import { AssetDashboardService } from './asset-dashboard.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import {
  AddAssetOwnerDto,
  UpdateAssetOwnerDto,
} from './dto/asset-ownership.dto';
import { CreateAssetAssignmentDto } from './dto/asset-assignment.dto';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';

@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class AssetsController {
  constructor(
    private assets: AssetsService,
    private ownership: AssetOwnershipService,
    private custodian: AssetCustodianService,
    private assignment: AssetAssignmentService,
    private maintenance: AssetMaintenanceService,
    private activity: AssetActivityService,
    private reports: AssetReportsService,
    private dashboard: AssetDashboardService,
  ) {}

  @Get('categories')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  listCategories() {
    return this.assets.listCategories();
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.ASSET_MANAGE)
  createCategory(
    @CurrentUser('sub') userId: string,
    @Body() dto: { code: string; name: string; description?: string },
  ) {
    return this.assets.createCategory(userId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  list(
    @CurrentUser('sub') userId: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: AssetStatus,
    @Query('condition') condition?: AssetCondition,
  ) {
    return this.assets.list(userId, { search, categoryId, status, condition });
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ASSET_CREATE)
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateAssetDto) {
    return this.assets.create(userId, dto);
  }

  @Get('assignments/overdue')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  overdueAssignments(@CurrentUser('sub') userId: string) {
    return this.assignment.overdue(userId);
  }

  @Get('maintenance/upcoming')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  upcomingMaintenance(@CurrentUser('sub') userId: string) {
    return this.maintenance.upcoming(userId);
  }

  @Get('maintenance/overdue')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  overdueMaintenance(@CurrentUser('sub') userId: string) {
    return this.maintenance.overdue(userId);
  }

  @Get('reports/inventory')
  @RequirePermissions(PERMISSIONS.ASSET_REPORT)
  reportInventory(@CurrentUser('sub') userId: string) {
    return this.reports.inventory(userId);
  }

  @Get('reports/ownership')
  @RequirePermissions(PERMISSIONS.ASSET_REPORT)
  reportOwnership(@CurrentUser('sub') userId: string) {
    return this.reports.ownership(userId);
  }

  @Get('reports/assignments')
  @RequirePermissions(PERMISSIONS.ASSET_REPORT)
  reportAssignments(@CurrentUser('sub') userId: string) {
    return this.reports.assignments(userId);
  }

  @Get('reports/maintenance')
  @RequirePermissions(PERMISSIONS.ASSET_REPORT)
  reportMaintenance(@CurrentUser('sub') userId: string) {
    return this.reports.maintenance(userId);
  }

  @Get('reports/losses')
  @RequirePermissions(PERMISSIONS.ASSET_REPORT)
  reportLosses(@CurrentUser('sub') userId: string) {
    return this.reports.losses(userId);
  }

  @Get('reports/valuation')
  @RequirePermissions(PERMISSIONS.ASSET_REPORT)
  reportValuation(@CurrentUser('sub') userId: string) {
    return this.reports.valuation(userId);
  }

  @Get('reports/inventory/export')
  @RequirePermissions(PERMISSIONS.ASSET_REPORT)
  async exportInventory(
    @CurrentUser('sub') userId: string,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response,
  ) {
    const file =
      format === 'pdf'
        ? await this.reports.exportInventoryPdf(userId)
        : await this.reports.exportInventoryCsv(userId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    if (Buffer.isBuffer(file.content)) {
      res.send(file.content);
    } else {
      res.send(file.content);
    }
  }

  @Get('ministries/:ministryId/dashboard')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_DASHBOARD_VIEW,
    PERMISSIONS.ASSET_VIEW,
  )
  ministryDashboard(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
  ) {
    return this.dashboard.ministrySummary(userId, ministryId);
  }

  @Get('operational-units/:unitId/dashboard')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_VIEW,
    PERMISSIONS.ASSET_VIEW,
  )
  unitDashboard(
    @CurrentUser('sub') userId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.dashboard.operationalUnitSummary(userId, unitId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  getById(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.assets.getById(userId, id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ASSET_MANAGE)
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assets.update(userId, id, dto);
  }

  @Get(':id/ownership')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  listOwnership(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.ownership.list(userId, id);
  }

  @Post(':id/ownership')
  @RequirePermissions(PERMISSIONS.ASSET_OWNERSHIP_MANAGE)
  addOwner(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: AddAssetOwnerDto,
  ) {
    return this.ownership.addOwner(userId, id, dto);
  }

  @Get(':id/ownership/validate')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  validateOwnership(@Param('id') id: string) {
    return this.ownership.validateOwnershipTotals(id);
  }

  @Patch(':id/ownership/:ownershipId')
  @RequirePermissions(PERMISSIONS.ASSET_OWNERSHIP_MANAGE)
  updateOwner(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Param('ownershipId') ownershipId: string,
    @Body() dto: UpdateAssetOwnerDto,
  ) {
    return this.ownership.updateOwner(userId, id, ownershipId, dto);
  }

  @Delete(':id/ownership/:ownershipId')
  @RequirePermissions(PERMISSIONS.ASSET_OWNERSHIP_MANAGE)
  removeOwner(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Param('ownershipId') ownershipId: string,
  ) {
    return this.ownership.removeOwner(userId, id, ownershipId);
  }

  @Get(':id/custodian')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  getCustodian(@Param('id') id: string) {
    return this.custodian.getActive(id);
  }

  @Get(':id/custodian/history')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  custodianHistory(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.custodian.history(userId, id);
  }

  @Post(':id/custodian')
  @RequirePermissions(PERMISSIONS.ASSET_CUSTODIAN_MANAGE)
  assignCustodian(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: { memberId: string; notes?: string },
  ) {
    return this.custodian.assign(userId, id, dto);
  }

  @Post(':id/custodian/transfer')
  @RequirePermissions(PERMISSIONS.ASSET_CUSTODIAN_MANAGE)
  transferCustodian(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: { memberId: string; notes?: string },
  ) {
    return this.custodian.transfer(userId, id, dto);
  }

  @Post(':id/custodian/release')
  @RequirePermissions(PERMISSIONS.ASSET_CUSTODIAN_MANAGE)
  releaseCustodian(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto?: { notes?: string },
  ) {
    return this.custodian.release(userId, id, dto?.notes);
  }

  @Get(':id/assignments')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  listAssignments(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.assignment.history(userId, id);
  }

  @Post(':id/assignments')
  @RequirePermissions(PERMISSIONS.ASSET_ASSIGN)
  assign(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateAssetAssignmentDto,
  ) {
    return this.assignment.assign(userId, id, dto);
  }

  @Post(':id/assignments/:assignmentId/return')
  @RequirePermissions(PERMISSIONS.ASSET_ASSIGN)
  returnAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto?: { notes?: string },
  ) {
    return this.assignment.return(userId, id, assignmentId, dto?.notes);
  }

  @Post(':id/assignments/:assignmentId/transfer')
  @RequirePermissions(PERMISSIONS.ASSET_ASSIGN)
  transferAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CreateAssetAssignmentDto,
  ) {
    return this.assignment.transfer(userId, id, assignmentId, dto);
  }

  @Get(':id/maintenance')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  maintenanceHistory(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.maintenance.history(userId, id);
  }

  @Post(':id/maintenance')
  @RequirePermissions(PERMISSIONS.ASSET_MAINTAIN)
  createMaintenance(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body()
    dto: {
      type: AssetMaintenanceType;
      description: string;
      cost?: number;
      vendor?: string;
      performedBy?: string;
      performedAt?: string;
      nextMaintenanceDate?: string;
      attachments?: unknown;
    },
  ) {
    return this.maintenance.create(userId, id, dto);
  }

  @Patch(':id/maintenance/:maintenanceId')
  @RequirePermissions(PERMISSIONS.ASSET_MAINTAIN)
  updateMaintenance(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Param('maintenanceId') maintenanceId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.maintenance.update(userId, id, maintenanceId, dto as never);
  }

  @Get(':id/activity')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  activityTimeline(
    @Param('id') id: string,
    @Query('type') type?: AssetActivityType,
  ) {
    return this.activity.timeline(id, { type });
  }
}
