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

  getPendingAcceptance: (choirId: string) =>
    apiClient.get<never, Array<{
      id: string
      role: string
      status: string
      conflictReason: string | null
      occurrence?: { id: string; title: string; startAt: string; endAt: string }
    }>>('/choir/scheduling/assignments/pending-acceptance', { params: { choirId } }),

  acceptAssignment: (id: string, notes?: string) =>
    apiClient.post<never, Record<string, unknown>>(`/choir/scheduling/assignments/${id}/accept`, { notes }),

  declineAssignment: (id: string, reason?: string) =>
    apiClient.post<never, Record<string, unknown>>(`/choir/scheduling/assignments/${id}/decline`, { reason }),
}
