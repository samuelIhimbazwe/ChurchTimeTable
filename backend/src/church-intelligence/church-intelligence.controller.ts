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
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions, RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
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
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
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
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  )
  summary(@CurrentUser('sub') userId: string) {
    return this.health.summary(userId);
  }

  @Get('dashboard')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  )
  dashboard(@CurrentUser('sub') userId: string) {
    return this.dashboardService.widgetBundle(userId);
  }

  @Get('ministry-health')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  )
  ministryHealthList(@CurrentUser('sub') userId: string) {
    return this.ministryHealth.scoreAll(userId);
  }

  @Get('ministry-health/:ministryId')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  )
  ministryHealthOne(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
  ) {
    return this.ministryHealth.scoreMinistry(userId, ministryId);
  }

  @Get('unit-health')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  )
  unitHealthList(@CurrentUser('sub') userId: string) {
    return this.unitHealth.scoreAll(userId);
  }

  @Get('alerts')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
  )
  alertList(@CurrentUser('sub') userId: string) {
    return this.alerts.list(userId);
  }

  @Get('reports')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_REPORTS_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
  )
  reportCatalog(@CurrentUser('sub') userId: string) {
    return this.reports.listReports(userId);
  }

  @Get('reports/:reportType')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_REPORTS_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
  )
  reportData(
    @CurrentUser('sub') userId: string,
    @Param('reportType') reportType: string,
  ) {
    return this.reports.generate(userId, reportType as import('./church-intelligence-reports.service').ChurchReportType);
  }

  @Get('reports/:reportType/csv')
  @RequirePermissions(PERMISSIONS.CHURCH_REPORTS_EXPORT)
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
  @RequirePermissions(PERMISSIONS.CHURCH_REPORTS_EXPORT)
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
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
  )
  leadershipTerms(@CurrentUser('sub') userId: string) {
    return this.terms.list(userId);
  }

  @Post('leadership-terms')
  @RequirePermissions(PERMISSIONS.CHURCH_GOVERNANCE_MANAGE)
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
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChurchActivityController {
  constructor(private activity: ChurchActivityService) {}

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  )
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
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class LeadershipAnalyticsController {
  constructor(private leadership: LeadershipAnalyticsService) {}

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  )
  list(@CurrentUser('sub') userId: string) {
    return this.leadership.list(userId);
  }

  @Get(':memberId')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
  )
  one(
    @CurrentUser('sub') userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.leadership.forMember(userId, memberId);
  }
}
