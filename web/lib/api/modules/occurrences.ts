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

  getMySchedule: () =>
    apiClient.get<never, ScheduleItem[]>(
      '/member-portal/schedule'),
}
