import { apiClient } from '../client'

export type ChoirServiceRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type ChoirServiceAssignmentStatus =
  | 'PENDING_SCHEDULER_CONFIRMATION'
  | 'PENDING_CHOIR_ACCEPTANCE'
  | 'CONFIRMED'
  | 'REJECTED'
export type ChoirServiceAssignmentSource = 'CHOIR_PROPOSED' | 'SERVICE_REQUEST' | 'SCHEDULER_DIRECT'

export interface ChoirServiceAssignment {
  id: string
  choirId: string
  occurrenceId: string
  role: string
  status: ChoirServiceAssignmentStatus
  source: ChoirServiceAssignmentSource
  overrideReason: string | null
  bypassRules: boolean
  conflictReason: string | null
  rejectionReason: string | null
  assignedAt: string
  confirmedAt: string | null
  choir?: { id: string; name: string; code: string }
  occurrence?: { id: string; title: string; startAt: string; endAt: string }
}
export type ServicePreparationItemType =
  | 'SERVICE_SONG'
  | 'UNIFORM'
  | 'PEP_TALK'
  | 'SHORT_ANNOUNCEMENT'
  | 'CUSTOM'
export type PepTalkTiming = 'BEFORE_SERVICE' | 'AFTER_SERVICE'

export interface ChoirServiceRequest {
  id: string
  occurrenceId: string
  preferredChoirId: string | null
  assignedChoirId: string | null
  role: string
  title: string | null
  notes: string | null
  status: ChoirServiceRequestStatus
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
  myAcknowledgments?: string[]
}

export const choirServiceOpsApi = {
  listServiceRequests: (params?: { status?: ChoirServiceRequestStatus; choirId?: string }) =>
    apiClient.get<never, ChoirServiceRequest[]>('/choir/service-requests', { params }),

  createServiceRequest: (data: {
    occurrenceId: string
    preferredChoirId?: string
    role?: string
    title?: string
    notes?: string
  }) => apiClient.post<never, ChoirServiceRequest>('/choir/service-requests', data),

  reviewServiceRequest: (
    id: string,
    data: { status: 'APPROVED' | 'REJECTED'; assignedChoirId?: string; reviewNotes?: string },
  ) => apiClient.post<never, ChoirServiceRequest>(`/choir/service-requests/${id}/review`, data),

  checkAssignmentConflicts: (
    choirId: string,
    params: {
      occurrenceId?: string
      serviceDate?: string
      startTime?: string
      endTime?: string
    },
  ) =>
    apiClient.get<never, {
      hasConflict: boolean
      summary: string | null
      conflicts: Array<{ kind: string; id: string; title: string; startAt: string; endAt: string }>
    }>('/choir/service-assignments/conflicts', { params: { choirId, ...params } }),

  listServiceAssignments: (params?: {
    status?: ChoirServiceAssignmentStatus
    pendingOnly?: boolean
    from?: string
    to?: string
  }) =>
    apiClient.get<never, ChoirServiceAssignment[]>('/choir/service-assignments', { params }),

  directServiceAssign: (data: {
    choirId: string
    occurrenceId?: string
    serviceCode?: 'SUNDAY_SERVICE_1' | 'SUNDAY_SERVICE_2' | 'TUESDAY_SERVICE' | 'IGABURO' | 'OTHER'
    customServiceName?: string
    serviceDate?: string
    startTime?: string
    endTime?: string
    role?: string
    overrideReason?: string
    bypassRules?: boolean
  }) => apiClient.post<never, ChoirServiceAssignment>('/choir/service-assignments', data),

  confirmServiceAssignment: (
    id: string,
    data?: { bypassRules?: boolean; overrideReason?: string },
  ) => apiClient.post<never, ChoirServiceAssignment>(`/choir/service-assignments/${id}/confirm`, data ?? {}),

  rejectServiceAssignment: (id: string, data?: { reason?: string }) =>
    apiClient.post<never, ChoirServiceAssignment>(`/choir/service-assignments/${id}/reject`, data ?? {}),

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

  acknowledgeMemberPreparation: (
    choirId: string,
    occurrenceId: string,
    itemKey: string,
  ) =>
    apiClient.post<never, ServicePreparationPlan>(
      `/choir/member-service-preparation/${occurrenceId}/acknowledge`,
      { itemKey },
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
