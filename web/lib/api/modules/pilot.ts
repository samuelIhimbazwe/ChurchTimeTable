import { apiClient } from '../client'

export type NotificationRule = {
  trigger: string
  channel: string
  enabled: boolean
  config?: Record<string, unknown> | null
}

export const pilotApi = {
  listNotificationRules: () =>
    apiClient.get<never, NotificationRule[]>('/pilot/notification-rules'),

  updateNotificationRule: (
    trigger: string,
    payload: { enabled?: boolean; channel?: 'IN_APP' | 'PUSH' | 'EMAIL' },
  ) =>
    apiClient.patch<never, NotificationRule>(
      `/pilot/notification-rules/${trigger}`,
      payload,
    ),
}
