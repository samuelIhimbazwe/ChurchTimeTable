import { apiClient } from '../client'
import type {
  OperationOccurrence, OperationAssignment,
  Paginated, ChurchOperationType, OccurrenceStatus,
  ScheduleItem,
} from '@/types'

export interface OccurrencesParams {
  page?:     number
  limit?:    number
  from?:     string
  to?:       string
  type?:     ChurchOperationType
  status?:   OccurrenceStatus
  ministry?: string
}

export const occurrencesApi = {
  getAll: (params?: OccurrencesParams) =>
    apiClient.get<never, Paginated<OperationOccurrence>>(
      '/operations/occurrences', { params }),

  getById: (id: string) =>
    apiClient.get<never, OperationOccurrence>(
      `/operations/occurrences/${id}`),

  getAssignments: (id: string) =>
    apiClient.get<never, OperationAssignment[]>(
      `/operations/occurrences/${id}/assignments`),

  getMySchedule: async (): Promise<ScheduleItem[]> => {
    const raw = await apiClient.get<never, unknown>('/operations/my-assignments')
    const rows = Array.isArray(raw) ? raw : []
    return rows.map((row: Record<string, unknown>) => {
      const occ = row.occurrence as Record<string, unknown> | undefined
      const startAt = String(occ?.startAt ?? row.startAt ?? '')
      return {
        id:     String(row.id ?? occ?.id ?? ''),
        title:  String(occ?.title ?? row.title ?? 'Assignment'),
        date:   startAt,
        time:   startAt,
        type:   String(occ?.type ?? 'SERVICE'),
        role:   row.role != null ? String(row.role) : undefined,
        source: 'OPERATION' as const,
      }
    })
  },

  getCalendar: (from: string, to: string) =>
    apiClient.get<never, unknown[]>('/operations/calendar', { params: { from, to } }),
}
