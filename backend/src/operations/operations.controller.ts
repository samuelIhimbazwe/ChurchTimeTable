import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OperationAssignmentStatus, OperationOccurrenceStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions, RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { OperationsService } from './operations.service';
import { OperationsDashboardService } from './operations-dashboard.service';
import { OperationsReportsService } from './operations-reports.service';

@Controller('operations')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class OperationsController {
  constructor(
    private operations: OperationsService,
    private dashboard: OperationsDashboardService,
    private reports: OperationsReportsService,
  ) {}

  @Get('dashboard')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE)
  dashboardSummary(@CurrentUser('sub') userId: string) {
    return this.dashboard.summary(userId);
  }

  @Get('templates')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE)
  templates(@CurrentUser('sub') userId: string) {
    return this.operations.listTemplates(userId);
  }

  @Get('occurrences')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE)
  occurrences(
    @CurrentUser('sub') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: OperationOccurrenceStatus,
  ) {
    return this.operations.listOccurrences(userId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      status,
    });
  }

  @Get('calendar')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE)
  calendar(
    @CurrentUser('sub') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.operations.calendar(
      userId,
      new Date(from),
      new Date(to),
    );
  }

  @Get('my-assignments')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONS_VIEW,
    PERMISSIONS.OPERATIONS_ASSIGNMENT_CONFIRM,
  )
  myAssignments(@CurrentUser('sub') userId: string) {
    return this.operations.myAssignments(userId);
  }

  @Post('occurrences')
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  createOccurrence(
    @CurrentUser('sub') userId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.operations.createOccurrence(userId, dto as never);
  }

  @Get('occurrences/:id')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE)
  getOccurrence(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.operations.getOccurrence(userId, id);
  }

  @Patch('occurrences/:id/status')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONS_MANAGE,
    PERMISSIONS.OPERATIONS_SCHEDULE_APPROVE,
    PERMISSIONS.OPERATIONS_SCHEDULE_PUBLISH,
  )
  transition(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { status: OperationOccurrenceStatus },
  ) {
    return this.operations.transitionStatus(userId, id, body.status);
  }

  @Get('occurrences/:id/conflicts')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE)
  conflicts(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.operations.listConflicts(userId, id);
  }

  @Get('occurrences/:id/recommendations')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE)
  recommendations(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Query('assignmentType') assignmentType: string,
  ) {
    return this.operations.recommendations(userId, id, assignmentType);
  }

  @Post('occurrences/:id/assignments')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONS_ASSIGNMENT_MANAGE,
    PERMISSIONS.OPERATIONS_MANAGE,
  )
  createAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.operations.createAssignment(userId, id, dto as never);
  }

  @Patch('assignments/:assignmentId/status')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONS_ASSIGNMENT_CONFIRM,
    PERMISSIONS.OPERATIONS_ASSIGNMENT_MANAGE,
  )
  assignmentStatus(
    @CurrentUser('sub') userId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: { status: OperationAssignmentStatus; notes?: string },
  ) {
    return this.operations.updateAssignmentStatus(
      userId,
      assignmentId,
      body.status,
      body.notes,
    );
  }

  @Get('reports')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_REPORT, PERMISSIONS.OPERATIONS_VIEW)
  reportCatalog(@CurrentUser('sub') userId: string) {
    return this.reports.catalog(userId);
  }

  @Get('reports/:reportId')
  @RequireAnyPermissions(PERMISSIONS.OPERATIONS_REPORT, PERMISSIONS.OPERATIONS_VIEW)
  reportData(@CurrentUser('sub') userId: string, @Param('reportId') reportId: string) {
    return this.reports.generate(userId, reportId);
  }

  @Get('reports/:reportId/csv')
  @RequirePermissions(PERMISSIONS.OPERATIONS_REPORT)
  reportCsv(
    @CurrentUser('sub') userId: string,
    @Param('reportId') reportId: string,
    @Res() res: Response,
  ) {
    return this.reports.exportCsv(userId, reportId, res);
  }

  @Get('reports/:reportId/pdf')
  @RequirePermissions(PERMISSIONS.OPERATIONS_REPORT)
  reportPdf(
    @CurrentUser('sub') userId: string,
    @Param('reportId') reportId: string,
    @Res() res: Response,
  ) {
    return this.reports.exportPdf(userId, reportId, res);
  }
}
