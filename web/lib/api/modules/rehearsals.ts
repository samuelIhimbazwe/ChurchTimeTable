import { apiClient } from '../client'

export interface VoiceSection {
  id:    string
  name:  string
  code?: string
}

export const rehearsalsApi = {
  getVoiceSections: () =>
    apiClient.get<never, VoiceSection[]>('/choir/rehearsals/voice-sections'),

  getDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/choir/rehearsals/dashboard'),

  getPlan: (eventId: string) =>
    apiClient.get<never, Record<string, unknown>>(`/choir/rehearsals/plans/${eventId}`),

  upsertPlan: (eventId: string, data: Record<string, unknown>) =>
    apiClient.put<never, Record<string, unknown>>(`/choir/rehearsals/plans/${eventId}`, data),
}
