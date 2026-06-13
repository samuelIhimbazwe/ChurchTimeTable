import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { WelfareCaseStatus } from '@prisma/client';
import { WelfareService } from './welfare.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateWelfareCaseDto } from './dto/create-welfare-case.dto';
import { UpdateWelfareCaseDto } from './dto/update-welfare-case.dto';
import { RecordWelfareContributionDto } from './dto/record-welfare-contribution.dto';
import { RecordWelfareAssistanceDto } from './dto/record-welfare-assistance.dto';
import { UpsertWelfareCategoryDto } from './dto/upsert-welfare-category.dto';
import { SubmitMemberWelfareContributionDto } from './dto/submit-member-welfare-contribution.dto';
import { ReviewWelfareCaseDto } from './dto/review-welfare-case.dto';
import { TransitionWelfareCaseDto } from './dto/transition-welfare-case.dto';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';

const WELFARE_VIEW_ANY = [
  PERMISSIONS.CHOIR_WELFARE_VIEW,
  PERMISSIONS.CHOIR_WELFARE_MANAGE,
] as const;

@Controller('choir/welfare')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class WelfareController {
  constructor(private welfare: WelfareService) {}

  @Get('categories')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  listCategories() {
    return this.welfare.listCategories();
  }

  @Put('categories')
  @RequirePermissions(PERMISSIONS.CHOIR_WELFARE_MANAGE)
  upsertCategory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertWelfareCategoryDto,
  ) {
    return this.welfare.upsertCategory(user.sub, dto);
  }

  @Get('dashboard')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  dashboard(@CurrentUser() user: JwtPayload) {
    return this.welfare.dashboard(user.sub);
  }

  @Get('reports')
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  reports(@CurrentUser() user: JwtPayload) {
    return this.welfare.getReports(user.sub);
  }

  @Get('reports/summary.pdf')
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  async exportReportsPdf(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const exported = await this.welfare.exportReportsPdf(user.sub);
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Get('reports/cases.pdf')
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  async exportCasesPdf(
    @CurrentUser() user: JwtPayload,
    @Query('status') status: WelfareCaseStatus | undefined,
    @Res() res: Response,
  ) {
    const exported = await this.welfare.exportCasesPdf(user.sub, { status });
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Get('reports/cases.csv')
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  async exportCasesCsv(
    @CurrentUser() user: JwtPayload,
    @Query('status') status: WelfareCaseStatus | undefined,
    @Res() res: Response,
  ) {
    const exported = await this.welfare.exportCasesCsv(user.sub, { status });
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.content);
  }

  @Get('care/dashboard')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  careDashboard(@CurrentUser() user: JwtPayload) {
    return this.welfare.getCareDashboard(user.sub);
  }

  @Get('care/inbox')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  careInbox(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    return this.welfare.getCareInbox(user.sub, limit ? Number(limit) : 50);
  }

  @Get('cases')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  listCases(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('status') status?: WelfareCaseStatus,
    @Query('familyId') familyId?: string,
  ) {
    return this.welfare.listCases(user.sub, pagination.page, pagination.limit, {
      status,
      familyId,
    });
  }

  @Get('cases/:id')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  getCase(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.welfare.getCase(user.sub, id);
  }

  @Get('cases/:id/timeline')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  getCaseTimeline(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.welfare.getCaseTimeline(user.sub, id);
  }

  @Get('cases/:id/audit')
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  getCaseAudit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.welfare.getCaseAudit(user.sub, id);
  }

  @Post('cases')
  @RequirePermissions(PERMISSIONS.CHOIR_WELFARE_MANAGE)
  createCase(@CurrentUser() user: JwtPayload, @Body() dto: CreateWelfareCaseDto) {
    return this.welfare.createCase(user.sub, dto);
  }

  @Post('cases/:id/review')
  @RequirePermissions(PERMISSIONS.CHOIR_WELFARE_MANAGE)
  reviewCase(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewWelfareCaseDto,
  ) {
    return this.welfare.reviewCase(user.sub, id, dto);
  }

  @Post('cases/:id/transition')
  @RequirePermissions(PERMISSIONS.CHOIR_WELFARE_MANAGE)
  transitionCase(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: TransitionWelfareCaseDto,
  ) {
    return this.welfare.transitionCase(user.sub, id, dto);
  }

  @Patch('cases/:id')
  @RequirePermissions(PERMISSIONS.CHOIR_WELFARE_MANAGE)
  updateCase(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWelfareCaseDto,
  ) {
    return this.welfare.updateCase(user.sub, id, dto);
  }

  @Post('contributions')
  @RequirePermissions(PERMISSIONS.CHOIR_WELFARE_MANAGE)
  recordContribution(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordWelfareContributionDto,
  ) {
    return this.welfare.recordContribution(user.sub, dto);
  }

  @Post('my-contributions')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...WELFARE_VIEW_ANY)
  submitMemberContribution(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitMemberWelfareContributionDto,
  ) {
    return this.welfare.submitMemberContribution(user.sub, dto);
  }

  @Post('assistance')
  @RequirePermissions(PERMISSIONS.CHOIR_WELFARE_MANAGE)
  recordAssistance(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordWelfareAssistanceDto,
  ) {
    return this.welfare.recordAssistance(user.sub, dto);
  }
}
