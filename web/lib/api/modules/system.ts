import { apiClient } from '../client'
import type { Paginated } from '@/types'

export interface SystemStats {
  totalMembers:      number
  activeChoirs:      number
  totalOccurrences:  number
  systemHealth:      'healthy' | 'warning' | 'critical'
  dbSize:            string
  lastBackup:        string
  apiResponseMs:     number
}

export interface PilotReadiness {
  score:  number
  checks: { label: string; passed: boolean; detail?: string }[]
  ready:  boolean
}

export interface AuditLogEntry {
  id:        string
  action:    string
  userId:    string
  userName:  string
  detail:    string
  entity?:   string
  entityId?: string
  oldValue?: unknown
  newValue?: unknown
  createdAt: string
}

function mapSystemHealth(
  raw?: string,
): SystemStats['systemHealth'] {
  if (raw === 'attention' || raw === 'warning') return 'warning'
  if (raw === 'critical') return 'critical'
  return 'healthy'
}

export const systemApi = {
  getStats: async (): Promise<SystemStats> => {
    const raw = await apiClient.get<never, Record<string, unknown>>('/system/stats')
    return {
      totalMembers:     Number(raw.members ?? raw.totalMembers ?? 0),
      activeChoirs:     Number(raw.choirs ?? raw.activeChoirs ?? 0),
      totalOccurrences: Number(raw.operationOccurrences ?? raw.totalOccurrences ?? 0),
      systemHealth:     mapSystemHealth(raw.systemHealth as string | undefined),
      dbSize:           String(raw.dbSize ?? '—'),
      lastBackup:       String(raw.lastBackup ?? '—'),
      apiResponseMs:    Number(raw.apiResponseMs ?? 0),
    }
  },

  getPilotReadiness: async (): Promise<PilotReadiness> => {
    const raw = await apiClient.get<never, Record<string, unknown>>('/system/pilot-readiness')
    const items = (raw.checks ?? raw.items ?? raw.indicators ?? []) as Array<{
      label: string
      passed?: boolean
      ready?: boolean
      count?: number
      target?: number
      detail?: string
    }>
    return {
      score:  Number(raw.score ?? raw.readinessScore ?? raw.percentage ?? 0),
      checks: items.map((i) => ({
        label:  i.label,
        passed: i.passed ?? i.ready ?? false,
        detail: i.detail ?? (i.target != null ? `${i.count ?? 0}/${i.target}` : undefined),
      })),
      ready:  Boolean(raw.ready ?? raw.isReady ?? raw.pilotReady ?? false),
    }
  },

  runImport: (file: File, type: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    return apiClient.post<never, { imported: number; errors: string[] }>(
      '/pilot/import', form,
      { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  getAuditLog: async (params?: { page?: number; limit?: number }): Promise<Paginated<AuditLogEntry>> => {
    const raw = await apiClient.get<never, {
      items?: Array<Record<string, unknown>>
      meta?: { total: number; page: number; limit: number; totalPages: number }
      total?: number
      page?: number
      limit?: number
      totalPages?: number
    }>('/audit', { params })

    const meta = raw.meta ?? raw
    return {
      items: (raw.items ?? []).map((entry) => ({
        id:        String(entry.id),
        action:    String(entry.action),
        userId:    String(entry.userId),
        userName:  String(
          entry.userName
          ?? (entry.user as { email?: string; name?: string } | undefined)?.email
          ?? (entry.user as { email?: string; name?: string } | undefined)?.name
          ?? 'System',
        ),
        detail:    String(
          entry.detail
          ?? `${entry.entity ?? ''}${entry.entityId ? ` · ${String(entry.entityId).slice(0, 8)}` : ''}`,
        ),
        entity:    entry.entity != null ? String(entry.entity) : undefined,
        entityId:  entry.entityId != null ? String(entry.entityId) : undefined,
        oldValue:  entry.oldValue,
        newValue:  entry.newValue,
        createdAt: String(entry.createdAt),
      })),
      total:      Number(meta.total ?? 0),
      page:       Number(meta.page ?? 1),
      limit:      Number(meta.limit ?? 25),
      totalPages: Number(meta.totalPages ?? 1),
    }
  },
}
