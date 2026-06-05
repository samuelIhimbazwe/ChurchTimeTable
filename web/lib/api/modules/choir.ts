import { apiClient } from '../client'
import type {
  Choir, ChoirMember, ChoirJoinRequest, Paginated,
  ProtocolRankingEntry,
} from '@/types'

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

  requestJoin: (choirId: string, message?: string) =>
    apiClient.post<never, ChoirJoinRequest>(
      '/member-portal/choir/join-request', { choirId, message }),

  getMyJoinRequests: () =>
    apiClient.get<never, ChoirJoinRequest[]>(
      '/member-portal/choir/join-requests'),

  reviewJoinRequest: (requestId: string, action: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO', note?: string) =>
    apiClient.patch<never, ChoirJoinRequest>(
      `/choirs/join-requests/${requestId}/review`, { action, note }),
}
