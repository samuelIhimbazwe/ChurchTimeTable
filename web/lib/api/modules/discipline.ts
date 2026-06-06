import { apiClient } from '../client'
import type { DisciplineCase, DisciplineStage, Paginated } from '@/types'

function toCase(row: Record<string, unknown>): DisciplineCase {
  const member = row.member as { firstName?: string; lastName?: string } | undefined
  return {
    id:          String(row.id ?? ''),
    memberId:    String(row.memberId ?? ''),
    memberName:  String(row.memberName ?? `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim()),
    stage:       String(row.stage ?? 'OPEN') as DisciplineStage,
    description: String(row.description ?? ''),
    openedAt:    String(row.openedAt ?? row.createdAt ?? ''),
    updatedAt:   String(row.updatedAt ?? row.createdAt ?? ''),
    resolvedAt:  row.resolvedAt != null ? String(row.resolvedAt) : undefined,
  }
}

function normalizeCases(raw: unknown): DisciplineCase[] {
  if (Array.isArray(raw)) return raw.map((r) => toCase(r as Record<string, unknown>))
  if (raw && typeof raw === 'object' && 'items' in raw) {
    return (raw as Paginated<Record<string, unknown>>).items.map(toCase)
  }
  return []
}

export const disciplineApi = {
  getAll: async (params?: { stage?: string; page?: number }) => {
    const raw = await apiClient.get<never, unknown>('/discipline', { params })
    return normalizeCases(raw)
  },

  getById: (id: string) =>
    apiClient.get<never, DisciplineCase>(`/discipline/${id}`),

  create: (data: { memberId: string; description: string; ministry?: string }) =>
    apiClient.post<never, DisciplineCase>('/discipline', data),

  advance: (id: string, resolution?: string, actionTaken?: string) =>
    apiClient.patch<never, DisciplineCase>(
      `/discipline/${id}/advance`, { resolution, actionTaken }),
}
