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
        headName?: string | null
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

  listContributions: (params?: {
    limit?: number
    ministryScope?: string
    status?: string
    familyOnly?: boolean
  }) =>
    apiClient.get<never, { items: unknown[] }>('/finance/contributions', {
      params: {
        ...params,
        familyOnly: params?.familyOnly ? 'true' : undefined,
      },
    }),

  getRecentAdjustments: (params?: { limit?: number }) =>
    apiClient.get<never, { items: unknown[] }>('/finance/contributions/adjustments/recent', { params }),

  getMyContributionTotals: () =>
    apiClient.get<never, MemberContributionTotals>(
      '/finance/contributions/totals',
      { params: { scope: 'own' } },
    ),

  getFamilyContributionDashboard: (params?: { familyId?: string; campaignId?: string }) =>
    apiClient.get<never, FamilyContributionDashboard>(
      '/finance/contributions/family/dashboard',
      { params },
    ),

  getFamilyMemberProgress: (params?: { familyId?: string; campaignId?: string }) =>
    apiClient.get<never, FamilyMemberProgressResponse>(
      '/finance/contributions/family/member-progress',
      { params },
    ),

  getFamilyContributionLedger: (params?: {
    familyId?: string
    memberId?: string
    status?: string
    contributionTypeCatalogId?: string
    from?: string
    to?: string
    page?: number
    limit?: number
  }) =>
    apiClient.get<never, { items: FamilyLedgerRow[]; total: number; page: number; limit: number }>(
      '/finance/contributions/family/ledger',
      { params },
    ),

  previewContributionQuickAction: (token: string) =>
    apiClient.get<
      never,
      {
        contributionId: string
        referenceNumber: string
        memberName: string
        claimedAmount: number
        currency: string
        familyName: string | null
        status: string
        canExecute: boolean
        choirId: string | null
        paymentAt: string | null
        paymentChannel: string | null
      }
    >('/finance/contributions/quick-action/preview', { params: { token } }),

  approveContributionQuickAction: (payload: {
    token: string
    confirmedAmount?: number
    discrepancyReason?: string
  }) =>
    apiClient.post<never, unknown>(
      '/finance/contributions/quick-action/approve',
      payload,
    ),
}

export type FamilyContributionDashboard = {
  familyId: string
  familyCode: string | null
  familyName: string
  memberCount: number
  role?: string
  canApprove: boolean
  isViewOnly: boolean
  delegationEnabled: boolean
  campaign: {
    campaignId: string
    name: string
    typeName?: string
    contributionTypeCatalogId?: string
    familyGoalAmount: number
    memberGoalAmount: number | null
    status: string
  } | null
  collectedEffective: number
  remaining: number
  progressPct: number
  pendingCount: number
  oldestPendingHours?: number | null
  workflowAlerts?: string[]
  summary: {
    membersCompletedGoal: number
    membersBehindTarget: number
    membersWithNoContribution: number
    memberGoalAmount: number | null
  }
}

export type FamilyMemberProgressRow = {
  memberId: string
  memberNumber: string | null
  memberName: string
  memberGoalAmount: number | null
  confirmedEffective: number
  remaining: number | null
  progressPct: number | null
}

export type FamilyMemberProgressResponse = {
  summary: FamilyContributionDashboard['summary']
  items: FamilyMemberProgressRow[]
}

export type FamilyLedgerRow = {
  id: string
  referenceNumber: string
  status: string
  displayStatus: string
  memberNumber: string | null
  memberName: string
  memberPhone?: string | null
  typeName: string | null
  claimedAmount: number
  confirmedAmount: number | null
  paymentAt: string | null
  paymentChannel: string | null
  notes: string | null
  discrepancyReason: string | null
  familyApprovedByName: string | null
  familyApprovedAt: string | null
  thankYouDeliveryStatus: string
  thankYouSentAt: string | null
  createdAt: string
}

export type MemberContributionGoal = {
  campaignId: string
  name: string
  typeName?: string
  typeCode?: string
  contributionTypeCatalogId?: string
  memberGoalAmount?: number
  confirmedEffective: number
  progressPct: number
  remaining?: number | null
}

export type MemberContributionTotals = {
  scope: string
  member?: {
    memberNumber: string | null
    memberName: string
    familyName: string | null
  }
  pending: { count: number; claimedTotal: number }
  rejected: { count: number }
  confirmed: { count: number; effectiveTotal: number }
  byCampaign?: MemberContributionGoal[]
}
