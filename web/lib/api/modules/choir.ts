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

  getSponsors: (choirId: string) =>
    apiClient.get<
      never,
      {
        choirId: string
        choirName: string
        sponsors: Array<{
          sponsorshipId: string
          memberId: string
          firstName: string
          lastName: string
          email: string | null
          phone: string | null
          startedAt: string
          confirmedTotal: number
          confirmedGiftCount: number
          lastGiftAt: string | null
          pendingGiftCount: number
        }>
        totals: {
          sponsorCount: number
          confirmedTotal: number
          pendingGiftCount: number
        }
      }
    >('/choirs/sponsors', { params: { choirId } }),

  provisionSponsor: (data: {
    choirId: string
    email: string
    firstName: string
    lastName: string
    phone?: string
  }) =>
    apiClient.post<
      never,
      {
        email: string
        memberId: string
        existingAccount: boolean
        temporaryPassword: string | null
        message: string
      }
    >('/choirs/sponsors/provision', data),

  getPositionRoles: (choirId: string) =>
    apiClient.get<never, ChoirPositionRole[]>(
      `/choirs/${choirId}/position-roles`,
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

  deactivateMember: (data: { choirId: string; memberId: string }) =>
    apiClient.post<
      never,
      { deactivated: boolean; membershipId: string; memberId: string; memberName: string }
    >('/choirs/members/deactivate', data),

  provisionMember: (data: {
    choirId: string
    email: string
    firstName: string
    lastName: string
    phone?: string
  }) =>
    apiClient.post<
      never,
      {
        email: string
        memberId?: string
        existingAccount: boolean
        temporaryPassword: string | null
        message: string
      }
    >(`/choirs/${data.choirId}/members/provision`, data),

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
