import { apiClient } from '../client'
import type {
  Choir, ChoirMember, ChoirJoinRequest, ChoirSponsorRequest, Paginated,
  ProtocolRankingEntry,
} from '@/types'

export interface ChoirPositionRole {
  id: string
  choirId: string
  name: string
  permissionsJson: string[] | unknown
  createdAt: string
  updatedAt: string
}

export const choirApi = {
  getAll: () =>
    apiClient.get<never, Choir[]>('/choirs'),

  getCatalog: () =>
    apiClient.get<never, Choir[]>('/choirs/catalog'),

  getMembershipRules: () =>
    apiClient.get<never, Record<string, unknown>>('/choirs/membership-rules'),

  getById: (id: string) =>
    apiClient.get<never, Choir>(`/choirs/${id}`),

  getMembers: (id: string, params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<never, Paginated<ChoirMember>>(
      `/choirs/${id}/members`, { params }),

  getRankings: (id: string) =>
    apiClient.get<never, ProtocolRankingEntry[]>(
      `/choir/scheduling/rankings/${id}`),

  requestJoin: (
    choirId: string,
    reason?: string,
    requestType?: string,
  ) =>
    apiClient.post<never, ChoirJoinRequest>('/choirs/join-requests', {
      choirId,
      reason,
      requestType,
    }),

  getMyJoinRequests: () =>
    apiClient.get<never, ChoirJoinRequest[]>('/choirs/join-requests'),

  reviewJoinRequest: (
    requestId: string,
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO',
    reviewNotes?: string,
    assignedRoleId?: string,
  ) =>
    apiClient.patch<never, ChoirJoinRequest>(
      `/choirs/join-requests/${requestId}`,
      { status, reviewNotes, assignedRoleId },
    ),

  withdrawJoinRequest: (requestId: string) =>
    apiClient.patch<never, ChoirJoinRequest>(
      `/choirs/join-requests/${requestId}`,
      { withdraw: true },
    ),

  getJoinRequests: (params?: { choirId?: string; status?: string }) =>
    apiClient.get<never, ChoirJoinRequest[]>('/choirs/join-requests', { params }),

  requestSponsor: (
    choirId: string,
    message?: string,
    kind?: string,
  ) =>
    apiClient.post<never, ChoirSponsorRequest>('/choirs/sponsor-requests', {
      choirId,
      message,
      kind,
    }),

  getMySponsorRequests: () =>
    apiClient.get<never, ChoirSponsorRequest[]>('/choirs/sponsor-requests'),

  getSponsorRequests: (params?: { choirId?: string; status?: string }) =>
    apiClient.get<never, ChoirSponsorRequest[]>('/choirs/sponsor-requests', { params }),

  reviewSponsorRequest: (
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
  ) =>
    apiClient.patch<never, ChoirSponsorRequest>(
      `/choirs/sponsor-requests/${requestId}`,
      { status, reviewNotes },
    ),

  withdrawSponsorRequest: (requestId: string) =>
    apiClient.patch<never, ChoirSponsorRequest>(
      `/choirs/sponsor-requests/${requestId}`,
      { withdraw: true },
    ),

  getPositionRoles: (choirId: string) =>
    apiClient.get<never, ChoirPositionRole[]>(
      '/choirs/position-roles',
      { params: { choirId } },
    ),

  assignMemberPosition: (data: {
    choirId: string
    memberId: string
    roleId: string
  }) =>
    apiClient.post<never, unknown>('/choirs/members/assign-position', data),

  revokeMemberPosition: (data: {
    choirId: string
    memberId: string
    roleId: string
  }) =>
    apiClient.post<never, unknown>('/choirs/members/revoke-position', data),

  getPresidentDelegation: (choirId: string) =>
    apiClient.get<
      never,
      { presidentOutOfOffice: boolean; presidentDelegationJoinReview: boolean }
    >(`/choirs/${choirId}/governance/president-delegation`),

  updatePresidentDelegation: (
    choirId: string,
    payload: {
      presidentOutOfOffice?: boolean
      presidentDelegationJoinReview?: boolean
    },
  ) =>
    apiClient.patch<
      never,
      { presidentOutOfOffice: boolean; presidentDelegationJoinReview: boolean }
    >(`/choirs/${choirId}/governance/president-delegation`, payload),

  getMeetings: () =>
    apiClient.get<never, unknown[]>('/choir/meetings'),

  createMeeting: (data: {
    title: string
    scheduledAt: string
    location?: string
    agenda?: string
  }) =>
    apiClient.post<never, unknown>('/choir/meetings', data),
}
