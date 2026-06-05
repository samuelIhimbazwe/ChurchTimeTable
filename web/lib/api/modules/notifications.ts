import { apiClient } from '../client'
import type { ApiNotification } from '@/types'

export const notificationsApi = {
  getAll: () =>
    apiClient.get<never, ApiNotification[]>('/notifications'),

  markRead: (id: string) =>
    apiClient.patch<never, void>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<never, void>('/notifications/read-all'),

  registerFcmToken: (token: string) =>
    apiClient.post<never, void>('/users/fcm-token', { token }),
}
