import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportJobType, NotificationRuleTrigger } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { ImportsService } from './imports.service';
import { BulkActionsService } from './bulk-actions.service';
import { DataQualityService } from './data-quality.service';
import { PilotReadinessService } from './pilot-readiness.service';
import { PermissionAuditService } from './permission-audit.service';
import { ExportCenterService } from './export-center.service';
import { WorkflowSimulationService } from './workflow-simulation.service';
import { NotificationRulesService } from './notification-rules.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ImportsController {
  constructor(private imports: ImportsService) {}

  @Post('imports')
  @RequireUiCapability('admin-import')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: { buffer: Buffer; originalname?: string; mimetype?: string },
    @Body('type') type: ImportJobType,
  ) {
    return this.imports.createPreview(
      userId,
      type,
      file?.originalname ?? 'import.csv',
      file?.mimetype ?? 'text/csv',
      file?.buffer ?? Buffer.alloc(0),
    );
  }

  @Get('imports')
  @RequireUiCapability('admin-import')
  list(@CurrentUser('sub') userId: string) {
    return this.imports.list(userId);
  }

  @Get('imports/:id')
  @RequireUiCapability('admin-import')
  get(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.imports.get(userId, id);
  }

  @Post('imports/:id/confirm')
  @RequireUiCapability('admin-import')
  confirm(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body()
    body?: { conflictStrategy?: 'SKIP' | 'REPLACE' | 'MERGE' | 'MANUAL_REVIEW' },
  ) {
    return this.imports.confirm(userId, id, body);
  }

  @Post('imports/:id/cancel')
  @RequireUiCapability('admin-import')
  cancel(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.imports.cancel(userId, id);
  }

  @Get('imports/:id/results')
  @RequireUiCapability('admin-import')
  results(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.imports.getResults(userId, id);
  }
}

@Controller('pilot')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class PilotReadyController {
  constructor(
    private bulk: BulkActionsService,
    private exports: ExportCenterService,
    private simulation: WorkflowSimulationService,
    private rules: NotificationRulesService,
    private readinessService: PilotReadinessService,
    private permissionAuditService: PermissionAuditService,
  ) {}

  @Post('bulk/members')
  @RequireAnyPermissions(PERMISSIONS.PILOT_BULK_MANAGE, PERMISSIONS.MEMBER_MANAGE)
  bulkMembers(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      action:
        | 'ASSIGN_MINISTRY'
        | 'ASSIGN_CHOIR'
        | 'REMOVE_CHOIR'
        | 'ACTIVATE'
        | 'DEACTIVATE';
      memberIds: string[];
      ministryId?: string;
      choirId?: string;
      role?: string;
    },
  ) {
    return this.bulk.members(userId, body.action, body);
  }

  @Post('bulk/notify')
  @RequireAnyPermissions(PERMISSIONS.PILOT_BULK_MANAGE, PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE)
  bulkNotify(
    @CurrentUser('sub') userId: string,
    @Body() body: { memberIds: string[]; title: string; body: string },
  ) {
    return this.bulk.notifyMembers(userId, body.memberIds, body.title, body.body);
  }

  @Post('bulk/choir/attendance')
  @RequireAnyPermissions(PERMISSIONS.PILOT_BULK_MANAGE, PERMISSIONS.CHOIR_ATTENDANCE_MANAGE)
  bulkChoirAttendance(
    @CurrentUser('sub') userId: string,
    @Body()
    body: { records: Array<{ memberId: string; eventId: string; mark: string }> },
  ) {
    return this.bulk.choirAttendance(userId, body.records);
  }

  @Post('bulk/protocol/attendance')
  @RequireUiCapability('protocol-attendance-manage')
  bulkProtocolAttendance(
    @CurrentUser('sub') userId: string,
    @Body()
    body: { records: Array<{ memberId: string; teamId: string; outcome: string }> },
  ) {
    return this.bulk.protocolAttendance(userId, body.records);
  }

  @Get('exports')
  @RequireAnyPermissions(PERMISSIONS.PILOT_EXPORT, PERMISSIONS.REPORT_EXPORT)
  listExports(@CurrentUser('sub') userId: string) {
    return this.exports.listAvailable(userId);
  }

  @Get('exports/:type')
  @RequireAnyPermissions(PERMISSIONS.PILOT_EXPORT, PERMISSIONS.REPORT_EXPORT)
  exportFile(
    @CurrentUser('sub') userId: string,
    @Param('type') type: string,
    @Query('format') format?: string,
  ) {
    const base = type.replace(/\.(csv|pdf|xlsx)$/i, '');
    const fmt = (format ?? 'csv').toLowerCase();
    if (fmt === 'pdf') return this.exports.exportPdf(userId, base);
    if (fmt === 'xlsx' || fmt === 'excel') {
      return this.exports.exportExcel(userId, base);
    }
    return this.exports.exportCsv(userId, base);
  }

  @Get('readiness')
  @RequireUiCapability('pilot-readiness-view')
  pilotReadiness(@CurrentUser('sub') userId: string) {
    return this.readinessService.indicators(userId);
  }

  @Get('permission-audit')
  @RequireUiCapability('admin-roles-manage')
  getPermissionAudit(@CurrentUser('sub') userId: string) {
    return this.permissionAuditService.report(userId);
  }

  @Post('simulations/run')
  @RequireUiCapability('admin-settings-manage')
  runSimulations(@CurrentUser('sub') userId: string) {
    return this.simulation.runAll(userId);
  }

  @Get('notification-rules')
  @RequireUiCapability('admin-settings-manage')
  listRules(@CurrentUser('sub') userId: string) {
    return this.rules.list(userId);
  }

  @Patch('notification-rules/:trigger')
  @RequireUiCapability('admin-settings-manage')
  updateRule(
    @CurrentUser('sub') userId: string,
    @Param('trigger') trigger: NotificationRuleTrigger,
    @Body() body: { enabled?: boolean },
  ) {
    return this.rules.update(userId, trigger, body);
  }
}
