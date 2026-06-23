import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ChoirReportsService } from './choir-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';

@Controller('choir/reports')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChoirReportsController {
  constructor(private choirReports: ChoirReportsService) {}

  @Get('summary')
  @SkipPhoneEnforcement()
  @RequireUiCapability('ops-reports-hub')
  summary(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.choirReports.summary(user.sub, choirId);
  }

  @Get('health')
  @SkipPhoneEnforcement()
  @RequireUiCapability('ops-reports-hub')
  health(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.choirReports.health(user.sub, choirId);
  }

  @Get('summary.pdf')
  @RequireUiCapability('ops-reports-export')
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
  @RequireUiCapability('ops-reports-export')
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
  @RequireUiCapability('ops-reports-export')
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
