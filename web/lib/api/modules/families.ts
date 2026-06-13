import { apiClient } from '../client'
import type { Contribution, Family, Paginated } from '@/types'

export interface FamilyMemberRow {
  id: string
  memberId: string
  role: string
  joinedAt?: string
  member?: {
    id: string
    firstName: string
    lastName: string
    memberNumber?: string
  }
}

export interface FamilyListItem extends Family {
  familyCode?: string
  healthScore?: number
  healthGrade?: string
  effectiveContributions?: number
  pendingContributions?: number
}

export interface FamilyDetail extends FamilyListItem {
  delegationEnabled?: boolean
  workspaceTemplate?: string | null
  members?: FamilyMemberRow[]
  notes?: string
  paymentMomoNumber?: string | null
  paymentMomoAccountName?: string | null
  paymentBankAccount?: string | null
  paymentBankName?: string | null
  paymentInstructions?: string | null
}

export interface FamilyMetricsOverview {
  totalFamilies: number
  averageHealthScore: number
  topFamilies: Array<{
    id: string
    familyCode: string
    familyName: string
    score: number
    grade: string
  }>
  needsAttention: Array<{
    id: string
    familyCode: string
    familyName: string
    score: number
    grade: string
  }>
}

export interface FamilyMetricsDetail {
  familyId: string
  familyCode: string
  familyName: string
  attendance: { attendanceRate: number; attendanceCount: number; missedCount: number }
  contributions: {
    confirmedAmount: number
    effectiveAmount?: number
    pendingAmount: number
    contributionCount: number
  } | null
  participation: { activeAssignments: number; activeLeaders: number; activeMembers: number }
  health: { score: number; grade: string }
  healthBreakdown?: {
    attendanceRate: number
    contributionScore: number | null
    participationScore: number
    weights: {
      attendance: number
      contribution: number | null
      participation: number
    }
  }
}

function headName(row: Record<string, unknown>): string {
  const head = row.headMember as { firstName?: string; lastName?: string } | null | undefined
  if (head) return `${head.firstName ?? ''} ${head.lastName ?? ''}`.trim()
  return String(row.headName ?? '—')
}

function toFamily(row: Record<string, unknown>): FamilyListItem {
  return {
    id: String(row.id ?? ''),
    name: String(row.familyName ?? row.name ?? 'Family'),
    headName: headName(row),
    memberCount: Number(
      row.memberCount
        ?? (typeof row._count === 'object' && row._count && 'members' in (row._count as object)
          ? (row._count as { members?: number }).members
          : 0)
        ?? 0,
    ),
    totalContributions: Number(
      row.totalContributions ?? row.confirmedAmount ?? row.effectiveContributions ?? 0,
    ),
    effectiveContributions:
      row.effectiveContributions != null
        ? Number(row.effectiveContributions)
        : undefined,
    pendingContributions:
      row.pendingContributions != null
        ? Number(row.pendingContributions)
        : undefined,
    rank: row.rank != null ? Number(row.rank) : undefined,
    familyCode: row.familyCode != null ? String(row.familyCode) : undefined,
    healthScore: row.healthScore != null ? Number(row.healthScore) : undefined,
    healthGrade: row.healthGrade != null ? String(row.healthGrade) : undefined,
  }
}

function normalizeList(raw: unknown): FamilyListItem[] {
  if (Array.isArray(raw)) return raw.map((r) => toFamily(r as Record<string, unknown>))
  if (raw && typeof raw === 'object' && 'items' in raw) {
    return (raw as Paginated<Record<string, unknown>>).items.map(toFamily)
  }
  return []
}

