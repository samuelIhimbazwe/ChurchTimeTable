import { apiClient } from '../client'
import type { Paginated } from '@/types'

export interface Announcement {
  id:          string
  title:       string
  body?:       string
  description?: string
  scope?:      string
  publishedAt?: string
  createdAt:   string
  authorName?: string
  pinned?:     boolean
}

function normalizeList(raw: unknown): Announcement[] {
  if (Array.isArray(raw)) return raw as Announcement[]
  if (raw && typeof raw === 'object' && 'items' in raw) {
    return (raw as Paginated<Announcement>).items
  }
  return []
}

export const announcementsApi = {
  getChurchBroadcasts: async (): Promise<Announcement[]> => {
    const raw = await apiClient.get<never, unknown>('/church/broadcasts')
    return normalizeList(raw)
  },

  createBroadcast: (data: {
    title: string
    description?: string
    youtubeUrl: string
    startAt?: string
  }) => apiClient.post<never, Announcement>('/church/broadcasts', data),

  getGlobal: async (params?: { page?: number; limit?: number }) => {
    const raw = await apiClient.get<never, unknown>('/announcements', { params })
    if (raw && typeof raw === 'object' && 'items' in raw) return raw as Paginated<Announcement>
    return { items: normalizeList(raw), total: normalizeList(raw).length, page: 1, limit: 20, totalPages: 1 }
  },

  getMinistry: async (ministryId: string, params?: { page?: number }) => {
    const raw = await apiClient.get<never, unknown>(
      `/ministries/${ministryId}/announcements`, { params })
    return normalizeList(raw)
  },

  createMinistry: (ministryId: string, data: { title: string; body: string }) =>
    apiClient.post<never, Announcement>(
      `/ministries/${ministryId}/announcements`, data),

  createGlobal: (data: { title: string; body: string; scope?: string }) =>
    apiClient.post<never, Announcement>('/announcements', data),
}
