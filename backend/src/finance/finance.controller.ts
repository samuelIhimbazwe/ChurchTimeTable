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
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import {
  ADMIN_AUDIT_ACCESS,
  FINANCE_MANAGE_PERMISSIONS,
  FINANCE_VIEW_PERMISSIONS,
  PERMISSIONS,
} from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

const FINANCE_VIEW_ANY = FINANCE_VIEW_PERMISSIONS;
const FINANCE_MANAGE_ANY = FINANCE_MANAGE_PERMISSIONS;

/** Choir treasurer / family coordinator contribution stewardship (Sprint 10) */
const CONTRIBUTION_RECORD_WRITE_ANY = [
  ...FINANCE_MANAGE_PERMISSIONS,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST,
] as const;

const STEWARDSHIP_ANALYTICS_ANY = [
  ...FINANCE_VIEW_PERMISSIONS,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST,
] as const;

const CONTRIBUTION_LIST_VIEW_ANY = [
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST,
] as const;

const MEMBER_CONTRIBUTION_ACCESS = [
  PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT,
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  ...FINANCE_VIEW_ANY,
] as const;

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
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
  @RequirePermissions(PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT)
  submitMemberContribution(
    @Body() dto: SubmitContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionSubmission.submit(user.sub, dto);
  }

  @Get('contributions/submit-options')
  @RequirePermissions(PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT)
  @SkipPhoneEnforcement()
  contributionSubmitOptions(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.contributionSubmission.getSubmitOptions(user.sub, choirId);
  }

  @Post('contributions/protocol/submit')
  @RequirePermissions(PERMISSIONS.PROTOCOL_CONTRIBUTION_SUBMIT)
  submitProtocolContribution(
    @Body() dto: SubmitContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionProtocol.submit(user.sub, dto);
  }

  @Get('contributions/protocol/submit-options')
  @RequirePermissions(PERMISSIONS.PROTOCOL_CONTRIBUTION_SUBMIT)
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
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    PERMISSIONS.CHOIR_FINANCE_MANAGE,
    PERMISSIONS.CHOIR_FINANCE_APPROVE,
    PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  )
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
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
    PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  )
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
  @RequireAnyPermissions(...CONTRIBUTION_LIST_VIEW_ANY)
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
  @RequireAnyPermissions(...FINANCE_VIEW_ANY)
  contributionQueue(@CurrentUser() user: JwtPayload) {
    return this.contributionService.getConfirmationQueue(user.sub);
  }

  @Post('contributions')
  @RequireAnyPermissions(...CONTRIBUTION_RECORD_WRITE_ANY)
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
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_FINANCE_APPROVE,
    PERMISSIONS.CHOIR_FINANCE_MANAGE,
    PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  )
  treasuryContributionDashboard(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.contributionGovernance.getTreasuryDashboard(user.sub, choirId);
  }

  @Get('contributions/treasury/inbox')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_FINANCE_APPROVE,
    PERMISSIONS.CHOIR_FINANCE_MANAGE,
    PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  )
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
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_FINANCE_APPROVE,
    PERMISSIONS.CHOIR_FINANCE_MANAGE,
  )
  verifyTreasuryContribution(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionGovernance.verifyTreasury(user.sub, id);
  }

  @Post('contributions/:id/treasury/reject')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_FINANCE_APPROVE,
    PERMISSIONS.CHOIR_FINANCE_MANAGE,
  )
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
  @RequireAnyPermissions(...STEWARDSHIP_ANALYTICS_ANY)
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
  @RequireAnyPermissions(...CONTRIBUTION_RECORD_WRITE_ANY)
  confirmContribution(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.confirmContribution(user.sub, id);
  }

  @Post('contributions/:id/reject')
  @RequireAnyPermissions(...CONTRIBUTION_RECORD_WRITE_ANY)
  rejectContribution(
    @Param('id') id: string,
    @Body() dto: RejectContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.rejectContribution(user.sub, id, dto.notes);
  }

  @Post('contributions/:id/resend-thank-you')
  @RequireAnyPermissions(...CONTRIBUTION_RECORD_WRITE_ANY)
  resendThankYou(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.thankYouService.resendContributionThankYou(user.sub, id);
  }

  @Get('export/csv')
  @RequireAnyPermissions(...FINANCE_VIEW_ANY)
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
  @RequireAnyPermissions(...FINANCE_VIEW_ANY)
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
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
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
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  createTransaction(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.createTransaction(dto, user.sub);
  }

  @Get('transactions')
  @RequireAnyPermissions(...FINANCE_VIEW_ANY)
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
  @RequireAnyPermissions(...FINANCE_VIEW_ANY)
  summary(
    @CurrentUser() user: JwtPayload,
    @Query('ministryScope') ministryScope?: MinistryScope,
  ) {
    return this.financeService.summary(user.sub, ministryScope);
  }

  @Post('transactions/:id/approve')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_FINANCE_APPROVE,
    PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
    PERMISSIONS.CHOIR_FINANCE_MANAGE,
    PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  )
  approveTransaction(
    @Param('id') id: string,
    @Body('approve') approve: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeGovernance.approveTransaction(user.sub, id, approve !== false);
  }

  @Patch('transactions/:id/receipt')
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  attachReceipt(
    @Param('id') id: string,
    @Body('receiptUrl') receiptUrl: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeGovernance.attachReceipt(user.sub, id, receiptUrl);
  }

  @Post('budgets')
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  createBudget(
    @Body() dto: CreateBudgetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.createBudget(dto, user.sub);
  }

  @Get('budgets')
  @RequireAnyPermissions(...FINANCE_VIEW_ANY)
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
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  updateBudget(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBudgetDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.updateBudget(id, dto, user.sub);
  }

  @Delete('budgets/:id')
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  deleteBudget(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.financeService.deleteBudget(id, user.sub);
  }

  @Post('dues')
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  dues(@Body() dto: UpsertMemberDuesDto, @CurrentUser() user: JwtPayload) {
    return this.financeService.upsertMemberDues(dto, user.sub);
  }

  @Post('dues/mark-paid')
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
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
  @RequirePermissions(PERMISSIONS.CHOIR_CONTRIBUTION_TYPE_MANAGE)
  listContributionCatalog(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.contributionCatalogAdmin.listCatalog(user.sub, choirId);
  }

  @Post('contributions/admin/catalog')
  @RequirePermissions(PERMISSIONS.CHOIR_CONTRIBUTION_TYPE_MANAGE)
  createContributionCatalog(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Body() dto: CreateContributionCatalogDto,
  ) {
    return this.contributionCatalogAdmin.createCatalog(user.sub, choirId, dto);
  }

  @Patch('contributions/admin/catalog/:id')
  @RequirePermissions(PERMISSIONS.CHOIR_CONTRIBUTION_TYPE_MANAGE)
  updateContributionCatalog(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContributionCatalogDto,
  ) {
    return this.contributionCatalogAdmin.updateCatalog(user.sub, id, dto);
  }

  @Get('contributions/admin/campaigns')
  @SkipPhoneEnforcement()
  @RequirePermissions(PERMISSIONS.CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE)
  listContributionCampaigns(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.contributionCatalogAdmin.listCampaigns(user.sub, choirId);
  }

  @Post('contributions/admin/campaigns')
  @RequirePermissions(PERMISSIONS.CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE)
  createContributionCampaign(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
    @Body() dto: CreateContributionCampaignDto,
  ) {
    return this.contributionCatalogAdmin.createCampaign(user.sub, choirId, dto);
  }

  @Patch('contributions/admin/campaigns/:id')
  @RequirePermissions(PERMISSIONS.CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE)
  updateContributionCampaign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContributionCampaignDto,
  ) {
    return this.contributionCatalogAdmin.updateCampaign(user.sub, id, dto);
  }

  /** Platform finance audit — requires admin audit visibility */
  @Get('admin/audit-summary')
  @RequireAnyPermissions(...ADMIN_AUDIT_ACCESS)
  async adminFinanceAudit(@CurrentUser() user: JwtPayload) {
    const data = await this.financeGovernance.analytics(user.sub);
    return {
      ...data,
      auditNote: 'Super-admin finance view — logged for accountability',
    };
  }
}
