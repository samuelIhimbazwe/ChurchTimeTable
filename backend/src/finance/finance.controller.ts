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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SuperAdminOnly } from '../common/decorators/super-admin.decorator';

const FINANCE_VIEW_ANY = [
  PERMISSIONS.FINANCE_READ,
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
  PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
] as const;

const FINANCE_MANAGE_ANY = [
  PERMISSIONS.FINANCE_WRITE,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
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
  ) {}

  @Get('stewardship/analytics')
  @RequireAnyPermissions(...FINANCE_VIEW_ANY)
  stewardshipAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('ministryScope') ministryScope?: MinistryScope,
  ) {
    return this.financeGovernance.analytics(user.sub, ministryScope);
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
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  createContribution(
    @Body() dto: CreateContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.createContribution(user.sub, dto);
  }

  @Post('contributions/:id/submit')
  submitContribution(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.submitContribution(user.sub, id);
  }

  @Post('contributions/:id/confirm')
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  confirmContribution(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.confirmContribution(user.sub, id);
  }

  @Post('contributions/:id/reject')
  @RequireAnyPermissions(...FINANCE_MANAGE_ANY)
  rejectContribution(
    @Param('id') id: string,
    @Body() dto: RejectContributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contributionService.rejectContribution(user.sub, id, dto.notes);
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

  /** Super-admin finance access requires explicit audit (Sprint 8 privacy) */
  @Get('admin/audit-summary')
  @SuperAdminOnly()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  async adminFinanceAudit(@CurrentUser() user: JwtPayload) {
    const data = await this.financeGovernance.analytics(user.sub);
    return {
      ...data,
      auditNote: 'Super-admin finance view — logged for accountability',
    };
  }
}
