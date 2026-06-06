import { apiClient } from '../client'

export const choirSchedulingApi = {
  getLeaderDashboard: (choirId?: string) =>
    apiClient.get<never, Record<string, unknown>>('/choir/scheduling/dashboard', {
      params: choirId ? { choirId } : undefined,
    }),

  getMemberDashboard: (choirId?: string) =>
    apiClient.get<never, Record<string, unknown>>('/choir/scheduling/dashboard/me', {
      params: choirId ? { choirId } : undefined,
    }),

  getCalendar: (from: string, to: string, choirId?: string) =>
    apiClient.get<never, unknown[]>('/choir/scheduling/calendar', {
      params: { from, to, choirId },
    }),

  createActivity: (data: {
    choirId: string
    title: string
    activityType: string
    startAt: string
    endAt: string
    description?: string
    location?: string
    occurrenceId?: string
  }) => apiClient.post<never, Record<string, unknown>>('/choir/scheduling/activities', data),

  getAssignments: (params?: { choirId?: string }) =>
    apiClient.get<never, unknown[]>('/choir/scheduling/assignments', { params }),
}
