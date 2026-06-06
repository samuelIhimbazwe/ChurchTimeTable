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

function adaptRankingEntries(raw: unknown): ProtocolRankingEntry[] {
  const rows = Array.isArray(raw) ? raw : []
  return rows.map((row: Record<string, unknown>) => {
    const member = row.member as { firstName?: string; lastName?: string } | undefined
    const memberName = String(row.memberName ?? '').trim()
      || `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim()
      || 'Unknown'
    return {
      rank:           Number(row.rank ?? 0),
      memberId:       String(row.memberId ?? ''),
      memberName,
      score:          Math.round(Number(row.score ?? 0)),
      attendanceRate: Math.round(Number(row.attendanceRate ?? 0)),
      serviceCount:   Number(row.serviceCount ?? row.lifetimeTotalServices ?? 0),
      badges:         Array.isArray(row.badges)
        ? row.badges.map((b) => (typeof b === 'string' ? b : String((b as { kind?: string }).kind ?? '')))
        : [],
    }
  })
}

function adaptMyStats(raw: Record<string, unknown>) {
  const stats = raw.statistics as Record<string, unknown> | undefined
  const profile = stats?.profile as Record<string, unknown> | undefined
  const ranking = raw.ranking as Record<string, unknown> | undefined
  const badges = (profile?.badges ?? stats?.badges ?? []) as Array<{ kind?: string } | string>
  return {
    attendanceRate: Number(profile?.attendanceRate ?? 0),
    serviceCount:   Number(profile?.lifetimeTotalServices ?? profile?.totalServicesMonth ?? 0),
    rank:           Number(ranking?.overallRank ?? profile?.currentOverallRank ?? 0),
    badges:         badges.map((b) => typeof b === 'string' ? b : String(b.kind ?? '')),
  }
}

export const protocolApi = {
  getLeaderDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/protocol/dashboard'),

  getTeamLeaderDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/protocol/dashboard/team-leader'),

  getTeamForOccurrence: (occurrenceId: string) =>
    apiClient.get<never, ProtocolOccurrenceTeam>(
      `/protocol/occurrences/${occurrenceId}/team`),

  getMyStats: async () => {
    const raw = await apiClient.get<never, Record<string, unknown>>('/protocol/dashboard/me')
    return adaptMyStats(raw)
  },

  listTeams: (params?: { from?: string; to?: string }) =>
    apiClient.get<never, unknown[]>('/protocol/teams', { params }),

  generateTeam: (occurrenceId: string, memberIds?: string[]) =>
    apiClient.post<never, Record<string, unknown>>('/protocol/teams/generate', {
      occurrenceId, memberIds,
    }),

  getBackups: (teamId: string) =>
    apiClient.get<never, unknown[]>(`/protocol/backups`, { params: { teamId } }),

  regenerateBackups: (teamId: string) =>
    apiClient.post<never, unknown[]>(`/protocol/teams/${teamId}/backups/regenerate`, {}),

  getReports: () =>
    apiClient.get<never, unknown[]>('/protocol/reports'),

  submitReport: (data: { teamId: string; summary: string; issues?: string; recommendations?: string }) =>
    apiClient.post<never, Record<string, unknown>>('/protocol/reports', data),

  listTeamLeaders: () =>
    apiClient.get<never, unknown[]>('/protocol/team-leaders'),

  getClaims: () =>
    apiClient.get<never, unknown[]>('/protocol/claims'),

  reviewClaimFull: (id: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) =>
    apiClient.patch<never, void>(`/protocol/claims/${id}`, { status, reviewNotes }),

  submitAttendance: (payload: SubmitProtocolAttendancePayload) =>
    apiClient.post<never, { saved: number }>(
      `/protocol/teams/${payload.teamId}/attendance`, payload),

  getRankings: async (): Promise<ProtocolRankingEntry[]> => {
    const now = new Date()
    const raw = await apiClient.get<never, unknown>('/protocol/rankings/monthly', {
      params: { year: now.getFullYear(), month: now.getMonth() + 1 },
    })
    return adaptRankingEntries(raw)
  },

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
    apiClient.post<never, void>(
      '/protocol/invitations', { memberId, occurrenceId }),

  reviewClaim: (claimId: string, action: 'APPROVED' | 'REJECTED') =>
    apiClient.patch<never, void>(`/protocol/claims/${claimId}`, { status: action }),

  submitClaim: (message?: string) =>
    apiClient.post<never, Record<string, unknown>>('/protocol/claims', { message }),
}
