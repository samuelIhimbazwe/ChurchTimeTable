import { apiClient } from '../client'

export type ChoirAnnouncementAudience =
  | 'ENTIRE_CHOIR'
  | 'FAMILIES'
  | 'LEADERSHIP'
  | 'VOICE_SECTION'
  | 'CUSTOM_GROUP'

export interface ChoirAnnouncement {
  id: string
  choirId: string | null
  title: string
  body: string
  audience: ChoirAnnouncementAudience
  audienceRef: string | null
  publishedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export const choirOperationsApi = {
  listAnnouncements: (choirId: string) =>
    apiClient.get<never, ChoirAnnouncement[]>('/choir/announcements', {
      params: { choirId },
    }),

  createAnnouncement: (data: {
    choirId: string
    title: string
    body: string
    audience?: ChoirAnnouncementAudience
    audienceRef?: string
    expiresAt?: string
    publish?: boolean
  }) => apiClient.post<never, ChoirAnnouncement>('/choir/announcements', data),

  publishAnnouncement: (id: string) =>
    apiClient.post<never, ChoirAnnouncement>(`/choir/announcements/${id}/publish`),

  getMusicNotifyDelivery: (choirId: string) =>
    apiClient.get<
      never,
      {
        items: Array<{
          id: string
          title: string
          publishedAt: string | null
          deliveredCount: number
          readCount: number
          acknowledgedCount: number
          audienceSize: number
          deliveryRate: number | null
        }>
      }
    >('/choir/announcements/music-notify', { params: { choirId } }),

  getUniformTypes: () =>
    apiClient.get<never, Array<{ id: string; name: string; code: string; items?: unknown[] }>>(
      '/choir/uniforms/types',
    ),

  createUniformType: (data: { choirId?: string; code: string; name: string; description?: string }) =>
    apiClient.post<never, { id: string }>('/choir/uniforms/types', data),

  createUniformItem: (data: {
    uniformTypeId: string
    label: string
    size?: string
    condition?: string
  }) => apiClient.post<never, { id: string }>('/choir/uniforms/items', data),

  issueUniform: (data: { uniformItemId: string; memberId: string; notes?: string }) =>
    apiClient.post<never, { id: string }>('/choir/uniforms/assignments', data),

  returnUniform: (assignmentId: string, notes?: string) =>
    apiClient.post<never, unknown>(`/choir/uniforms/assignments/${assignmentId}/return`, { notes }),

  createEquipment: (data: {
    choirId?: string
    name: string
    category?: string
    serialNumber?: string
    condition?: string
    notes?: string
  }) => apiClient.post<never, { id: string }>('/choir/equipment', data),

  assignEquipment: (equipmentId: string, data: { memberId: string; notes?: string }) =>
    apiClient.post<never, { id: string }>(`/choir/equipment/${equipmentId}/assign`, data),

  returnEquipment: (assignmentId: string, notes?: string) =>
    apiClient.post<never, unknown>(`/choir/equipment/assignments/${assignmentId}/return`, { notes }),
}
