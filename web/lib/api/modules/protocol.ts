import { apiClient } from '../client'
import type {
  ProtocolOccurrenceTeam, ProtocolAttendanceOutcome,
  ProtocolReplacementRequest, ProtocolRankingEntry,
  ReplacementRequestStatus,
} from '@/types'

export interface SubmitProtocolAttendancePayload {
  teamId: string
  records: {
    teamMemberId: string
    outcome:      ProtocolAttendanceOutcome
    note?:        string
  }[]
}

export const protocolApi = {
  getTeamForOccurrence: (occurrenceId: string) =>
    apiClient.get<never, ProtocolOccurrenceTeam>(
      `/protocol/occurrences/${occurrenceId}/team`),

  getMyStats: () =>
    apiClient.get<never, {
      attendanceRate: number
      serviceCount:   number
      rank:           number
      badges:         string[]
    }>('/protocol/dashboard/me'),

  submitAttendance: (payload: SubmitProtocolAttendancePayload) =>
    apiClient.post<never, { saved: number }>(
      `/protocol/teams/${payload.teamId}/attendance`, payload),

  getRankings: () =>
    apiClient.get<never, ProtocolRankingEntry[]>('/protocol/rankings'),

  requestReplacement: (occurrenceId: string, reason: string) =>
    apiClient.post<never, ProtocolReplacementRequest>(
      '/protocol/replacements', { occurrenceId, reason }),

  getReplacements: (params?: { status?: ReplacementRequestStatus }) =>
    apiClient.get<never, ProtocolReplacementRequest[]>(
      '/protocol/replacements', { params }),

  reviewReplacement: (id: string, action: 'APPROVED' | 'REJECTED') =>
    apiClient.patch<never, ProtocolReplacementRequest>(
      `/protocol/replacements/${id}/review`, { action }),

  sendInvitation: (memberId: string, occurrenceId?: string) =>
    apiClient.post<never, void>('/protocol/invitations', { memberId, occurrenceId }),

  reviewClaim: (claimId: string, action: 'APPROVED' | 'REJECTED') =>
    apiClient.patch<never, void>(`/protocol/claims/${claimId}/review`, { action }),
}
