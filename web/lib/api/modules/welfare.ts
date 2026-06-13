import { apiClient } from '../client'
import type { WelfareCase } from '@/types'

export type WelfareCareCase = {
  id: string
  title: string
  description: string
  status: string
  urgency: string
  openedAt: string
  memberId: string
  memberName: string
  memberNumber?: string | null
  categoryName?: string | null
  coordinatorName?: string | null
  supportPlan?: string | null
  slaHours: number
  slaLimitHours: number
  slaBreached: boolean
  hoursRemaining: number
}

function toCase(row: Record<string, unknown>): WelfareCase {
  const member = row.member as { firstName?: string; lastName?: string } | undefined
  return {
    id: String(row.id ?? ''),
    memberId: String(row.memberId ?? ''),
    memberName: String(row.memberName ?? `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim()),
    type: String(row.type ?? row.category ?? row.categoryName ?? 'General'),
    status: String(row.status ?? 'OPEN') as WelfareCase['status'],
    description: String(row.description ?? row.summary ?? ''),
    createdAt: String(row.createdAt ?? row.openedAt ?? ''),
  }
}

function toCareCase(row: Record<string, unknown>): WelfareCareCase {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? 'Welfare case'),
    description: String(row.description ?? ''),
    status: String(row.status ?? 'OPEN'),
    urgency: String(row.urgency ?? 'NORMAL'),
    openedAt: String(row.openedAt ?? ''),
    memberId: String(row.memberId ?? ''),
    memberName: String(row.memberName ?? ''),
    memberNumber: row.memberNumber != null ? String(row.memberNumber) : null,
    categoryName: row.categoryName != null ? String(row.categoryName) : null,
    coordinatorName: row.coordinatorName != null ? String(row.coordinatorName) : null,
    supportPlan: row.supportPlan != null ? String(row.supportPlan) : null,
    slaHours: Number(row.slaHours ?? 0),
    slaLimitHours: Number(row.slaLimitHours ?? 168),
    slaBreached: Boolean(row.slaBreached),
    hoursRemaining: Number(row.hoursRemaining ?? 0),
  }
}

function normalizeCases(raw: unknown): WelfareCase[] {
  if (Array.isArray(raw)) return raw.map((r) => toCase(r as Record<string, unknown>))
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items.map((r) => toCase(r as Record<string, unknown>))
  }
  return []
}

export const welfareApi = {
  getDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/choir/welfare/dashboard'),

  getCareDashboard: () =>
    apiClient.get<
      never,
      {
        openCases: number
        slaBreaches: number
        urgentCases: number
        oldestCaseHours: number | null
        oldestCaseId: string | null
      }
    >('/choir/welfare/care/dashboard'),

  getCareInbox: async (params?: { limit?: number }) => {
    const raw = await apiClient.get<
      never,
      { items?: unknown[]; pendingCount?: number; slaBreaches?: number }
    >('/choir/welfare/care/inbox', { params })
    return {
      pendingCount: raw.pendingCount ?? 0,
      slaBreaches: raw.slaBreaches ?? 0,
      items: (raw.items ?? []).map((r) => toCareCase(r as Record<string, unknown>)),
    }
  },

  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const raw = await apiClient.get<never, unknown>('/choir/welfare/cases', { params })
    return normalizeCases(raw)
  },

  getById: (id: string) =>
    apiClient.get<never, WelfareCase>(`/choir/welfare/cases/${id}`),

  getTimeline: (id: string) =>
    apiClient.get<never, unknown[]>(`/choir/welfare/cases/${id}/timeline`),

  create: (data: { memberId: string; type: string; description: string; familyId?: string }) =>
    apiClient.post<never, WelfareCase>('/choir/welfare/cases', data),

  update: (id: string, data: Partial<WelfareCase>) =>
    apiClient.patch<never, WelfareCase>(`/choir/welfare/cases/${id}`, data),

  reviewCase: (
    id: string,
    payload: {
      action: 'review' | 'approve' | 'reject' | 'request_clarification'
      notes?: string
      approvedAmount?: number
    },
  ) =>
    apiClient.post<never, unknown>(`/choir/welfare/cases/${id}/review`, payload),

  transitionCase: (
    id: string,
    payload: {
      action: 'submit' | 'start_fundraising' | 'complete' | 'close'
      notes?: string
    },
  ) =>
    apiClient.post<never, unknown>(`/choir/welfare/cases/${id}/transition`, payload),

  recordAssistance: (
    caseId: string,
    data: { type: string; description: string; amount?: number },
  ) =>
    apiClient.post<never, unknown>('/choir/welfare/assistance', {
      caseId,
      assistanceType: data.type,
      description: data.description,
      amount: data.amount,
    }),
}
