'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api'
import { useAuthStore } from '@/stores'
import type {
  MemberDashboardSummary,
  LeaderDashboardSummary,
  AdminDashboardSummary,
  ScoreBand,
  ScheduleItem,
  OperationOccurrence,
  ActionItem,
} from '@/types'

function choirKpi(raw: Record<string, unknown>) {
  const kpis = (raw.intelligence as { ministryKpis?: Array<Record<string, unknown>> } | undefined)?.ministryKpis
  return kpis?.find((k) => k.scope === 'CHOIR')
}

function mapScheduleItems(raw: unknown): ScheduleItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row: Record<string, unknown>) => {
    const event = row.event as Record<string, unknown> | undefined
    const occurrence = row.occurrence as Record<string, unknown> | undefined
    const startAt = String(
      row.date ?? row.serviceDate ?? event?.startTime ?? event?.startAt
      ?? occurrence?.startAt ?? '',
    )
    return {
      id:     String(row.id ?? event?.id ?? occurrence?.id ?? ''),
      title:  String(row.title ?? row.occurrenceTitle ?? event?.title ?? occurrence?.title ?? 'Service'),
      date:   startAt,
      time:   String(row.time ?? row.startTime ?? startAt),
      type:   String(row.type ?? 'SERVICE'),
      role:   row.role != null ? String(row.role) : undefined,
      source: (row.source as ScheduleItem['source']) ?? 'OPERATION',
    }
  })
}

function mapOccurrences(raw: unknown): OperationOccurrence[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row: Record<string, unknown>) => {
    const startAt = String(row.startAt ?? row.date ?? '')
    return {
      id:        String(row.id ?? ''),
      title:     String(row.title ?? ''),
      type:      (row.type as OperationOccurrence['type']) ?? 'SERVICE',
      status:    (row.status as OperationOccurrence['status']) ?? 'PUBLISHED',
      date:      startAt,
      startTime: row.startTime != null ? String(row.startTime) : startAt || undefined,
      endTime:   row.endAt != null ? String(row.endAt) : row.endTime != null ? String(row.endTime) : undefined,
      location:  row.location != null ? String(row.location) : undefined,
    }
  })
}

function mapMinistryHealth(raw: Record<string, unknown>) {
  const direct = raw.ministryHealth
  if (Array.isArray(direct) && direct.length && 'name' in (direct[0] as object)) {
    return direct as { name: string; percentage: number }[]
  }
  const nested = (raw.intelligence as { ministryHealth?: { indicators?: Array<Record<string, unknown>> } } | undefined)
    ?.ministryHealth?.indicators
  if (Array.isArray(nested)) {
    return nested.map((i) => ({
      name:       String(i.label ?? i.name ?? ''),
      percentage: Number(i.value ?? i.percentage ?? 0),
    }))
  }
  return []
}

function mapActionItems(raw: Record<string, unknown>): ActionItem[] {
  if (Array.isArray(raw.actionItems)) return raw.actionItems as ActionItem[]
  if (!Array.isArray(raw.alerts)) return []
  return raw.alerts.map((a: Record<string, unknown>, i: number) => ({
    id:   String(a.id ?? i),
    type: a.severity === 'high' || a.level === 'danger' ? 'danger'
      : a.severity === 'medium' || a.level === 'warning' ? 'warning'
      : 'info',
    text: String(a.message ?? a.text ?? a.title ?? ''),
    link: a.link != null ? String(a.link) : a.href != null ? String(a.href) : undefined,
  }))
}

function mapSystemHealth(raw?: string): AdminDashboardSummary['systemHealth'] {
  if (raw === 'attention' || raw === 'warning') return 'warning'
  if (raw === 'critical') return 'critical'
  return 'healthy'
}

