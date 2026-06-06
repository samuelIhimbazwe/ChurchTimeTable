import { apiClient } from '../client'

export const financeApi = {
  getStewardshipAnalytics: (ministryScope?: string) =>
    apiClient.get<never, Record<string, unknown>>('/finance/stewardship/analytics', {
      params: ministryScope ? { ministryScope } : undefined,
    }),

  getTransactions: (params?: { page?: number; limit?: number }) =>
    apiClient.get<never, unknown>('/finance/transactions', { params }),

  getBudgets: (params?: { ministryScope?: string }) =>
    apiClient.get<never, unknown>('/finance/budgets', { params }),

  createBudget: (data: {
    ministryScope: string
    name: string
    amount: number
    periodStart: string
    periodEnd: string
    kind?: string
  }) => apiClient.post<never, unknown>('/finance/budgets', data),

  getFinanceSummary: (params?: { ministryScope?: string }) =>
    apiClient.get<never, Record<string, unknown>>('/finance/summary', { params }),

  getContributionSubmitOptions: () =>
    apiClient.get<never, Record<string, unknown>>('/finance/contributions/submit-options'),

  getContributionQueue: (params?: { status?: string }) =>
    apiClient.get<never, unknown>('/finance/contributions/queue', { params }),

  getContributionRankings: (params?: { period?: string }) =>
    apiClient.get<never, unknown[]>('/finance/contributions/rankings', { params }),

  getFamilyContributionContext: () =>
    apiClient.get<never, {
      families: Array<{
        familyId: string
        familyCode: string | null
        familyName: string
        role: string
        canApprove: boolean
        canViewInbox: boolean
        isViewOnly: boolean
      }>
      requiresFamilyPicker: boolean
      canViewAllFamilies: boolean
    }>('/finance/contributions/family/context'),

  getFamilyContributionInbox: (params?: { familyId?: string; status?: string; limit?: number }) =>
    apiClient.get<never, unknown>('/finance/contributions/family/inbox', { params }),

  approveFamilyContribution: (
    contributionId: string,
    payload: { confirmedAmount: number; discrepancyReason?: string },
  ) =>
    apiClient.post<never, unknown>(
      `/finance/contributions/${contributionId}/family/approve`,
      payload,
    ),

  rejectFamilyContribution: (
    contributionId: string,
    payload: { rejectionReason: string },
  ) =>
    apiClient.post<never, unknown>(
      `/finance/contributions/${contributionId}/family/reject`,
      payload,
    ),

  adjustContribution: (
    contributionId: string,
    payload: {
      adjustmentAmount: number
      category: string
      reason: string
    },
  ) =>
    apiClient.post<never, unknown>(
      `/finance/contributions/${contributionId}/adjust`,
      payload,
    ),

  listContributions: (params?: { limit?: number }) =>
    apiClient.get<never, { items: unknown[] }>('/finance/contributions', { params }),

  getRecentAdjustments: (params?: { limit?: number }) =>
    apiClient.get<never, { items: unknown[] }>('/finance/contributions/adjustments/recent', { params }),
}
