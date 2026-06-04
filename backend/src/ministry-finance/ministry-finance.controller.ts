import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  MinistryExpenseStatus,
  MinistryFundType,
} from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import {
  MinistryBudgetsService,
  MinistryExpensesService,
  MinistryFundsService,
} from './ministry-finance.services';
import { MinistryFinanceReportsService } from './ministry-finance-reports.service';

@Controller('ministries/:ministryId/finance')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MinistryFinanceController {
  constructor(
    private funds: MinistryFundsService,
    private budgets: MinistryBudgetsService,
    private expenses: MinistryExpensesService,
    private reportsService: MinistryFinanceReportsService,
  ) {}

  @Get('summary')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_VIEW)
  summary(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
  ) {
    return this.reportsService.summary(userId, ministryId);
  }

  @Get('funds')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_VIEW)
  listFunds(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
  ) {
    return this.funds.list(userId, ministryId);
  }

  @Post('funds')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_MANAGE)
  createFund(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Body()
    dto: { name: string; description?: string; type?: MinistryFundType },
  ) {
    return this.funds.create(userId, ministryId, dto);
  }

  @Post('funds/:fundId/deposits')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_MANAGE)
  deposit(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Param('fundId') fundId: string,
    @Body() dto: { amount: number; description?: string },
  ) {
    return this.funds.deposit(userId, ministryId, fundId, dto);
  }

  @Post('transfers')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_MANAGE)
  transfer(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Body()
    dto: {
      fromFundId: string;
      toFundId: string;
      amount: number;
      reason?: string;
    },
  ) {
    return this.funds.transfer(userId, ministryId, dto);
  }

  @Get('budgets')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_VIEW)
  listBudgets(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
  ) {
    return this.budgets.list(userId, ministryId);
  }

  @Post('budgets')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_MANAGE)
  createBudget(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Body()
    dto: {
      name: string;
      fiscalYear: number;
      totalBudget: number;
      notes?: string;
      categories?: Array<{ name: string; allocatedAmount: number }>;
    },
  ) {
    return this.budgets.create(userId, ministryId, dto);
  }

  @Post('budgets/:budgetId/activate')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_MANAGE)
  activateBudget(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Param('budgetId') budgetId: string,
  ) {
    return this.budgets.activate(userId, ministryId, budgetId);
  }

  @Get('expenses')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_VIEW)
  listExpenses(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Query('status') status?: MinistryExpenseStatus,
  ) {
    return this.expenses.list(userId, ministryId, status);
  }

  @Post('expenses')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_EXPENSE_CREATE)
  createExpense(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Body()
    dto: {
      fundId: string;
      amount: number;
      description: string;
      categoryId?: string;
      budgetId?: string;
      expenseDate?: string;
      receiptUrls?: string[];
    },
  ) {
    return this.expenses.create(userId, ministryId, dto);
  }

  @Post('expenses/:expenseId/submit')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_EXPENSE_CREATE)
  submitExpense(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expenses.submit(userId, ministryId, expenseId);
  }

  @Post('expenses/:expenseId/approve')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_EXPENSE_APPROVE)
  approveExpense(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expenses.approve(userId, ministryId, expenseId);
  }

  @Post('expenses/:expenseId/reject')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_EXPENSE_APPROVE)
  rejectExpense(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expenses.reject(userId, ministryId, expenseId);
  }

  @Post('expenses/:expenseId/pay')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_MANAGE)
  payExpense(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expenses.markPaid(userId, ministryId, expenseId);
  }

  @Get('reports')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_REPORT)
  reports(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Query('year') year?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return Promise.all([
      this.reportsService.fundBalances(userId, ministryId),
      this.reportsService.expenseSummary(userId, ministryId),
      this.reportsService.categorySpending(userId, ministryId),
      this.reportsService.yearSummary(userId, ministryId, y),
    ]).then(([funds, expenses, categories, yearSummary]) => ({
      funds,
      expenses,
      categories,
      yearSummary,
    }));
  }

  @Get('reports/export')
  @RequirePermissions(PERMISSIONS.MINISTRY_FINANCE_REPORT)
  async exportReport(
    @CurrentUser('sub') userId: string,
    @Param('ministryId') ministryId: string,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response,
  ) {
    const file =
      format === 'pdf'
        ? await this.reportsService.exportPdf(userId, ministryId)
        : await this.reportsService.exportCsv(userId, ministryId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    if (Buffer.isBuffer(file.content)) {
      res.send(file.content);
    } else {
      res.send(file.content);
    }
  }
}
