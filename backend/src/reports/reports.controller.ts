import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('attendance')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
  attendance(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('ministry') ministry?: string,
  ) {
    return this.reportsService.attendanceSummary(from, to, ministry);
  }

  @Get('discipline')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
  discipline(@Query('ministry') ministry?: string) {
    return this.reportsService.disciplineSummary(ministry);
  }

  @Get('finance')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
  finance() {
    return this.reportsService.financeSummary();
  }

  @Get('protocol-quota')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
  protocolQuota(@Query('month') month?: string) {
    return this.reportsService.protocolQuotaCompliance(month);
  }

  @Get('scores/trends')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
  scoreTrends(@Query('months') months?: string) {
    return this.reportsService.responsibilityScoreTrends(
      months ? Number(months) : 6,
    );
  }

  @Get('attendance/export/csv')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
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
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
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
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
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
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
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
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
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
