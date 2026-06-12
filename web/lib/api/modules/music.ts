import { apiClient } from '../client'
import type { Paginated } from '@/types'

export type SongAssetType =
  | 'LYRICS'
  | 'PDF'
  | 'SHEET_MUSIC'
  | 'AUDIO'
  | 'VIDEO'
  | 'OTHER'

export type SongAsset = {
  id: string
  assetType: SongAssetType
  fileName: string
  fileUrl: string
  mimeType?: string | null
  fileSize?: number | null
  createdAt?: string
}

export interface SongListItem {
  id: string
  title: string
  alternateTitle?: string | null
  composer?: string | null
  lyricist?: string | null
  language?: string | null
  voiceParts?: string | null
  category?: string | null
  categoryId?: string | null
  hasLyrics: boolean
  hasScore: boolean
  hasAudio: boolean
  hasVideo: boolean
  assetCount?: number
  createdAt: string
}

export interface SongDetail extends SongListItem {
  arranger?: string | null
  scriptureReference?: string | null
  notes?: string | null
  lyrics?: string | null
  lyricsText?: string | null
  assets: SongAsset[]
  isFavorite?: boolean
  lastUsed?: string | null
  usageCount?: number
  updatedAt?: string
}

function normalizePaginatedSongs(raw: unknown): Paginated<SongListItem> {
  if (raw && typeof raw === 'object' && 'items' in raw) {
    const obj = raw as {
      items: SongListItem[]
      meta?: { total: number; page: number; limit: number; totalPages: number }
      total?: number
      page?: number
      limit?: number
      totalPages?: number
    }
    const meta = obj.meta ?? {
      total: obj.total ?? obj.items.length,
      page: obj.page ?? 1,
      limit: obj.limit ?? 50,
      totalPages: obj.totalPages ?? 1,
    }
    return {
      items: obj.items,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    }
  }
  const items = Array.isArray(raw) ? (raw as SongListItem[]) : []
  return { items, total: items.length, page: 1, limit: 50, totalPages: 1 }
}

export const musicApi = {
  getSongs: async (params?: {
    page?: number
    limit?: number
    q?: string
    choirId?: string
    language?: string
    categoryId?: string
  }) => {
    const raw = await apiClient.get<never, unknown>('/choir/music/songs', { params })
    return normalizePaginatedSongs(raw)
  },

  getSong: async (id: string): Promise<SongDetail> => {
    const raw = await apiClient.get<never, SongDetail>(`/choir/music/songs/${id}`)
    return {
      ...raw,
      lyrics: raw.lyrics ?? raw.lyricsText ?? null,
      assets: raw.assets ?? [],
    }
  },

  getAnalytics: () =>
    apiClient.get<never, Record<string, unknown>>('/choir/music/analytics'),

  getFavorites: () =>
    apiClient.get<never, SongListItem[]>('/choir/music/favorites'),

  getCategories: () =>
    apiClient.get<never, { id: string; name: string }[]>('/choir/music/categories'),

  createSong: (body: {
    title: string
    language?: string
    composer?: string
    lyricist?: string
    lyricsText?: string
  }) => apiClient.post<never, SongDetail>('/choir/music/songs', body),
}

/** @deprecated use SongListItem */
export type Song = SongListItem
