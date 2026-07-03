import { apiClient } from '../client'

export type ContributionTypeOption = {
  id: string
  code: string
  name: string
}

export type FamilyPaymentInstructions = {
  momoNumber: string | null
  momoAccountName: string | null
  bankAccount: string | null
  bankName: string | null
  instructions: string | null
}

export type SponsorChoirGivingContext = {
  id: string
  name: string
  code: string
  payment: FamilyPaymentInstructions
}

export type SubmitContributionContext = {
  mode?: 'family' | 'sponsor' | 'none'
  types: ContributionTypeOption[]
  family: {
    id: string
    code: string
    name: string
    headName: string | null
    payment: FamilyPaymentInstructions
  } | null
  sponsorChoir?: SponsorChoirGivingContext | null
  sponsorChoirs?: SponsorChoirGivingContext[]
  campaigns: Array<{
    id: string
    name: string
    contributionTypeCatalogId: string
    goalAmount: number
    status: string
  }>
}

export type TreasuryPeriodCloseStatus = {
  month: string
  monthLabel: string
  treasuryQueueEmpty: boolean
  sponsorQueueEmpty: boolean
  exportGenerated: boolean
  exportGeneratedAt: string | null
  exportGeneratedBy: string | null
  monthClosed: boolean
  closedAt: string | null
  closedBy: string | null
  canClose: boolean
  checklistComplete: number
  checklistTotal: number
}

export type ContributionClaim = {
  id: string
  referenceNumber?: string
  status: string
  memberId?: string
  memberName?: string
  memberNumber?: string
  memberPhone?: string | null
  familyId?: string
  familyName?: string | null
  familyCode?: string | null
  familyApprovedByName?: string | null
  familyApprovedByNumber?: string | null
  familyRejectedByName?: string | null
  familyApprovedAt?: string | null
  familyRejectedAt?: string | null
  claimedAmount: number
  confirmedAmount: number | null
  effectiveAmount?: number | null
  discrepancyAmount?: number | null
  discrepancyReason?: string | null
  rejectionReason?: string | null
  currency?: string
  paymentAt?: string | null
  paymentChannel?: string | null
  receiptUrl?: string | null
  typeName?: string
  campaignName?: string | null
  createdAt?: string
  notes?: string | null
  choirId?: string | null
}

export type SubmitContributionPayload = {
  contributionTypeCatalogId: string
  contributionCampaignId?: string
  claimedAmount: number
  paymentAt: string
  paymentChannel: 'MOMO' | 'BANK' | 'OTHER'
  currency?: string
  notes?: string
  customTypeLabel?: string
  receiptUrl?: string | null
  choirId?: string
}

export type ApproveContributionPayload = {
  confirmedAmount: number
  discrepancyReason?: string
}

export type RejectContributionPayload = {
  rejectionReason: string
}

export type AdjustContributionPayload = {
  adjustmentAmount: number
  category: 'CORRECTION' | 'TRANSFER' | 'REVERSAL' | 'MISCLASSIFICATION' | 'OTHER'
  reason: string
  referenceContributionId?: string
}

