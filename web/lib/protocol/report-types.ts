export type ProtocolHealthSnapshot = {
  score: number
  grade: string
  factors: {
    attendanceComponent: number
    backlogPenalty: number
    officerAttentionPenalty: number
  }
  attendanceRateAvg: number
  activeMembers: number
  pendingClaims: number
  pendingReplacements: number
  draftTeams: number
  officerAttentionCount: number | null
  year: number
  month: number
  generatedAt: string
}

export type ProtocolReportSummary = {
  year: number
  month: number
  health: ProtocolHealthSnapshot
  scheduling: {
    year: number
    month: number
    plan: {
      id: string
      label: string
      status: string
      entryCount: number
      publishedAt: string | null
    } | null
    teamsByStatus: Record<string, number>
    totalTeams: number
    publishedTeams: number
    occurrencesInMonth: number
  }
  monthlyService: {
    serviceCount: number
    totalRosterSlots: number
    totalAttended: number
    attendanceRate: number
  }
  replacements: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  quota: {
    maxPerMonth: number
    memberCount: number
    violationCount: number
  }
  teamReportsCount: number
  generatedAt: string
}

export type ProtocolMonthlyServiceReport = {
  year: number
  month: number
  serviceCount: number
  rosterSlots: number
  attended: number
  attendanceRate: number
  teams: Array<{
    id: string
    occurrenceTitle: string
    startAt: string
    status: string
    memberCount: number
    attended: number
    members: Array<{ name: string; outcome: string | null }>
  }>
}

export type ProtocolAttendanceReport = {
  year: number
  month: number
  rowCount: number
  avgAttendanceRate: number
  rows: Array<{
    memberId: string
    member: { firstName: string; lastName: string }
    assigned: number
    attended: number
    attendanceRate: number
    lateArrivals: number
    earlyDepartures: number
    unexcusedAbsences: number
    reliabilityScore: number
  }>
}

export type ProtocolReplacementReport = {
  year: number
  month: number
  total: number
  pending: number
  approved: number
  rejected: number
  rows: Array<{
    id: string
    status: string
    reason: string | null
    createdAt: string
    reviewedAt: string | null
    originalMember: { firstName: string; lastName: string }
    replacementMember: { firstName: string; lastName: string }
    occurrenceTitle?: string
    occurrenceStartAt?: string
  }>
}

export type ProtocolReliabilityReport = {
  rowCount: number
  rows: Array<{
    memberId: string
    member: { firstName: string; lastName: string }
    reliabilityScore: number
    attendanceRate: number
    unexcusedAbsences: number
    assignedCount: number
    attendedCount: number
    replacementServices: number
  }>
}

export type ProtocolSchedulingReport = ProtocolReportSummary['scheduling']

export type ProtocolQuotaReport = {
  year: number
  month: number
  maxPerMonth: number
  memberCount: number
  violationCount: number
  rows: Array<{
    memberId: string
    name: string
    assignmentsThisMonth: number
    maxAllowed: number
    compliant: boolean
  }>
}

export type ProtocolReportExportType =
  | 'monthly-service'
  | 'attendance'
  | 'replacements'
  | 'reliability'
  | 'scheduling'
  | 'quota'

export const PROTOCOL_REPORT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'services', label: 'Services' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'replacements', label: 'Replacements' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'quota', label: 'Quota' },
  { id: 'narratives', label: 'Team reports' },
] as const

export type ProtocolReportTabId = (typeof PROTOCOL_REPORT_TABS)[number]['id']
