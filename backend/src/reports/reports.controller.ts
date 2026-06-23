import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('attendance')
  @RequireUiCapability('report-export')
  attendance(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('ministry') ministry?: string,
  ) {
    return this.reportsService.attendanceSummary(from, to, ministry);
  }

  @Get('discipline')
  @RequireUiCapability('report-export')
  discipline(@Query('ministry') ministry?: string) {
    return this.reportsService.disciplineSummary(ministry);
  }

  @Get('finance')
  @RequireUiCapability('report-export')
  finance() {
    return this.reportsService.financeSummary();
  }

  @Get('protocol-quota')
  @RequireUiCapability('report-export')
  protocolQuota(@Query('month') month?: string) {
    return this.reportsService.protocolQuotaCompliance(month);
  }

  @Get('scores/trends')
  @RequireUiCapability('report-export')
  scoreTrends(@Query('months') months?: string) {
    return this.reportsService.responsibilityScoreTrends(
      months ? Number(months) : 6,
    );
  }

  @Get('attendance/export/csv')
  @RequireUiCapability('report-export')
  async attendanceCsv(
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const summary = await this.reportsService.attendanceSummary(from, to);
    const exported = this.reportsService.exportCsv(
      [summary as unknown as Record<string, unknown>],
      'attendance-summary.csv',
    );
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.content);
  }

  @Get('attendance/export/pdf')
  @RequireUiCapability('report-export')
  async attendancePdf(
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.buildAttendancePdf(from, to);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="attendance-summary.pdf"',
    );
    res.send(buffer);
  }

  @Get('finance/export/pdf')
  @RequireUiCapability('report-export')
  async financePdf(@Res() res: Response) {
    const buffer = await this.reportsService.buildFinancePdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="finance-summary.pdf"',
    );
    res.send(buffer);
  }

  @Get('discipline/export/pdf')
  @RequireUiCapability('report-export')
  async disciplinePdf(@Res() res: Response) {
    const buffer = await this.reportsService.buildDisciplinePdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="discipline-summary.pdf"',
    );
    res.send(buffer);
  }

  @Get('protocol-quota/export/pdf')
  @RequireUiCapability('report-export')
  async protocolQuotaPdf(
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.buildProtocolQuotaPdf(month);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="protocol-quota.pdf"',
    );
    res.send(buffer);
  }
}