function adaptMemberSummary(raw: Record<string, unknown>): MemberDashboardSummary {
  const attendanceScore = raw.attendanceScore as { percentage?: number; weightedPoints?: number; band?: ScoreBand } | undefined
  const schedule = mapScheduleItems(
    raw.upcomingSchedule ?? raw.upcomingAssignments,
  )
  const first = schedule[0]

  return {
    nextOccurrence: first ? {
      id:        first.id,
      title:     first.title,
      type:      'SERVICE',
      status:    'PUBLISHED',
      date:      first.date,
      startTime: first.time,
    } : raw.nextOccurrence as MemberDashboardSummary['nextOccurrence'],
    nextActivity:      raw.nextActivity as MemberDashboardSummary['nextActivity'] ?? raw.nextRehearsal as MemberDashboardSummary['nextActivity'],
    myAttendanceRate:  Number(raw.myAttendanceRate ?? raw.attendanceRate ?? attendanceScore?.percentage ?? 0),
    myScore:           Number(raw.myScore ?? raw.score ?? raw.responsibilityScore ?? attendanceScore?.weightedPoints ?? 0),
    myScoreBand:       (raw.myScoreBand ?? raw.scoreBand ?? attendanceScore?.band ?? 'good') as ScoreBand,
    myRank:            raw.myRank != null ? Number(raw.myRank) : raw.rank != null ? Number(raw.rank) : undefined,
    pendingSwapOffers: Number(raw.pendingSwapOffers ?? raw.pendingSwaps ?? raw.pendingReplacements ?? 0),
    unreadNotifications: Number(raw.unreadNotifications ?? 0),
    recentActivities:    (raw.recentActivities ?? raw.upcomingActivities ?? []) as MemberDashboardSummary['recentActivities'],
    upcomingSchedule:    schedule,
  }
}

function adaptLeaderSummary(raw: Record<string, unknown>): LeaderDashboardSummary {
  const choir = choirKpi(raw)
  return {
    pendingSwaps:        Number(raw.pendingSwaps ?? raw.pendingReplacements ?? raw.pendingSwapRequests ?? 0),
    pendingApprovals:    Number(raw.pendingApprovals ?? raw.pendingMembers ?? 0),
    attendanceRate:      Number(raw.attendanceRate ?? choir?.attendanceRate ?? 0),
    attendanceDelta:     Number(raw.attendanceDelta ?? 0),
    totalMembers:        Number(raw.totalMembers ?? raw.memberCount ?? choir?.activeMembers ?? 0),
    membersDelta:        Number(raw.membersDelta ?? raw.newMembers ?? 0),
    activeWelfare:       Number(raw.activeWelfare ?? raw.activeWelfareCases ?? raw.activeDiscipline ?? 0),
    eventsThisWeek:      Number(raw.eventsThisWeek ?? raw.upcomingEvents ?? raw.occurrencesThisWeek ?? 0),
    ministryHealth:      mapMinistryHealth(raw),
    actionItems:         mapActionItems(raw),
    upcomingOccurrences: mapOccurrences(raw.upcomingOccurrences ?? raw.upcomingEventList ?? raw.upcomingServices),
  }
}

function adaptAdminSummary(raw: Record<string, unknown>): AdminDashboardSummary {
  const systemStats = raw.systemStats as { members?: number; syncConflicts?: number } | undefined
  const syncDiagnostics = raw.syncDiagnostics as { totalConflicts?: number } | undefined
  const health = raw.health as { status?: string } | undefined
  const leaderBase = adaptLeaderSummary({
    ...raw,
    totalMembers:   raw.totalMembers ?? systemStats?.members,
    syncConflicts:  raw.syncConflicts ?? systemStats?.syncConflicts ?? syncDiagnostics?.totalConflicts,
  })

  return {
    ...leaderBase,
    totalMembers:     Number(leaderBase.totalMembers ?? systemStats?.members ?? 0),
    pendingMembers:   Number(raw.pendingMembers ?? raw.pendingApprovals ?? 0),
    syncConflicts:    Number(raw.syncConflicts ?? systemStats?.syncConflicts ?? syncDiagnostics?.totalConflicts ?? 0),
    systemHealth:     mapSystemHealth(String(raw.systemHealth ?? health?.status ?? 'healthy')),
    dataQualityScore: Number(raw.dataQualityScore ?? 0),
  }
}

export function useDashboard() {
  const role = useAuthStore((s) => s.user?.role)

  const isMember = role === 'MEMBER'
  const isAdmin  = role === 'SUPER_ADMIN' || role === 'CHURCH_ADMIN'

  return useQuery({
    queryKey:  ['dashboard', role],
    queryFn:   async () => {
      if (isMember) {
        const raw = await dashboardApi.getMemberSummary()
        return adaptMemberSummary(raw as unknown as Record<string, unknown>)
      }
      if (isAdmin) {
        const raw = await dashboardApi.getAdminSummary()
        return adaptAdminSummary(raw as unknown as Record<string, unknown>)
      }
      const raw = await dashboardApi.getLeaderSummary()
      return adaptLeaderSummary(raw as unknown as Record<string, unknown>)
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
