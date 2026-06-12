import { apiClient } from '../client'
import type {
  ProtocolOccurrenceTeam, ProtocolAttendanceOutcome,
  ProtocolReplacementRequest, ProtocolRankingEntry,
  ReplacementRequestStatus, ProtocolTeamStatus,
} from '@/types'

export interface SubmitProtocolAttendancePayload {
  teamId: string
  records: {
    teamMemberId: string
    outcome:      ProtocolAttendanceOutcome
    note?:        string
  }[]
}

function memberName(row?: { firstName?: string; lastName?: string } | null): string {
  if (!row) return 'Unknown'
  return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Unknown'
}

function adaptTeam(raw: Record<string, unknown>): ProtocolOccurrenceTeam {
  const members = Array.isArray(raw.members) ? raw.members : []
  const teamLeaders = Array.isArray(raw.teamLeaders) ? raw.teamLeaders : []
  const backups = Array.isArray(raw.backups) ? raw.backups : []

  return {
    id:           String(raw.id ?? ''),
    occurrenceId: String(raw.occurrenceId ?? ''),
    status:       String(raw.status ?? 'GENERATED') as ProtocolTeamStatus,
    createdAt:    String(raw.generatedAt ?? raw.createdAt ?? ''),
    backupCount:  backups.length,
    members: members.map((row: Record<string, unknown>) => {
      const member = row.member as { id?: string; firstName?: string; lastName?: string } | undefined
      const attendance = row.attendance as { outcome?: ProtocolAttendanceOutcome } | undefined
      const choir = row.choir as { name?: string } | undefined
      return {
        id:         String(row.id ?? ''),
        memberId:   String(row.memberId ?? member?.id ?? ''),
        memberName: memberName(member),
        choirName:  choir?.name,
        type:       String(row.assignmentType ?? 'OFFICIAL') as ProtocolOccurrenceTeam['members'][number]['type'],
        attended:   attendance?.outcome,
      }
    }),
    leaders: teamLeaders.map((row: Record<string, unknown>) => {
      const leader = row.protocolTeamLeader as Record<string, unknown> | undefined
      const member = leader?.member as { id?: string; firstName?: string; lastName?: string } | undefined
      const choir = leader?.choir as { id?: string } | undefined
      return {
        id:               String(leader?.id ?? row.id ?? ''),
        memberId:         String(leader?.memberId ?? member?.id ?? ''),
        memberName:       memberName(member),
        choirId:          choir?.id,
        isNonChoirLeader: Boolean(leader?.isNonChoirLeader),
      }
    }),
  }
}

