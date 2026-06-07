import { apiClient } from '../client'

export type ChurchServiceRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type ServicePreparationItemType =
  | 'SERVICE_SONG'
  | 'UNIFORM'
  | 'PEP_TALK'
  | 'SHORT_ANNOUNCEMENT'
  | 'CUSTOM'
export type PepTalkTiming = 'BEFORE_SERVICE' | 'AFTER_SERVICE'

export interface ChurchServiceRequest {
  id: string
  occurrenceId: string
  preferredChoirId: string | null
  assignedChoirId: string | null
  role: string
  title: string | null
  notes: string | null
  status: ChurchServiceRequestStatus
  reviewNotes: string | null
  createdAt: string
  occurrence?: { id: string; title: string; startAt: string; endAt: string; status?: string }
  preferredChoir?: { id: string; name: string; code: string } | null
  assignedChoir?: { id: string; name: string; code: string } | null
}

export interface ServicePreparationItem {
  id?: string
  itemType: ServicePreparationItemType
  title: string
  body?: string | null
  songId?: string | null
  scheduledAt?: string | null
  sortOrder?: number
  song?: { id: string; title: string } | null
}

export interface ServicePreparationPlan {
  id?: string
  choirId: string
  occurrenceId: string
  uniformNotes?: string | null
  pepTalkTitle?: string | null
  pepTalkAt?: string | null
  pepTalkTiming?: PepTalkTiming | null
  occurrence?: { id: string; title: string; startAt: string; endAt: string }
  items: ServicePreparationItem[]
}

export const choirServiceOpsApi = {
  listChurchRequests: (params?: { status?: ChurchServiceRequestStatus; choirId?: string }) =>
    apiClient.get<never, ChurchServiceRequest[]>('/church/service-requests', { params }),

  createChurchRequest: (data: {
    occurrenceId: string
    preferredChoirId?: string
    role?: string
    title?: string
    notes?: string
  }) => apiClient.post<never, ChurchServiceRequest>('/church/service-requests', data),

  reviewChurchRequest: (
    id: string,
    data: { status: 'APPROVED' | 'REJECTED'; assignedChoirId?: string; reviewNotes?: string },
  ) => apiClient.post<never, ChurchServiceRequest>(`/church/service-requests/${id}/review`, data),

  listPreparation: (choirId: string, params?: { from?: string; to?: string }) =>
    apiClient.get<never, Array<{
      occurrenceId: string
      occurrence: { id: string; title: string; startAt: string; endAt: string }
      role: string
      hasPlan: boolean
      planSummary: { id: string; pepTalkTitle?: string; uniformNotes?: string } | null
    }>>('/choir/service-preparation', { params: { choirId, ...params } }),

  listMemberPreparation: (choirId: string, params?: { from?: string; to?: string }) =>
    apiClient.get<never, Array<{
      occurrenceId: string
      occurrence: { id: string; title: string; startAt: string; endAt: string }
      role: string
      hasPlan: boolean
      planSummary: { id: string; pepTalkTitle?: string; uniformNotes?: string } | null
    }>>('/choir/member-service-preparation', { params: { choirId, ...params } }),

  getPreparation: (choirId: string, occurrenceId: string) =>
    apiClient.get<never, ServicePreparationPlan>(
      `/choir/service-preparation/${occurrenceId}`,
      { params: { choirId } },
    ),

  getMemberPreparation: (choirId: string, occurrenceId: string) =>
    apiClient.get<never, ServicePreparationPlan>(
      `/choir/member-service-preparation/${occurrenceId}`,
      { params: { choirId } },
    ),

  upsertPreparation: (data: {
    choirId: string
    occurrenceId: string
    uniformNotes?: string
    pepTalkTitle?: string
    pepTalkAt?: string
    pepTalkTiming?: PepTalkTiming
    items?: ServicePreparationItem[]
  }) => apiClient.post<never, ServicePreparationPlan>('/choir/service-preparation', data),

  listDissolutions: () =>
    apiClient.get<never, unknown[]>('/choirs/dissolution-transfers'),

  previewDissolution: (sourceChoirId: string) =>
    apiClient.get<never, {
      sourceChoir: { id: string; name: string; code: string; isActive: boolean }
      activeMemberCount: number
      familyCount: number
    }>(`/choirs/${sourceChoirId}/dissolution-preview`),

  executeDissolution: (data: { sourceChoirId: string; targetChoirId: string; reason?: string }) =>
    apiClient.post<never, unknown>('/choirs/dissolution-transfer', data),
}
