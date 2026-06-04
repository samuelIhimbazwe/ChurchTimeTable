import { Controller, Get, Header, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { MinistryDashboardService } from './ministry-dashboard.service';
import { MinistryReportsService } from './ministry-reports.service';
import { MinistryActivityService } from './ministry-activity.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { MinistryActivityType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class ActivityQueryDto {
  @IsOptional()
  @IsEnum(MinistryActivityType)
  type?: MinistryActivityType;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

@Controller('ministries/:ministryId')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MinistryPlatformController {
  constructor(
    private dashboard: MinistryDashboardService,
    private reports: MinistryReportsService,
    private activity: MinistryActivityService,
  ) {}

  @Get('dashboard')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_DASHBOARD_VIEW,
    PERMISSIONS.MINISTRY_VIEW,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  dashboardView(@CurrentUser() user: JwtPayload, @Param('ministryId') ministryId: string) {
    return this.dashboard.getDashboard(user.sub, ministryId);
  }

  @Get('activity')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_ACTIVITY_VIEW,
    PERMISSIONS.MINISTRY_VIEW,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  activityFeed(
    @CurrentUser() user: JwtPayload,
    @Param('ministryId') ministryId: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.activity.list(user.sub, ministryId, query);
  }

  @Get('reports/summary')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_REPORT_VIEW,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  reportSummary(@CurrentUser() user: JwtPayload, @Param('ministryId') ministryId: string) {
    return this.reports.summary(user.sub, ministryId);
  }

  @Get('reports/csv')
  @Header('Content-Type', 'text/csv')
  async reportCsv(
    @CurrentUser() user: JwtPayload,
    @Param('ministryId') ministryId: string,
    @Res() res: Response,
  ) {
    const file = await this.reports.exportCsv(user.sub, ministryId);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }

  @Get('reports/pdf')
  async reportPdf(
    @CurrentUser() user: JwtPayload,
    @Param('ministryId') ministryId: string,
    @Res() res: Response,
  ) {
    const file = await this.reports.exportPdf(user.sub, ministryId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }
}
