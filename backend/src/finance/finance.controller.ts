import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { MinistryScope } from '@prisma/client';
import { FinanceService } from './finance.service';
import { FinanceGovernanceService } from './finance-governance.service';
import { FinanceExportService } from './finance-export.service';
import { ReceiptUploadService } from './receipt/receipt-upload.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpsertMemberDuesDto } from './dto/upsert-member-dues.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { RejectContributionDto } from './dto/reject-contribution.dto';
import { ContributionService } from './contribution.service';
import { ContributionGovernanceService } from './contribution-governance.service';
import { CloseTreasuryPeriodDto } from './dto/close-treasury-period.dto';
import { ContributionTotalsService } from './contribution-totals.service';
import { ContributionListService } from './contribution-list.service';
import { ContributionRankingsService } from './contribution-rankings.service';
import { ContributionCorrectionService } from './contribution-correction.service';
import { ContributionTimelineService } from './contribution-timeline.service';
import { ChangeContributionFamilyDto } from './dto/change-contribution-family.dto';
import { ChangeContributionTypeDto } from './dto/change-contribution-type.dto';
import { ChangeContributionCampaignDto } from './dto/change-contribution-campaign.dto';
import { ContributionTotalsQueryDto } from './dto/contribution-totals-query.dto';
import { ContributionByTypeQueryDto } from './dto/contribution-by-type-query.dto';
import { ContributionRankingsQueryDto } from './dto/contribution-rankings-query.dto';
import { ThankYouService } from './thank-you.service';
import { AdjustContributionDto } from './dto/adjust-contribution.dto';
import { ApproveContributionDto } from './dto/approve-contribution.dto';
import { RejectFamilyContributionDto } from './dto/reject-family-contribution.dto';
import { SubmitContributionDto } from './dto/submit-contribution.dto';
import { ContributionSubmissionService } from './contribution-submission.service';
import { ContributionProtocolService } from './contribution-protocol.service';
import { ContributionCatalogAdminService } from './contribution-catalog-admin.service';
import { ContributionMemberService } from './contribution-member.service';
import { CreateContributionCatalogDto } from './dto/create-contribution-catalog.dto';
import { UpdateContributionCatalogDto } from './dto/update-contribution-catalog.dto';
import { CreateContributionCampaignDto } from './dto/create-contribution-campaign.dto';
import { UpdateContributionCampaignDto } from './dto/update-contribution-campaign.dto';
import { ContributionFamilyContextService } from './contribution-family-context.service';
import { ContributionFamilyDashboardService } from './contribution-family-dashboard.service';
import { FamilyDashboardQueryDto } from './dto/family-dashboard-query.dto';
import { FamilyLedgerQueryDto } from './dto/family-ledger-query.dto';
import { ContributionAdjustmentsListService } from './contribution-adjustments-list.service';
import { ContributionQuickActionService } from './contribution-quick-action.service';
import {
  QuickActionApproveDto,
  QuickActionPreviewQueryDto,
} from './dto/quick-action-approve.dto';
import { ContributionStatus } from '@prisma/client';
import { MemberContributionsQueryDto } from './dto/member-contributions-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class FinanceController {
  constructor(
    private financeService: FinanceService,
    private financeGovernance: FinanceGovernanceService,
    private financeExport: FinanceExportService,
    private receiptUpload: ReceiptUploadService,
    private contributionService: ContributionService,
    private contributionGovernance: ContributionGovernanceService,
    private contributionTotals: ContributionTotalsService,
    private contributionList: ContributionListService,
    private contributionRankings: ContributionRankingsService,
    private contributionCorrections: ContributionCorrectionService,
    private contributionTimeline: ContributionTimelineService,
    private contributionSubmission: ContributionSubmissionService,
    private contributionProtocol: ContributionProtocolService,
    private contributionCatalogAdmin: ContributionCatalogAdminService,
    private contributionMember: ContributionMemberService,
    private contributionFamilyContext: ContributionFamilyContextService,
    private contributionFamilyDashboard: ContributionFamilyDashboardService,
    private contributionAdjustmentsList: ContributionAdjustmentsListService,
    private thankYouService: ThankYouService,
    private contributionQuickAction: ContributionQuickActionService,
  ) {}

  @Post('contributions/submit')
  @RequireUiCapability('contribution-submit')
  submitMemberContribution(
    @Body() dto: SubmitContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionSubmission.submit(user.sub, dto);
  }

  @Get('contributions/submit-options')
  @RequireUiCapability('contribution-submit')
  @SkipPhoneEnforcement()
  contributionSubmitOptions(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.contributionSubmission.getSubmitOptions(user.sub, choirId);
  }

  @Post('contributions/protocol/submit')
  @RequireUiCapability('protocol-contribution-submit')
  submitProtocolContribution(
    @Body() dto: SubmitContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionProtocol.submit(user.sub, dto);
  }

  @Get('contributions/protocol/submit-options')
  @RequireUiCapability('protocol-contribution-submit')
  @SkipPhoneEnforcement()
  protocolContributionSubmitOptions(@CurrentUser() user: JwtPayload) {
    return this.contributionProtocol.getSubmitOptions(user.sub);
  }

  @Get('contributions/member')
  @SkipPhoneEnforcement()
  listMemberContributions(
    @CurrentUser() user: JwtPayload,
    @Query() query: MemberContributionsQueryDto,
  ) {
    return this.contributionMember.listMine(user.sub, query);
  }

  @Get('contributions/family/context')
  @SkipPhoneEnforcement()
  familyContributionContext(@CurrentUser() user: JwtPayload) {
    return this.contributionFamilyContext.getLeadershipContext(user.sub);
  }

  @Get('contributions/family/dashboard')
  @SkipPhoneEnforcement()
  familyContributionDashboard(
    @CurrentUser() user: JwtPayload,
    @Query() query: FamilyDashboardQueryDto,
  ) {
    return this.contributionFamilyDashboard.getDashboard(
      user.sub,
      query.familyId,
      query.campaignId,
    );
  }

  @Get('contributions/family/member-progress')
  @SkipPhoneEnforcement()
  familyContributionMemberProgress(
    @CurrentUser() user: JwtPayload,
    @Query() query: FamilyDashboardQueryDto,
  ) {
    return this.contributionFamilyDashboard.getMemberProgress(
      user.sub,
      query.familyId,
      query.campaignId,
    );
  }

  @Get('contributions/family/ledger')
  @SkipPhoneEnforcement()
  familyContributionLedger(
    @CurrentUser() user: JwtPayload,
    @Query() query: FamilyLedgerQueryDto,
  ) {
    return this.contributionFamilyDashboard.getLedger(user.sub, query);
  }

  @Get('contributions/family/inbox')
  @SkipPhoneEnforcement()
  familyContributionInbox(
    @CurrentUser() user: JwtPayload,
    @Query('familyId') familyId?: string,
    @Query('status') status?: ContributionStatus,
    @Query('limit') limit?: string,
  ) {
    return this.contributionGovernance.getFamilyInbox(
      user.sub,
      familyId,
      status,
      limit ? Number(limit) : 30,
    );
  }

  @Get('contributions/sponsor/inbox')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-sponsor-inbox')
  sponsorContributionInbox(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Query('status') status?: ContributionStatus,
    @Query('limit') limit?: string,
  ) {
    return this.contributionGovernance.getSponsorInbox(
      user.sub,
      choirId,
      status,
      limit ? Number(limit) : 30,
    );
  }

  @Get('contributions/protocol/inbox')
  @SkipPhoneEnforcement()
  @RequireUiCapability('protocol-finance-inbox')
  protocolContributionInbox(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: ContributionStatus,
    @Query('limit') limit?: string,
  ) {
    return this.contributionGovernance.getProtocolInbox(
      user.sub,
      status,
      limit ? Number(limit) : 30,
    );
  }

  @Get('contributions')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-list-view')
  listContributions(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('ministryScope') ministryScope?: MinistryScope,
    @Query('status') status?: ContributionStatus,
    @Query('familyOnly') familyOnly?: string,
  ) {
    return this.contributionGovernance.listAllContributions(
      user.sub,
      limit ? Number(limit) : 50,
      ministryScope ?? MinistryScope.CHOIR,
      status,
      familyOnly === 'true',
    );
  }

  @Get('contributions/totals')
  @SkipPhoneEnforcement()
  getContributionTotals(
    @CurrentUser() user: JwtPayload,
    @Query() query: ContributionTotalsQueryDto,
  ) {
    return this.contributionTotals.getTotals(user.sub, query);
  }

  @Get('contributions/rankings')
  @SkipPhoneEnforcement()
  getContributionRankings(
    @CurrentUser() user: JwtPayload,
    @Query() query: ContributionRankingsQueryDto,
  ) {
    return this.contributionRankings.getRankings(user.sub, query);
  }

  @Get('contributions/adjustments/recent')
  @SkipPhoneEnforcement()
  recentContributionAdjustments(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    return this.contributionAdjustmentsList.listRecent(
      user.sub,
      limit ? Number(limit) : 20,
    );
  }

  @Get('contributions/by-type/:catalogId')
  @SkipPhoneEnforcement()
  contributionsByType(
    @Param('catalogId') catalogId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: ContributionByTypeQueryDto,
  ) {
    return this.contributionList.listByType(user.sub, catalogId, query);
  }

  @Get('contributions/mine')
  @SkipPhoneEnforcement()
  memberContributions(@CurrentUser() user: JwtPayload) {
    return this.financeGovernance.memberContributions(user.sub);
  }

  @Get('my-contributions')
  @SkipPhoneEnforcement()
  myContributions(@CurrentUser() user: JwtPayload) {
    return this.financeGovernance.memberContributions(user.sub);
  }

  @Get('my-contributions/summary')
  @SkipPhoneEnforcement()
  myContributionsSummary(@CurrentUser() user: JwtPayload) {
    return this.contributionService.getMemberContributionSummary(user.sub);
  }

  @Get('contributions/queue')
  @RequireUiCapability('contribution-finance-view')
  contributionQueue(@CurrentUser() user: JwtPayload) {
    return this.contributionService.getConfirmationQueue(user.sub);
  }

  @Post('contributions')
  @RequireUiCapability('contribution-record-write')
  createContribution(
    @Body() dto: CreateContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.createContribution(user.sub, dto);
  }

  @Get('contributions/mine/export/csv')
  @SkipPhoneEnforcement()
  async memberContributionsCsv(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const exported = await this.financeExport.exportMemberContributionsCsv(
      user.sub,
    );
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.content);
  }

  @Get('contributions/mine/export/pdf')
  async memberContributionsPdf(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const exported = await this.financeExport.exportMemberContributionsPdf(
      user.sub,
    );
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Get('contributions/treasury/dashboard')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-treasury-operations')
  treasuryContributionDashboard(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.contributionGovernance.getTreasuryDashboard(user.sub, choirId);
  }

  @Get('contributions/treasury/inbox')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-treasury-operations')
  treasuryContributionInbox(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Query('limit') limit?: string,
  ) {
    return this.contributionGovernance.getTreasuryInbox(
      user.sub,
      choirId,
      limit ? Number(limit) : 30,
    );
  }

  @Get('contributions/treasury/export/pdf')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-treasury-operations')
  async treasuryPeriodExportPdf(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Query('month') month: string | undefined,
    @Res() res: Response,
  ) {
    const exported = await this.contributionGovernance.exportTreasuryPeriodPack(
      user.sub,
      choirId,
      month,
    );
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Post('contributions/treasury/period-close')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-treasury-operations')
  closeTreasuryPeriod(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Body() dto: CloseTreasuryPeriodDto,
  ) {
    return this.contributionGovernance.closeTreasuryPeriod(
      user.sub,
      choirId,
      dto,
    );
  }

  @Get('contributions/:id/timeline')
  @SkipPhoneEnforcement()
  getContributionTimeline(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionTimeline.getTimeline(user.sub, id);
  }

  @Get('contributions/:id')
  @SkipPhoneEnforcement()
  getMemberContribution(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionMember.getByIdForActor(user.sub, id);
  }

  @Post('contributions/:id/change-family')
  @SkipPhoneEnforcement()
  changeContributionFamily(
    @Param('id') id: string,
    @Body() dto: ChangeContributionFamilyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionCorrections.changeFamily(user.sub, id, dto);
  }

  @Post('contributions/:id/change-type')
  @SkipPhoneEnforcement()
  changeContributionType(
    @Param('id') id: string,
    @Body() dto: ChangeContributionTypeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionCorrections.changeType(user.sub, id, dto);
  }

  @Post('contributions/:id/change-campaign')
  @SkipPhoneEnforcement()
  changeContributionCampaign(
    @Param('id') id: string,
    @Body() dto: ChangeContributionCampaignDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionCorrections.changeCampaign(user.sub, id, dto);
  }

  @Get('contributions/quick-action/preview')
  @SkipPhoneEnforcement()
  previewContributionQuickAction(
    @Query() query: QuickActionPreviewQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionQuickAction.preview(user.sub, query.token);
  }

  @Post('contributions/quick-action/approve')
  @SkipPhoneEnforcement()
  approveContributionQuickAction(
    @Body() dto: QuickActionApproveDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionQuickAction.approve(user.sub, dto);
  }

  @Post('contributions/:id/treasury/verify')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-treasury-operations')
  verifyTreasuryContribution(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionGovernance.verifyTreasury(user.sub, id);
  }

  @Post('contributions/:id/treasury/reject')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-treasury-operations')
  rejectTreasuryContribution(
    @Param('id') id: string,
    @Body() dto: RejectFamilyContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionGovernance.rejectTreasury(user.sub, id, dto);
  }

  @Post('contributions/:id/family/approve')
  @SkipPhoneEnforcement()
  approveFamilyContribution(
    @Param('id') id: string,
    @Body() dto: ApproveContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionGovernance.approveFamily(user.sub, id, dto);
  }

  @Post('contributions/:id/family/reject')
  @SkipPhoneEnforcement()
  rejectFamilyContribution(
    @Param('id') id: string,
    @Body() dto: RejectFamilyContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionGovernance.rejectFamily(user.sub, id, dto);
  }

  @Post('contributions/:id/adjust')
  @SkipPhoneEnforcement()
  adjustContribution(
    @Param('id') id: string,
    @Body() dto: AdjustContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionGovernance.adjustContribution(user.sub, id, dto);
  }

  @Get('stewardship/analytics')
  @RequireUiCapability('contribution-stewardship-analytics')
  stewardshipAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('ministryScope') ministryScope?: MinistryScope,
  ) {
    return this.financeGovernance.analytics(user.sub, ministryScope);
  }

  @Post('contributions/:id/submit')
  submitContribution(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.submitContribution(user.sub, id);
  }

  @Post('contributions/:id/confirm')
  @RequireUiCapability('contribution-record-write')
  confirmContribution(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.confirmContribution(user.sub, id);
  }

  @Post('contributions/:id/reject')
  @RequireUiCapability('contribution-record-write')
  rejectContribution(
    @Param('id') id: string,
    @Body() dto: RejectContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.rejectContribution(user.sub, id, dto.notes);
  }

  @Post('contributions/:id/resend-thank-you')
  @RequireUiCapability('contribution-record-write')
  resendThankYou(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.thankYouService.resendContributionThankYou(user.sub, id);
  }

  @Get('export/csv')
  @RequireUiCapability('contribution-finance-view')
  async ministryExportCsv(
    @CurrentUser() user: JwtPayload,
    @Query('ministryScope') ministryScope?: MinistryScope,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('memberId') memberId?: string,
    @Res() res?: Response,
  ) {
    const exported = await this.financeExport.exportMinistryCsv(user.sub, {
      ministryScope,
      from,
      to,
      memberId,
    });
    res!.setHeader('Content-Type', exported.mimeType);
    res!.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res!.send(exported.content);
  }

  @Get('export/pdf')
  @RequireUiCapability('contribution-finance-view')
  async ministryExportPdf(
    @CurrentUser() user: JwtPayload,
    @Query('ministryScope') ministryScope?: MinistryScope,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('memberId') memberId?: string,
    @Res() res?: Response,
  ) {
    const exported = await this.financeExport.exportMinistryPdf(user.sub, {
      ministryScope,
      from,
      to,
      memberId,
    });
    res!.setHeader('Content-Type', exported.mimeType);
    res!.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res!.send(exported.buffer);
  }

  @Post('receipts/prepare-upload')
  @RequireUiCapability('contribution-finance-manage')
  prepareReceiptUpload(
    @Body()
    body: {
      transactionId: string;
      mimeType: string;
      byteSize: number;
      originalFilename?: string;
    },
  ) {
    return this.receiptUpload.prepareUpload(body);
  }

  @Post('transactions')
  @RequireUiCapability('contribution-finance-manage')
  createTransaction(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.createTransaction(dto, user.sub);
  }

  @Get('transactions')
  @RequireUiCapability('contribution-finance-view')
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto & { ministryScope?: MinistryScope },
  ) {
    return this.financeService.listTransactions(
      user.sub,
      query.page,
      query.limit,
      query.ministryScope,
    );
  }

  @Get('summary')
  @RequireUiCapability('contribution-finance-view')
  summary(
    @CurrentUser() user: JwtPayload,
    @Query('ministryScope') ministryScope?: MinistryScope,
  ) {
    return this.financeService.summary(user.sub, ministryScope);
  }

  @Post('transactions/:id/approve')
  @RequireUiCapability('contribution-finance-approve')
  approveTransaction(
    @Param('id') id: string,
    @Body('approve') approve: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeGovernance.approveTransaction(user.sub, id, approve !== false);
  }

  @Patch('transactions/:id/receipt')
  @RequireUiCapability('contribution-finance-manage')
  attachReceipt(
    @Param('id') id: string,
    @Body('receiptUrl') receiptUrl: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeGovernance.attachReceipt(user.sub, id, receiptUrl);
  }

  @Post('budgets')
  @RequireUiCapability('contribution-finance-manage')
  createBudget(
    @Body() dto: CreateBudgetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.createBudget(dto, user.sub);
  }

  @Get('budgets')
  @RequireUiCapability('contribution-finance-view')
  listBudgets(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto & { ministryScope?: MinistryScope },
  ) {
    return this.financeService.listBudgets(
      user.sub,
      query.page,
      query.limit,
      query.ministryScope,
    );
  }

  @Patch('budgets/:id')
  @RequireUiCapability('contribution-finance-manage')
  updateBudget(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBudgetDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.updateBudget(id, dto, user.sub);
  }

  @Delete('budgets/:id')
  @RequireUiCapability('contribution-finance-manage')
  deleteBudget(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.financeService.deleteBudget(id, user.sub);
  }

  @Post('dues')
  @RequireUiCapability('contribution-finance-manage')
  dues(@Body() dto: UpsertMemberDuesDto, @CurrentUser() user: JwtPayload) {
    return this.financeService.upsertMemberDues(dto, user.sub);
  }

  @Post('dues/mark-paid')
  @RequireUiCapability('contribution-finance-manage')
  markDuesPaid(
    @Body()
    body: {
      memberId: string;
      period: string;
      ministryScope: MinistryScope;
      dueType?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.markDuesPaid(
      body.memberId,
      body.period,
      body.ministryScope,
      (body.dueType as any) ?? 'MONTHLY_DUES',
      user.sub,
    );
  }

  @Get('contributions/admin/catalog')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-catalog')
  listContributionCatalog(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.contributionCatalogAdmin.listCatalog(user.sub, choirId);
  }

  @Post('contributions/admin/catalog')
  @RequireUiCapability('contribution-catalog')
  createContributionCatalog(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Body() dto: CreateContributionCatalogDto,
  ) {
    return this.contributionCatalogAdmin.createCatalog(user.sub, choirId, dto);
  }

  @Patch('contributions/admin/catalog/:id')
  @RequireUiCapability('contribution-catalog')
  updateContributionCatalog(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContributionCatalogDto,
  ) {
    return this.contributionCatalogAdmin.updateCatalog(user.sub, id, dto);
  }

  @Get('contributions/admin/campaigns')
  @SkipPhoneEnforcement()
  @RequireUiCapability('contribution-catalog')
  listContributionCampaigns(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.contributionCatalogAdmin.listCampaigns(user.sub, choirId);
  }

  @Post('contributions/admin/campaigns')
  @RequireUiCapability('contribution-catalog')
  createContributionCampaign(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Body() dto: CreateContributionCampaignDto,
  ) {
    return this.contributionCatalogAdmin.createCampaign(user.sub, choirId, dto);
  }

  @Patch('contributions/admin/campaigns/:id')
  @RequireUiCapability('contribution-catalog')
  updateContributionCampaign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContributionCampaignDto,
  ) {
    return this.contributionCatalogAdmin.updateCampaign(user.sub, id, dto);
  }

  /** Platform finance audit — requires admin audit visibility */
  @Get('admin/audit-summary')
  @RequireUiCapability('admin-audit-view')
  async adminFinanceAudit(@CurrentUser() user: JwtPayload) {
    const data = await this.financeGovernance.analytics(user.sub);
    return {
      ...data,
      auditNote: 'Super-admin finance view — logged for accountability',
    };
  }
}
