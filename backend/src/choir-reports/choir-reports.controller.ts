import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ChoirReportsService } from './choir-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';

const CHOIR_REPORTS_VIEW = [
  PERMISSIONS.CHOIR_REPORTS_VIEW,
  PERMISSIONS.CHOIR_OPS_REPORT,
  PERMISSIONS.CHOIR_WELFARE_VIEW,
  PERMISSIONS.CHOIR_WELFARE_MANAGE,
  PERMISSIONS.CHOIR_MUSIC_VIEW,
  PERMISSIONS.CHOIR_MUSIC_MANAGE,
  PERMISSIONS.CHOIR_REHEARSAL_VIEW,
  PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
  PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
] as const;

@Controller('choir/reports')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChoirReportsController {
  constructor(private choirReports: ChoirReportsService) {}

  @Get('summary')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...CHOIR_REPORTS_VIEW)
  summary(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.choirReports.summary(user.sub, choirId);
  }

  @Get('health')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...CHOIR_REPORTS_VIEW)
  health(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.choirReports.health(user.sub, choirId);
  }

  @Get('summary.pdf')
  @RequireAnyPermissions(...CHOIR_REPORTS_VIEW)
  async summaryPdf(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Query('choirId') choirId?: string,
  ) {
    const exported = await this.choirReports.exportSummaryPdf(user.sub, choirId);
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Get('health-pack.pdf')
  @RequireAnyPermissions(...CHOIR_REPORTS_VIEW)
  async healthPackPdf(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Res() res: Response,
  ) {
    const exported = await this.choirReports.exportHealthPackPdf(
      user.sub,
      choirId,
    );
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Get('summary.csv')
  @RequireAnyPermissions(...CHOIR_REPORTS_VIEW)
  async summaryCsv(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Query('choirId') choirId?: string,
  ) {
    const exported = await this.choirReports.exportSummaryCsv(user.sub, choirId);
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.content);
  }
}
