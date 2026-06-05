import { apiClient } from '../client'
import type {
  ChoirActivity, ChoirAttendanceRecord,
  ChoirAttendanceOutcome, Paginated,
} from '@/types'

export interface ActivitiesParams {
  page?:        number
  limit?:       number
  from?:        string
  to?:          string
  activityType?: string
  choirId?:     string
}

export interface SubmitChoirAttendancePayload {
  activityId: string
  records: {
    memberId: string
    outcome:  ChoirAttendanceOutcome
    note?:    string
  }[]
}

export const choirActivityApi = {
  getAll: (params?: ActivitiesParams) =>
    apiClient.get<never, Paginated<ChoirActivity>>(
      '/choir/scheduling/activities', { params }),

  getById: (id: string) =>
    apiClient.get<never, ChoirActivity>(
      `/choir/scheduling/activities/${id}`),

  getAttendance: (activityId: string) =>
    apiClient.get<never, ChoirAttendanceRecord[]>(
      `/choir/scheduling/activities/${activityId}/attendance`),

  submitAttendance: (payload: SubmitChoirAttendancePayload) =>
    apiClient.post<never, { saved: number }>(
      `/choir/scheduling/activities/${payload.activityId}/attendance`,
      payload),

  getCalendar: (choirId: string, params?: { from?: string; to?: string }) =>
    apiClient.get<never, ChoirActivity[]>(
      `/choir/scheduling/calendar/${choirId}`, { params }),
}
