import { apiClient } from '../client'
import type { Member, Paginated, MemberStatus, MinistryScope } from '@/types'

export interface MembersParams {
  page?:     number
  limit?:    number
  search?:   string
  ministry?: MinistryScope
  status?:   MemberStatus
}

export const membersApi = {
  getAll: (params?: MembersParams) =>
    apiClient.get<never, Paginated<Member>>('/members', { params }),

  getById: (id: string) =>
    apiClient.get<never, Member>(`/members/${id}`),

  updateProfile: (id: string, data: Partial<Member>) =>
    apiClient.patch<never, Member>(`/members/${id}/profile`, data),

  getScoreTrends: (id: string) =>
    apiClient.get<never, { month: string; score: number }[]>(
      `/members/${id}/scores/trends`),

  getPendingApprovals: () =>
    apiClient.get<never, Member[]>('/members?status=PENDING'),

  updateStatus: (id: string, status: MemberStatus) =>
    apiClient.patch<never, Member>(`/members/${id}/status`, { status }),

  getProfileCenter: (id: string) =>
    apiClient.get<never, Record<string, unknown>>(`/members/${id}/profile`),

  getAttendance: (id: string) =>
    apiClient.get<never, Record<string, unknown>>(`/members/${id}/attendance`),

  getTimeline: (id: string, limit = 50) =>
    apiClient.get<never, unknown[]>(`/members/${id}/timeline`, { params: { limit } }),

  getWelfareCases: (id: string) =>
    apiClient.get<never, unknown[]>(`/members/${id}/welfare-cases`),
}
