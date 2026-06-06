import { apiClient } from '../client'
import type { Paginated } from '@/types'

export interface Song {
  id:        string
  title:     string
  composer?: string
  language?: string
  category?: string
  lyrics?:   string
  createdAt: string
}

export const musicApi = {
  getSongs: async (params?: { page?: number; limit?: number; q?: string }) => {
    const raw = await apiClient.get<never, unknown>('/choir/music/songs', { params })
    if (raw && typeof raw === 'object' && 'items' in raw) return raw as Paginated<Song>
    const items = Array.isArray(raw) ? raw as Song[] : []
    return { items, total: items.length, page: 1, limit: 50, totalPages: 1 } as Paginated<Song>
  },

  getSong: (id: string) =>
    apiClient.get<never, Song>(`/choir/music/songs/${id}`),

  getAnalytics: () =>
    apiClient.get<never, Record<string, unknown>>('/choir/music/analytics'),

  getFavorites: () =>
    apiClient.get<never, Song[]>('/choir/music/favorites'),

  getCategories: () =>
    apiClient.get<never, { id: string; name: string }[]>('/choir/music/categories'),
}
