import { apiClient } from '../client'

export interface SearchResult {
  id:       string
  type:     'member' | 'occurrence' | 'activity' | 'choir' | 'family'
  title:    string
  subtitle?: string
  link:     string
}

export const searchApi = {
  query: (q: string) =>
    apiClient.get<never, SearchResult[]>('/search', { params: { q } }),
}
