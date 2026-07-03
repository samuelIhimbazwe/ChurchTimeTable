import { apiClient } from '../client'
import type { Paginated } from '@/types'

export interface AuditLogEntry {
  id: string
  action: string
  detail?: string | null
  userName?: string | null
  createdAt: string
  entity?: string | null
  entityId?: string | null
}

export const auditApi = {
  getAuditLog: async (params?: {
    page?: number
    limit?: number
    entity?: string
    entityId?: string
  }): Promise<Paginated<AuditLogEntry>> => {
    const raw = await apiClient.get<
      never,
      Paginated<AuditLogEntry> | AuditLogEntry[]
    >('/audit', { params })
    if (Array.isArray(raw)) {
      return {
        items: raw,
        total: raw.length,
        page: params?.page ?? 1,
        limit: params?.limit ?? raw.length,
        totalPages: 1,
      }
    }
    return raw
  },
}
