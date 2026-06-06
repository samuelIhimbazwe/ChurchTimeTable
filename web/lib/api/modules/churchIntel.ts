import { apiClient } from '../client'

export const churchIntelApi = {
  getSummary: () =>
    apiClient.get<never, Record<string, unknown>>('/church/intelligence/summary'),

  getDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/church/intelligence/dashboard'),

  getMinistryHealth: () =>
    apiClient.get<never, unknown[]>('/church/intelligence/ministry-health'),

  getAlerts: () =>
    apiClient.get<never, unknown[]>('/church/intelligence/alerts'),

  getActivityFeed: (params?: {
    from?: string; to?: string; limit?: number; ministryId?: string
  }) => apiClient.get<never, unknown[]>('/church/activity', { params }),

  getLeadershipAnalytics: () =>
    apiClient.get<never, unknown[]>('/leadership/analytics'),
}
