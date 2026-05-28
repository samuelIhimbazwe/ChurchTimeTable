import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Post('transactions')
  @RequirePermissions(PERMISSIONS.FINANCE_WRITE)
  createTransaction(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.createTransaction(dto, user.sub);
  }

  @Get('transactions')
  @RequirePermissions(PERMISSIONS.FINANCE_READ)
  list(@Query() query: PaginationDto) {
    return this.financeService.listTransactions(query.page, query.limit);
  }

  @Get('summary')
  @RequirePermissions(PERMISSIONS.FINANCE_READ)
  summary() {
    return this.financeService.summary();
  }

  @Post('budgets')
  @RequirePermissions(PERMISSIONS.FINANCE_WRITE)
  createBudget(
    @Body() dto: CreateBudgetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.createBudget(dto, user.sub);
  }

  @Get('budgets')
  @RequirePermissions(PERMISSIONS.FINANCE_READ)
  listBudgets(@Query() query: PaginationDto) {
    return this.financeService.listBudgets(query.page, query.limit);
  }

  @Patch('budgets/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_WRITE)
  updateBudget(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBudgetDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.updateBudget(id, dto, user.sub);
  }

  @Delete('budgets/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_WRITE)
  deleteBudget(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.financeService.deleteBudget(id, user.sub);
  }

  @Post('dues')
  @RequirePermissions(PERMISSIONS.FINANCE_WRITE)
  dues(
    @Body() body: { memberId: string; period: string; amount: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.upsertMemberDues(
      body.memberId,
      body.period,
      body.amount,
      user.sub,
    );
  }

  @Post('dues/mark-paid')
  @RequirePermissions(PERMISSIONS.FINANCE_WRITE)
  markDuesPaid(
    @Body() body: { memberId: string; period: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.markDuesPaid(
      body.memberId,
      body.period,
      user.sub,
    );
  }
}