function adaptReplacement(row: Record<string, unknown>): ProtocolReplacementRequest {
  const original = row.originalMember as { id?: string; firstName?: string; lastName?: string } | undefined
  const teamMember = row.teamMember as Record<string, unknown> | undefined
  const team = teamMember?.team as Record<string, unknown> | undefined
  const occurrence = team?.occurrence as { id?: string; title?: string } | undefined

  return {
    id:              String(row.id ?? ''),
    requesterId:     String(row.originalMemberId ?? original?.id ?? ''),
    requesterName:   memberName(original),
    occurrenceId:    String(occurrence?.id ?? team?.occurrenceId ?? ''),
    occurrenceTitle: String(occurrence?.title ?? 'Service'),
    reason:          String(row.reason ?? ''),
    status:          String(row.status ?? 'PENDING') as ReplacementRequestStatus,
    createdAt:       String(row.createdAt ?? ''),
  }
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

  getAdminDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/protocol/dashboard/admin'),

  getSettings: () =>
    apiClient.get<never, Record<string, unknown>>('/protocol/settings'),

  updateSettings: (data: {
    maxOfficialServicesPerMonth?: number
    maxNonChoirMembers?: number
    backupPoolSize?: number
    membersCanViewFullRanking?: boolean
  }) => apiClient.patch<never, Record<string, unknown>>('/protocol/settings', data),

  getTeamLeaderDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/protocol/dashboard/team-leader'),

  getTeamForOccurrence: async (occurrenceId: string) => {
    const raw = await apiClient.get<never, Record<string, unknown>>(
      `/protocol/occurrences/${occurrenceId}/team`,
    )
    return adaptTeam(raw)
  },

  getTeam: async (teamId: string) => {
    const raw = await apiClient.get<never, Record<string, unknown>>(`/protocol/teams/${teamId}`)
    return adaptTeam(raw)
  },

  getMyStats: async () => {
    const raw = await apiClient.get<never, Record<string, unknown>>('/protocol/dashboard/me')
    return adaptMyStats(raw)
  },

  listTeams: (params?: { from?: string; to?: string }) =>
    apiClient.get<never, unknown[]>('/protocol/teams', { params }),

  listTeamOccurrences: () =>
    apiClient.get<never, Array<{
      id: string
      title: string
      startAt: string
      endAt: string
      status: string
      hasTeam: boolean
      teamStatus: string | null
    }>>('/protocol/occurrences'),

  getRecommendations: (occurrenceId: string) =>
    apiClient.get<never, Array<{
      memberId: string
      displayName: string
      quotaStatus: string
      officialServicesMonth: number
      score: number
      choirName?: string
      totalServicesMonth?: number
      attendanceRate?: number
      reliabilityScore?: number
      attendancePoints?: number
    }>>(`/protocol/occurrences/${occurrenceId}/recommendations`),

  generateTeam: (occurrenceId: string, memberIds?: string[]) =>
    apiClient.post<never, Record<string, unknown>>('/protocol/teams/generate', {
      occurrenceId, memberIds,
    }),

  updateTeamStatus: (teamId: string, status: ProtocolTeamStatus) =>
    apiClient.patch<never, Record<string, unknown>>(`/protocol/teams/${teamId}/status`, { status }),

  getBackups: (teamId: string) =>
    apiClient.get<never, unknown[]>(`/protocol/backups`, { params: { teamId } }),

  regenerateBackups: (teamId: string) =>
    apiClient.post<never, unknown[]>(`/protocol/teams/${teamId}/backups/regenerate`, {}),

  getReports: () =>
    apiClient.get<never, unknown[]>('/protocol/reports'),

  exportReportCsv: (type: 'monthly-service' | 'reliability', params?: { year?: number; month?: number }) =>
    apiClient.get<never, Blob>(`/protocol/reports/${type}/export`, {
      params,
      responseType: 'blob',
    }),

  submitReport: (data: { teamId: string; summary: string; issues?: string; recommendations?: string }) =>
    apiClient.post<never, Record<string, unknown>>('/protocol/reports', data),

  listTeamLeaders: () =>
    apiClient.get<never, unknown[]>('/protocol/team-leaders'),

  getClaims: () =>
    apiClient.get<never, unknown[]>('/protocol/claims'),

  reviewClaimFull: (id: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) =>
    apiClient.patch<never, void>(`/protocol/claims/${id}`, { status, reviewNotes }),

  submitAttendance: async (payload: SubmitProtocolAttendancePayload) => {
    let saved = 0
    for (const record of payload.records) {
      await apiClient.post<never, unknown>('/protocol/attendance', {
        teamMemberId: record.teamMemberId,
        outcome: record.outcome,
        notes: record.note,
      })
      saved += 1
    }
    return { saved }
  },

  getRankings: async (params?: { year?: number; month?: number; category?: string }) => {
    const now = new Date()
    const year = params?.year ?? now.getFullYear()
    const month = params?.month ?? now.getMonth() + 1
    const category = params?.category ?? 'OVERALL'
    const raw = category === 'OVERALL'
      ? await apiClient.get<never, unknown>('/protocol/rankings/monthly', { params: { year, month } })
      : await apiClient.get<never, unknown>('/protocol/rankings/categories', {
          params: { year, month, category },
        })
    return adaptRankingEntries(raw)
  },

  generateRankings: (year?: number, month?: number) => {
    const now = new Date()
    return apiClient.post<never, unknown>('/protocol/rankings/generate', {
      year: year ?? now.getFullYear(),
      month: month ?? now.getMonth() + 1,
    })
  },

  requestReplacement: (data: {
    teamMemberId: string
    replacementMemberId: string
    reason?: string
  }) =>
    apiClient.post<never, ProtocolReplacementRequest>(
      '/protocol/replacements', data,
    ).then((raw) => adaptReplacement(raw as unknown as Record<string, unknown>)),

  getReplacements: async (params?: { status?: ReplacementRequestStatus }) => {
    const raw = await apiClient.get<never, unknown[]>('/protocol/replacements', { params })
    return raw.map((row) => adaptReplacement(row as Record<string, unknown>))
  },

  reviewReplacement: (id: string, action: 'APPROVED' | 'REJECTED') =>
    apiClient.patch<never, ProtocolReplacementRequest>(
      `/protocol/replacements/${id}`, { status: action },
    ).then((raw) => adaptReplacement(raw as unknown as Record<string, unknown>)),

  listInvitations: () =>
    apiClient.get<never, unknown[]>('/protocol/invitations'),

  listMyInvitations: () =>
    apiClient.get<never, unknown[]>('/protocol/invitations/mine'),

  sendInvitation: (data: { memberId: string; message?: string; expiresInDays?: number }) =>
    apiClient.post<never, Record<string, unknown>>('/protocol/invitations', data),

  respondInvitation: (id: string, status: 'ACCEPTED' | 'DECLINED') =>
    apiClient.patch<never, Record<string, unknown>>(`/protocol/invitations/${id}`, { status }),

  listProtocolMembers: () =>
    apiClient.get<never, unknown[]>('/protocol/members'),

  getMyDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/protocol/dashboard/me'),

  createTeamLeader: (data: {
    memberId: string
    choirId?: string
    label?: string
    isNonChoirLeader?: boolean
    notes?: string
  }) => apiClient.post<never, Record<string, unknown>>('/protocol/team-leaders', data),

  updateTeamLeader: (id: string, data: {
    active?: boolean
    label?: string
    notes?: string
    choirId?: string | null
  }) => apiClient.patch<never, Record<string, unknown>>(`/protocol/team-leaders/${id}`, data),

  assignTeamLeader: (teamId: string, protocolTeamLeaderId: string, overrideReason?: string) =>
    apiClient.post<never, Record<string, unknown>>(`/protocol/teams/${teamId}/leader`, {
      protocolTeamLeaderId,
      overrideReason,
    }),

  recommendTeamLeader: (teamId: string) =>
    apiClient.get<never, Record<string, unknown>>(`/protocol/teams/${teamId}/leader/recommendation`),

  reviewClaim: (claimId: string, action: 'APPROVED' | 'REJECTED') =>
    apiClient.patch<never, void>(`/protocol/claims/${claimId}`, { status: action }),

  submitClaim: (message?: string) =>
    apiClient.post<never, Record<string, unknown>>('/protocol/claims', { message }),
}
