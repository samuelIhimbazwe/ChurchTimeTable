import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChurchActivityType, LeadershipAssignmentScope } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { ChurchHealthService } from './church-health.service';
import { MinistryHealthService } from './ministry-health.service';
import { OperationalUnitHealthService } from './operational-unit-health.service';
import { GovernanceAlertsService } from './governance-alerts.service';
import { ChurchActivityService } from './church-activity.service';
import { LeadershipTermService } from './leadership-term.service';
import { LeadershipAnalyticsService } from './leadership-analytics.service';
import {
  ChurchIntelligenceDashboardService,
  ChurchIntelligenceReportsService,
} from './church-intelligence-reports.service';

@Controller('church/intelligence')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChurchIntelligenceController {
  constructor(
    private health: ChurchHealthService,
    private ministryHealth: MinistryHealthService,
    private unitHealth: OperationalUnitHealthService,
    private alerts: GovernanceAlertsService,
    private reports: ChurchIntelligenceReportsService,
    private dashboardService: ChurchIntelligenceDashboardService,
    private terms: LeadershipTermService,
  ) {}

  @Get('summary')
  @RequireUiCapability('church-intelligence-view')
  summary(@CurrentUser('sub') userId: string) {
    return this.health.summary(userId);
  }

  @Get('dashboard')
  @RequireUiCapability('church-intelligence-view')
  dashboard(@CurrentUser('sub') userId: string) {
    return this.dashboardService.widgetBundle(userId);
  }

  @Get('ministry-health')
  @RequireUiCapability('church-intelligence-view')
  ministryHealthList(@CurrentUser('sub') userId: string) {
    return this.ministryHealth.scoreAll(userId);
  }

  @Get('ministry-health/:ministryId')
  @RequireUiCapability('church-intelligence-view')
  ministryHealthOne(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
  ) {
    return this.ministryHealth.scoreMinistry(userId, ministryId);
  }

  @Get('unit-health')
  @RequireUiCapability('church-intelligence-view')
  unitHealthList(@CurrentUser('sub') userId: string) {
    return this.unitHealth.scoreAll(userId);
  }

  @Get('alerts')
  @RequireUiCapability('church-intelligence-view')
  alertList(@CurrentUser('sub') userId: string) {
    return this.alerts.list(userId);
  }

  @Get('reports')
  @RequireUiCapability('church-intelligence-view')
  reportCatalog(@CurrentUser('sub') userId: string) {
    return this.reports.listReports(userId);
  }

  @Get('reports/:reportType')
  @RequireUiCapability('church-intelligence-view')
  reportData(
    @CurrentUser('sub') userId: string,
    @Param('reportType') reportType: string,
  ) {
    return this.reports.generate(userId, reportType as import('./church-intelligence-reports.service').ChurchReportType);
  }

  @Get('reports/:reportType/csv')
  @RequireUiCapability('report-export')
  reportCsv(
    @CurrentUser('sub') userId: string,
    @Param('reportType') reportType: string,
    @Res() res: Response,
  ) {
    return this.reports.exportCsv(
      userId,
      reportType as import('./church-intelligence-reports.service').ChurchReportType,
      res,
    );
  }

  @Get('reports/:reportType/pdf')
  @RequireUiCapability('report-export')
  reportPdf(
    @CurrentUser('sub') userId: string,
    @Param('reportType') reportType: string,
    @Res() res: Response,
  ) {
    return this.reports.exportPdf(
      userId,
      reportType as import('./church-intelligence-reports.service').ChurchReportType,
      res,
    );
  }

  @Get('leadership-terms')
  @RequireUiCapability('church-intelligence-view')
  leadershipTerms(@CurrentUser('sub') userId: string) {
    return this.terms.list(userId);
  }

  @Post('leadership-terms')
  @RequireUiCapability('church-governance-manage')
  upsertTerm(
    @CurrentUser('sub') userId: string,
    @Body()
    dto: {
      assignmentScope: LeadershipAssignmentScope;
      assignmentId: string;
      startedAt: string;
      expectedEndAt?: string;
      endedAt?: string;
      notes?: string;
    },
  ) {
    return this.terms.upsert(userId, dto);
  }
}

@Controller('church/activity')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChurchActivityController {
  constructor(private activity: ChurchActivityService) {}

  @Get()
  @RequireUiCapability('church-intelligence-view')
  feed(
    @CurrentUser('sub') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('ministryId') ministryId?: string,
    @Query('unitId') unitId?: string,
    @Query('type') type?: ChurchActivityType,
    @Query('limit') limit?: string,
  ) {
    return this.activity.feed(userId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      ministryId,
      operationalUnitId: unitId,
      activityType: type,
      limit: limit ? Number(limit) : undefined,
    });
  }
}

@Controller('leadership/analytics')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class LeadershipAnalyticsController {
  constructor(private leadership: LeadershipAnalyticsService) {}

  @Get()
  @RequireUiCapability('church-intelligence-view')
  list(@CurrentUser('sub') userId: string) {
    return this.leadership.list(userId);
  }

  @Get(':memberId')
  @RequireUiCapability('church-intelligence-view')
  one(
    @CurrentUser('sub') userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.leadership.forMember(userId, memberId);
  }
}
