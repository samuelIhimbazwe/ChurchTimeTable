import { apiClient } from '../client'
import type { WelfareCase } from '@/types'

function toCase(row: Record<string, unknown>): WelfareCase {
  const member = row.member as { firstName?: string; lastName?: string } | undefined
  return {
    id:          String(row.id ?? ''),
    memberId:    String(row.memberId ?? ''),
    memberName:  String(row.memberName ?? `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim()),
    type:        String(row.type ?? row.category ?? 'General'),
    status:      String(row.status ?? 'OPEN') as WelfareCase['status'],
    description: String(row.description ?? row.summary ?? ''),
    createdAt:   String(row.createdAt ?? row.openedAt ?? ''),
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
