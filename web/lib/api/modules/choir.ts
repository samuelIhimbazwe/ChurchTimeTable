import { apiClient } from '../client'
import type {
  Choir, ChoirMember, ChoirJoinRequest, Paginated,
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
