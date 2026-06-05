import { apiClient } from '../client'
import type { Paginated } from '@/types'

export interface SystemStats {
  totalMembers:     number
  activeChoirs:     number
  totalOccurrences: number
  systemHealth:     'healthy' | 'warning' | 'critical'
  dbSize:           string
  lastBackup:       string
  apiResponseMs:    number
}

export interface PilotReadiness {
  score:   number
  checks:  { label: string; passed: boolean; detail?: string }[]
  ready:   boolean
}

export const systemApi = {
  getStats: () =>
    apiClient.get<never, SystemStats>('/system/stats'),

  getPilotReadiness: () =>
    apiClient.get<never, PilotReadiness>('/pilot/readiness'),

  runImport: (file: File, type: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    return apiClient.post<never, { imported: number; errors: string[] }>(
      '/pilot/import', form,
      { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  getAuditLog: (params?: { page?: number; limit?: number }) =>
    apiClient.get<never, Paginated<{
      id: string; action: string; userId: string;
      userName: string; detail: string; createdAt: string
    }>>('/audit', { params }),
}
