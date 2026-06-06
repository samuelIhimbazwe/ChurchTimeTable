import { apiClient } from '../client'
import type { ApiNotification } from '@/types'

function mapNotificationType(type: unknown): ApiNotification['type'] {
  const t = String(type ?? '').toUpperCase()
  if (t.includes('DISCIPLINE') || t.includes('SWAP') || t.includes('CHANGE')) return 'warning'
  if (t.includes('ATTENDANCE') || t.includes('ASSIGNMENT') || t.includes('APPROVED')) return 'success'
  if (t.includes('ERROR') || t.includes('FAIL') || t.includes('REJECT')) return 'error'
  return 'info'
}

function toNotification(row: Record<string, unknown>): ApiNotification {
  const data = row.data as Record<string, unknown> | null | undefined
  return {
    id:        String(row.id ?? ''),
    title:     String(row.title ?? ''),
    body:      String(row.body ?? ''),
    type:      mapNotificationType(row.type),
    read:      Boolean(row.read),
    link:      data?.link != null ? String(data.link) : data?.href != null ? String(data.href) : undefined,
    createdAt: String(row.createdAt ?? new Date().toISOString()),
  }
}

function normalizeNotifications(raw: unknown): ApiNotification[] {
  if (Array.isArray(raw)) {
    return raw.map((row) => toNotification(row as Record<string, unknown>))
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items.map((row) => toNotification(row as Record<string, unknown>))
    }
  }
  return []
}

export const notificationsApi = {
  getAll: async (): Promise<ApiNotification[]> => {
    const raw = await apiClient.get<never, unknown>('/notifications')
    return normalizeNotifications(raw)
  },

  markRead: (id: string) =>
    apiClient.patch<never, void>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.post<never, void>('/notifications/mark-all-read'),

  registerFcmToken: (token: string) =>
    apiClient.post<never, void>('/users/fcm-token', { token }),
}
