import { apiClient } from '../client'

export interface Ministry {
  id:          string
  name:        string
  code?:       string
  description?: string
  isActive?:   boolean
  memberCount?: number
}

export interface MinistrySettings {
  ministryId: string
  allowDevotions?: boolean
  allowAnnouncements?: boolean
  allowDocuments?: boolean
  allowMeetings?: boolean
  allowAssets?: boolean
  allowOperationalUnits?: boolean
  allowReporting?: boolean
}

export const ministriesApi = {
  getAll: () =>
    apiClient.get<never, Ministry[]>('/ministries'),

  getById: (id: string) =>
    apiClient.get<never, Ministry & Record<string, unknown>>(`/ministries/${id}`),

  getSummary: (id: string) =>
    apiClient.get<never, Record<string, unknown>>(`/ministries/${id}/summary`),

  getDashboard: (id: string) =>
    apiClient.get<never, Record<string, unknown>>(`/ministries/${id}/dashboard`),

  getMembers: (id: string, params?: { search?: string }) =>
    apiClient.get<never, unknown[]>(`/ministries/${id}/members`, { params }),

  getMeetings: (id: string) =>
    apiClient.get<never, unknown[]>(`/ministries/${id}/meetings`),

  getFinanceSummary: (id: string) =>
    apiClient.get<never, Record<string, unknown>>(`/ministries/${id}/finance/summary`),

  getSettings: (id: string) =>
    apiClient.get<never, MinistrySettings>(`/ministries/${id}/settings`),

  updateSettings: (id: string, data: Partial<MinistrySettings>) =>
    apiClient.patch<never, MinistrySettings>(`/ministries/${id}/settings`, data),
}
