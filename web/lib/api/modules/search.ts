import { apiClient } from '../client'
import {
  adaptSearchResponse,
  type BackendSearchResponse,
} from '@/lib/search/adaptSearchResponse'

export interface SearchResult {
  id:       string
  type:     'member' | 'occurrence' | 'activity' | 'choir' | 'family'
  title:    string
  subtitle?: string
  link:     string
}

export const searchApi = {
  query: async (q: string): Promise<SearchResult[]> => {
    const raw = await apiClient.get<never, BackendSearchResponse>('/search', {
      params: { q },
    })
    return adaptSearchResponse(raw ?? { query: q })
  },
}
