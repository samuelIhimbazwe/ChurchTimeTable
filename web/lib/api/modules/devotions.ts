import { apiClient } from '../client'

export interface ChoirDevotion {
  id: string
  title: string
  content: string
  type: string
  verseReference?: string | null
  verseText?: string | null
  isPinned?: boolean
  publishedAt?: string | null
  prayerDate?: string | null
  createdAt: string
}

export const devotionsApi = {
  listManage: () =>
    apiClient.get<never, ChoirDevotion[]>('/choir/devotions/manage'),

  list: (params?: { type?: string }) =>
    apiClient.get<never, ChoirDevotion[]>('/choir/devotions', { params }),

  create: (data: {
    title: string
    content: string
    type: string
    verseReference?: string
    verseText?: string
    prayerDate?: string
    isPinned?: boolean
  }) => apiClient.post<never, ChoirDevotion>('/choir/devotions', data),

  publish: (id: string) =>
    apiClient.post<never, ChoirDevotion>(`/choir/devotions/${id}/publish`, {}),
}