export const familiesApi = {
  getAll: async (params?: {
    includeMetrics?: boolean
    page?: number
    limit?: number
    familyId?: string
    search?: string
  }): Promise<FamilyListItem[]> => {
    const raw = await apiClient.get<never, unknown>('/families', {
      params: {
        ...params,
        includeMetrics: params?.includeMetrics ? 'true' : undefined,
      },
    })
    return normalizeList(raw)
  },

  getMetricsOverview: () =>
    apiClient.get<never, FamilyMetricsOverview>('/families/metrics/overview'),

  getMetrics: (id: string) =>
    apiClient.get<never, FamilyMetricsDetail>(`/families/${id}/metrics`),

  getById: async (id: string): Promise<FamilyDetail> => {
    const raw = await apiClient.get<never, Record<string, unknown>>(`/families/${id}`)
    return {
      ...toFamily(raw),
      delegationEnabled: raw.delegationEnabled as boolean | undefined,
      workspaceTemplate: raw.workspaceTemplate as string | null | undefined,
      members: raw.members as FamilyMemberRow[] | undefined,
      notes: raw.notes as string | undefined,
      paymentMomoNumber: raw.paymentMomoNumber as string | null | undefined,
      paymentMomoAccountName: raw.paymentMomoAccountName as string | null | undefined,
      paymentBankAccount: raw.paymentBankAccount as string | null | undefined,
      paymentBankName: raw.paymentBankName as string | null | undefined,
      paymentInstructions: raw.paymentInstructions as string | null | undefined,
    }
  },

  update: (
    id: string,
    data: {
      familyName?: string
      headMemberId?: string | null
      notes?: string | null
      delegationEnabled?: boolean
    },
  ) => apiClient.patch<never, FamilyDetail>(`/families/${id}`, data),

  updateDelegation: (familyId: string, delegationEnabled: boolean) =>
    apiClient.patch<never, FamilyDetail>(`/families/${familyId}/delegation`, {
      delegationEnabled,
    }),

  updateWorkspaceTemplate: (familyId: string, workspaceTemplate: string) =>
    apiClient.patch<never, FamilyDetail>(`/families/${familyId}/workspace-template`, {
      workspaceTemplate,
    }),

  getPulse: (familyId: string, weekStart?: string) =>
    apiClient.get<
      never,
      {
        familyId: string
        weekStart: string
        entry: {
          score: number
          note: string | null
          recordedByName: string | null
          updatedAt: string
        } | null
        recent: Array<{ weekStart: string; score: number; note: string | null }>
      }
    >(`/families/${familyId}/pulse`, { params: weekStart ? { weekStart } : undefined }),

  upsertPulse: (
    familyId: string,
    data: { score: number; note?: string; weekStart?: string },
  ) =>
    apiClient.post<never, { familyId: string; weekStart: string; entry: { score: number } }>(
      `/families/${familyId}/pulse`,
      data,
    ),

  addMember: (
    familyId: string,
    data: { memberId: string; role?: 'MEMBER' | 'HEAD' | 'SECRETARY' | 'ASSISTANT_HEAD' },
  ) => apiClient.post<never, FamilyDetail>(`/families/${familyId}/members`, data),

  removeMember: (familyId: string, memberId: string) =>
    apiClient.delete<never, FamilyDetail>(`/families/${familyId}/members/${memberId}`),

  moveMember: async (fromFamilyId: string, toFamilyId: string, memberId: string) => {
    await apiClient.delete<never, unknown>(`/families/${fromFamilyId}/members/${memberId}`)
    return apiClient.post<never, FamilyDetail>(`/families/${toFamilyId}/members`, {
      memberId,
      role: 'MEMBER',
    })
  },

  getPaymentInstructionsHistory: (familyId: string) =>
    apiClient.get<
      never,
      {
        familyId: string
        items: Array<{
          id: string
          changedAt: string
          changedByEmail: string | null
          snapshot: unknown
        }>
      }
    >(`/families/${familyId}/payment-instructions/history`),

  updatePaymentInstructions: (
    familyId: string,
    data: {
      paymentMomoNumber?: string | null
      paymentMomoAccountName?: string | null
      paymentBankAccount?: string | null
      paymentBankName?: string | null
      paymentInstructions?: string | null
    },
  ) =>
    apiClient.patch<never, unknown>(`/families/${familyId}/payment-instructions`, data),

  getContributions: (id: string) =>
    apiClient.get<never, Contribution[]>(`/families/${id}/contributions`),

  getLeadershipHistory: (id: string) =>
    apiClient.get<never, { items: FamilyLeadershipHistoryItem[] }>(
      `/families/${id}/leadership-history`,
    ),
}

export type FamilyLeadershipHistoryItem = {
  id: string
  memberId: string
  memberNumber: string | null
  memberName: string
  role: string
  startedAt: string
  endedAt: string | null
  assignedByUserId: string | null
}