function mapClaim(row: Record<string, unknown>): ContributionClaim {
  return {
    id: String(row.id ?? ''),
    referenceNumber: row.referenceNumber != null ? String(row.referenceNumber) : undefined,
    status: String(row.status ?? 'PENDING'),
    memberId: row.memberId != null ? String(row.memberId) : undefined,
    memberName: row.memberName != null ? String(row.memberName) : undefined,
    memberNumber: row.memberNumber != null ? String(row.memberNumber) : undefined,
    memberPhone: row.memberPhone != null ? String(row.memberPhone) : undefined,
    familyId: row.familyId != null ? String(row.familyId) : undefined,
    familyName: row.familyName != null ? String(row.familyName) : undefined,
    familyCode: row.familyCode != null ? String(row.familyCode) : undefined,
    familyApprovedByName:
      row.familyApprovedByName != null ? String(row.familyApprovedByName) : undefined,
    familyApprovedByNumber:
      row.familyApprovedByNumber != null ? String(row.familyApprovedByNumber) : undefined,
    familyRejectedByName:
      row.familyRejectedByName != null ? String(row.familyRejectedByName) : undefined,
    familyApprovedAt:
      row.familyApprovedAt != null ? String(row.familyApprovedAt) : undefined,
    familyRejectedAt:
      row.familyRejectedAt != null ? String(row.familyRejectedAt) : undefined,
    claimedAmount: Number(row.claimedAmount ?? row.amount ?? 0),
    confirmedAmount: row.confirmedAmount != null ? Number(row.confirmedAmount) : null,
    effectiveAmount: row.effectiveAmount != null ? Number(row.effectiveAmount) : null,
    discrepancyAmount: row.discrepancyAmount != null ? Number(row.discrepancyAmount) : null,
    discrepancyReason: row.discrepancyReason != null ? String(row.discrepancyReason) : null,
    rejectionReason: row.rejectionReason != null ? String(row.rejectionReason) : null,
    currency: row.currency != null ? String(row.currency) : 'RWF',
    paymentAt: row.paymentAt != null ? String(row.paymentAt) : null,
    paymentChannel: row.paymentChannel != null ? String(row.paymentChannel) : null,
    typeName: row.typeName != null
      ? String(row.typeName)
      : row.contributionTypeCatalog != null
        ? String((row.contributionTypeCatalog as { name?: string }).name ?? '')
        : undefined,
    campaignName: row.campaignName != null ? String(row.campaignName) : null,
    createdAt: row.createdAt != null ? String(row.createdAt) : undefined,
    notes: row.notes != null ? String(row.notes) : null,
    receiptUrl: row.receiptUrl != null ? String(row.receiptUrl) : null,
  }
}

function normalizeClaims(raw: unknown): ContributionClaim[] {
  if (Array.isArray(raw)) return raw.map((r) => mapClaim(r as Record<string, unknown>))
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items.map((r) => mapClaim(r as Record<string, unknown>))
    }
    if (Array.isArray(obj.history)) {
      return obj.history.map((r) => mapClaim(r as Record<string, unknown>))
    }
  }
  return []
}

export type ProtocolSubmitContext = Omit<SubmitContributionContext, 'mode'> & {
  mode: 'protocol'
  payment: FamilyPaymentInstructions
}

