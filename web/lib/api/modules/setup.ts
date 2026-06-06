import { apiClient } from '../client'

export const setupApi = {
  getSetup: () =>
    apiClient.get<never, Record<string, unknown>>('/setup'),

  saveStep: (data: Record<string, unknown>) =>
    apiClient.post<never, Record<string, unknown>>('/setup', data),

  getStatus: () =>
    apiClient.get<never, Record<string, unknown>>('/setup/status'),

  getReadiness: () =>
    apiClient.get<never, Record<string, unknown>>('/setup/readiness'),

  getRemindersDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/reminders/dashboard'),

  getGoLiveReport: () =>
    apiClient.get<never, Record<string, unknown>>('/deployment/go-live-report'),

  runReminders: () =>
    apiClient.post<never, Record<string, unknown>>('/reminders/run-now', {}),
}
