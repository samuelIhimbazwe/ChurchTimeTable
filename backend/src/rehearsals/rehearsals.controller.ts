import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { RehearsalsService } from './rehearsals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { UpsertRehearsalPlanDto } from './dto/upsert-rehearsal-plan.dto';
import { RecordRehearsalAttendanceDto } from './dto/record-rehearsal-attendance.dto';

const REHEARSAL_VIEW_ANY = [
  PERMISSIONS.CHOIR_REHEARSAL_VIEW,
  PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
  PERMISSIONS.CHOIR_MUSIC_VIEW,
  PERMISSIONS.CHOIR_MUSIC_MANAGE,
  PERMISSIONS.EVENT_READ,
] as const;

@Controller('choir/rehearsals')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class RehearsalsController {
  constructor(private rehearsals: RehearsalsService) {}

  @Get('voice-sections')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  voiceSections() {
    return this.rehearsals.listVoiceSections();
  }

  @Get('dashboard')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  dashboard(@CurrentUser() user: JwtPayload) {
    return this.rehearsals.dashboard(user.sub);
  }

  @Get('analytics')
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  analytics(@CurrentUser() user: JwtPayload) {
    return this.rehearsals.analytics(user.sub);
  }

  @Get('plans/:eventId')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  getPlan(@CurrentUser() user: JwtPayload, @Param('eventId') eventId: string) {
    return this.rehearsals.getPlan(user.sub, eventId);
  }

  @Get('plans/:eventId/attendance')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  getAttendance(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
  ) {
    return this.rehearsals.getAttendance(user.sub, eventId);
  }

  @Get('plans/:eventId/attendance.pdf')
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  async exportAttendancePdf(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
    @Res() res: Response,
  ) {
    const exported = await this.rehearsals.exportAttendancePdf(
      user.sub,
      eventId,
    );
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Put('plans/:eventId')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
    PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
  )
  upsertPlan(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
    @Body() dto: UpsertRehearsalPlanDto,
  ) {
    return this.rehearsals.upsertPlan(user.sub, eventId, dto);
  }

  @Post('plans/:eventId/attendance')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
    PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
  )
  recordAttendance(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
    @Body() dto: RecordRehearsalAttendanceDto,
  ) {
    return this.rehearsals.recordAttendance(user.sub, eventId, dto.entries);
  }

  @Get('readiness')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  readiness(@CurrentUser() user: JwtPayload) {
    return this.rehearsals.readinessDashboard(user.sub);
  }

  @Get('attendance/events')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  attendanceEvents(@CurrentUser() user: JwtPayload) {
    return this.rehearsals.listAttendanceEvents(user.sub);
  }

  @Get('reports')
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  reports(@CurrentUser() user: JwtPayload) {
    return this.rehearsals.getReports(user.sub);
  }

  @Get('reports.pdf')
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  async reportsPdf(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    const exported = await this.rehearsals.exportReportsPdf(user.sub);
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Get('attendance/export.csv')
  @RequireAnyPermissions(...REHEARSAL_VIEW_ANY)
  async attendanceCsv(
    @CurrentUser() user: JwtPayload,
    @Query('eventId') eventId: string | undefined,
    @Res() res: Response,
  ) {
    const exported = await this.rehearsals.exportAttendanceCsv(user.sub, eventId);
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.content);
  }
}
