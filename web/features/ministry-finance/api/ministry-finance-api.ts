import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";

export interface MinistryFundRow {
  id: string;
  name: string;
  type: string;
  balance?: number;
  description?: string | null;
}

export interface MinistryBudgetRow {
  id: string;
  name: string;
  fiscalYear: number;
  totalBudget: string;
  status: string;
  categories: Array<{
    id: string;
    name: string;
    allocatedAmount: string;
    spentAmount: string;
    remainingAmount: string;
  }>;
}

export interface MinistryExpenseRow {
  id: string;
  amount: string;
  description: string;
  status: string;
  expenseDate: string;
  fund: { id: string; name: string };
}

export interface MinistryFinanceSummary {
  ministryId: string;
  totalFundBalance: number;
  activeBudgets: number;
  fundBalances: Array<{ id: string; name: string; type: string; balance: number }>;
  recentExpenses: MinistryExpenseRow[];
  budgetUtilization: Array<{
    budgetId: string;
    name: string;
    fiscalYear: number;
    allocated: number;
    spent: number;
    utilizationPct: number;
  }>;
  alerts: Array<{ type: string; fundId: string; name: string }>;
}

export async function fetchMinistryFinanceSummary(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryFinanceSummary>>(
    `/ministries/${ministryId}/finance/summary`,
  );
  return res.data.data;
}

export async function fetchMinistryFunds(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryFundRow[]>>(
    `/ministries/${ministryId}/finance/funds`,
  );
  return res.data.data;
}

export async function fetchMinistryBudgets(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryBudgetRow[]>>(
    `/ministries/${ministryId}/finance/budgets`,
  );
  return res.data.data;
}

export async function fetchMinistryExpenses(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryExpenseRow[]>>(
    `/ministries/${ministryId}/finance/expenses`,
  );
  return res.data.data;
}

export async function fetchMinistryFinanceReports(ministryId: string, year?: number) {
  const res = await http.get<ApiEnvelope<unknown>>(
    `/ministries/${ministryId}/finance/reports`,
    { params: year ? { year } : undefined },
  );
  return res.data.data;
}