export const contributionsApi = {
  getSubmitContext: (choirId?: string) =>
    apiClient.get<never, SubmitContributionContext>(
      '/finance/contributions/submit-options',
      { params: choirId ? { choirId } : undefined },
    ),

  submitClaim: (payload: SubmitContributionPayload) =>
    apiClient.post<never, ContributionClaim>(
      '/finance/contributions/submit',
      payload,
    ),

  getMine: async (): Promise<ContributionClaim[]> => {
    const raw = await apiClient.get<never, unknown>('/finance/contributions/member')
    return normalizeClaims(raw)
  },

  listMine: async (params?: {
    page?: number
    limit?: number
    status?: string
    contributionTypeCatalogId?: string
    from?: string
    to?: string
  }) => {
    const raw = await apiClient.get<
      never,
      {
        items?: unknown[]
        summary?: {
          confirmedEffectiveTotal?: number
          pendingClaimedTotal?: number
          confirmedCount?: number
          pendingCount?: number
          rejectedCount?: number
        }
        total?: number
        page?: number
        limit?: number
      }
    >('/finance/contributions/member', { params })
    return {
      items: normalizeClaims(raw.items ?? raw),
      summary: raw.summary ?? {},
      total: raw.total ?? normalizeClaims(raw).length,
      page: raw.page ?? 1,
      limit: raw.limit ?? 20,
    }
  },

  getById: async (id: string): Promise<ContributionClaim & Record<string, unknown>> => {
    const raw = await apiClient.get<never, Record<string, unknown>>(
      `/finance/contributions/${id}`,
    )
    return mapClaim(raw)
  },

  getTimeline: (id: string) =>
    apiClient.get<
      never,
      {
        contributionId: string
        referenceNumber: string
        status: string
        events: Array<{
          type: string
          timestamp: string
          summary: string
          metadata?: Record<string, unknown>
        }>
      }
    >(`/finance/contributions/${id}/timeline`),

  resendThankYou: (contributionId: string) =>
    apiClient.post<never, unknown>(
      `/finance/contributions/${contributionId}/resend-thank-you`,
      {},
    ),

  getFamilyInbox: async (params?: { familyId?: string; status?: string; limit?: number }) => {
    const raw = await apiClient.get<never, { items?: unknown[]; familyId?: string; pendingCount?: number }>(
      '/finance/contributions/family/inbox',
      { params },
    )
    return {
      familyId: raw.familyId,
      pendingCount: raw.pendingCount ?? 0,
      items: normalizeClaims(raw.items ?? []),
    }
  },

  getProtocolSubmitContext: (): Promise<ProtocolSubmitContext> =>
    apiClient.get('/finance/contributions/protocol/submit-options'),

  submitProtocolClaim: (payload: Omit<SubmitContributionPayload, 'choirId'>) =>
    apiClient.post<never, ContributionClaim>(
      '/finance/contributions/protocol/submit',
      payload,
    ),

  getProtocolInbox: async (params?: { status?: string; limit?: number }) => {
    const raw = await apiClient.get<never, { items?: unknown[]; pendingCount?: number }>(
      '/finance/contributions/protocol/inbox',
      { params },
    )
    return {
      pendingCount: raw.pendingCount ?? 0,
      items: normalizeClaims(raw.items ?? []),
    }
  },

  getSponsorInbox: async (params: { choirId: string; status?: string; limit?: number }) => {
    const raw = await apiClient.get<never, { items?: unknown[]; choirId?: string; pendingCount?: number }>(
      '/finance/contributions/sponsor/inbox',
      { params },
    )
    return {
      choirId: raw.choirId,
      pendingCount: raw.pendingCount ?? 0,
      items: normalizeClaims(raw.items ?? []),
    }
  },

  getTreasuryInbox: async (params: { choirId: string; limit?: number }) => {
    const raw = await apiClient.get<
      never,
      {
        items?: unknown[]
        choirId?: string
        pendingCount?: number
        splitWorkflowEnabled?: boolean
      }
    >('/finance/contributions/treasury/inbox', { params })
    return {
      choirId: raw.choirId,
      pendingCount: raw.pendingCount ?? 0,
      splitWorkflowEnabled: raw.splitWorkflowEnabled ?? true,
      items: normalizeClaims(raw.items ?? []),
    }
  },

  getTreasuryDashboard: (choirId: string) =>
    apiClient.get<
      never,
      {
        choirId: string
        splitWorkflowEnabled: boolean
        verificationQueueCount: number
        treasuryQueueCount: number
        sponsorQueueCount: number
        oldestTreasuryHours: number | null
        oldestSponsorHours: number | null
        oldestTreasuryContributionId: string | null
        oldestSponsorContributionId: string | null
        periodClose?: TreasuryPeriodCloseStatus
      }
    >('/finance/contributions/treasury/dashboard', { params: { choirId } }),

  exportTreasuryPeriodPdf: async (choirId: string, month?: string) => {
    const blob = await apiClient.get<never, Blob>(
      '/finance/contributions/treasury/export/pdf',
      {
        params: { choirId, month },
        responseType: 'blob',
      },
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = month ? `choir-treasury-${month}.pdf` : 'choir-treasury-pack.pdf'
    anchor.click()
    URL.revokeObjectURL(url)
  },

  closeTreasuryPeriod: (
    choirId: string,
    payload?: { month?: string; notes?: string },
  ) =>
    apiClient.post<never, TreasuryPeriodCloseStatus>(
      '/finance/contributions/treasury/period-close',
      payload ?? {},
      { params: { choirId } },
    ),

  verifyTreasury: (contributionId: string) =>
    apiClient.post<never, ContributionClaim>(
      `/finance/contributions/${contributionId}/treasury/verify`,
      {},
    ),

  rejectTreasury: (contributionId: string, payload: RejectContributionPayload) =>
    apiClient.post<never, ContributionClaim>(
      `/finance/contributions/${contributionId}/treasury/reject`,
      payload,
    ),

  approveFamily: (contributionId: string, payload: ApproveContributionPayload) =>
    apiClient.post<never, ContributionClaim>(
      `/finance/contributions/${contributionId}/family/approve`,
      payload,
    ),

  rejectFamily: (contributionId: string, payload: RejectContributionPayload) =>
    apiClient.post<never, ContributionClaim>(
      `/finance/contributions/${contributionId}/family/reject`,
      payload,
    ),

  adjust: (contributionId: string, payload: AdjustContributionPayload) =>
    apiClient.post<never, unknown>(
      `/finance/contributions/${contributionId}/adjust`,
      payload,
    ),

  exportPdf: () =>
    apiClient.get('/finance/contributions/export/pdf', { responseType: 'blob' }),

  listAdminCatalog: (choirId: string) =>
    apiClient.get<never, { items: ContributionCatalogAdminItem[] }>(
      '/finance/contributions/admin/catalog',
      { params: { choirId } },
    ),

  createAdminCatalog: (choirId: string, payload: CreateCatalogPayload) =>
    apiClient.post<never, ContributionCatalogAdminItem>(
      '/finance/contributions/admin/catalog',
      payload,
      { params: { choirId } },
    ),

  updateAdminCatalog: (id: string, payload: UpdateCatalogPayload) =>
    apiClient.patch<never, ContributionCatalogAdminItem>(
      `/finance/contributions/admin/catalog/${id}`,
      payload,
    ),

  listAdminCampaigns: (choirId: string) =>
    apiClient.get<never, { items: ContributionCampaignAdminItem[] }>(
      '/finance/contributions/admin/campaigns',
      { params: { choirId } },
    ),

  createAdminCampaign: (choirId: string, payload: CreateCampaignPayload) =>
    apiClient.post<never, ContributionCampaignAdminItem>(
      '/finance/contributions/admin/campaigns',
      payload,
      { params: { choirId } },
    ),

  updateAdminCampaign: (id: string, payload: UpdateCampaignPayload) =>
    apiClient.patch<never, ContributionCampaignAdminItem>(
      `/finance/contributions/admin/campaigns/${id}`,
      payload,
    ),
}

export type ContributionCatalogAdminItem = {
  id: string
  choirId: string | null
  code: string
  name: string
  description: string | null
  active: boolean
  sortOrder: number
}

export type ContributionCampaignAdminItem = {
  id: string
  choirId: string | null
  contributionTypeCatalogId: string
  name: string
  description: string | null
  goalAmount: number
  memberGoalAmount: number | null
  familyGoalAmount: number | null
  currency: string
  status: string
  periodStart: string | null
  periodEnd: string | null
}

export type CreateCatalogPayload = {
  code: string
  name: string
  description?: string
  sortOrder?: number
  active?: boolean
}

export type UpdateCatalogPayload = {
  name?: string
  description?: string
  sortOrder?: number
  active?: boolean
}

export type CreateCampaignPayload = {
  contributionTypeCatalogId: string
  name: string
  description?: string
  goalAmount: number
  memberGoalAmount?: number
  familyGoalAmount?: number
  currency?: string
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  periodStart?: string
  periodEnd?: string
}

export type UpdateCampaignPayload = {
  name?: string
  description?: string
  goalAmount?: number
  memberGoalAmount?: number | null
  familyGoalAmount?: number | null
  currency?: string
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  periodStart?: string | null
  periodEnd?: string | null
}

/** @deprecated use getMine */
export type SubmitContributionPayloadLegacy = {
  amount: number
  currency?: string
  type: string
  month: string
  note?: string
  receiptUrl?: string
}
