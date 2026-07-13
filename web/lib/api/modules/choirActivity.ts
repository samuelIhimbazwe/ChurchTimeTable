import { apiClient } from '../client'
import type {
  ChoirActivity, ChoirAttendanceRecord,
  ChoirAttendanceOutcome, Paginated,
} from '@/types'

export interface ActivitiesParams {
  page?:        number
  limit?:       number
  from?:        string
  to?:          string
  activityType?: string
  choirId?:     string
}

export interface SubmitChoirAttendancePayload {
  activityId: string
  records: {
    memberId: string
    outcome:  ChoirAttendanceOutcome
    note?:    string
  }[]
}

function asIsoDate(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value
  if (value instanceof Date) return value.toISOString()
  return new Date().toISOString()
}

function normalizeActivity(raw: unknown): ChoirActivity | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = typeof row.id === 'string' ? row.id : null
  const title = typeof row.title === 'string' ? row.title : null
  const choirId = typeof row.choirId === 'string' ? row.choirId : null
  if (!id || !title || !choirId) return null

  const startAt = row.startAt ?? row.date ?? row.startTime
  const endAt = row.endAt ?? row.endTime
  const choir =
    row.choir && typeof row.choir === 'object'
      ? (row.choir as Record<string, unknown>)
      : null

  return {
    id,
    choirId,
    choirName:
      (typeof row.choirName === 'string' ? row.choirName : undefined)
      ?? (typeof choir?.name === 'string' ? choir.name : undefined),
    activityType: (typeof row.activityType === 'string'
      ? row.activityType
      : 'OTHER') as ChoirActivity['activityType'],
    title,
    date: asIsoDate(startAt),
    startTime: startAt != null ? asIsoDate(startAt) : undefined,
    endTime: endAt != null ? asIsoDate(endAt) : undefined,
    location: typeof row.location === 'string' ? row.location : undefined,
    occurrenceId: typeof row.occurrenceId === 'string' ? row.occurrenceId : undefined,
    attendanceOpen: Boolean(row.attendanceOpen ?? true),
    attendanceCount:
      typeof row.attendanceCount === 'number'
        ? row.attendanceCount
        : Number((row._count as { attendance?: number } | undefined)?.attendance ?? 0) || undefined,
    memberCount: typeof row.memberCount === 'number' ? row.memberCount : undefined,
  }
}

function normalizeActivities(raw: unknown): Paginated<ChoirActivity> {
  const source = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : []
  const items = source
    .map(normalizeActivity)
    .filter((a): a is ChoirActivity => Boolean(a))
  const meta = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
  return {
    items,
    total: typeof meta.total === 'number' ? meta.total : items.length,
    page: typeof meta.page === 'number' ? meta.page : 1,
    limit: typeof meta.limit === 'number' ? meta.limit : items.length,
    totalPages: typeof meta.totalPages === 'number' ? meta.totalPages : 1,
  }
}

export const choirActivityApi = {
  getAll: async (params?: ActivitiesParams) => {
    const raw = await apiClient.get<never, unknown>(
      '/choir/scheduling/activities', { params })
    return normalizeActivities(raw)
  },

  getById: async (id: string) => {
    const raw = await apiClient.get<never, unknown>(
      `/choir/scheduling/activities/${id}`)
    const activity = normalizeActivity(raw)
    if (!activity) throw new Error('Activity not found')
    return activity
  },

  getAttendance: (activityId: string) =>
    apiClient.get<never, ChoirAttendanceRecord[]>(
      `/choir/scheduling/activities/${activityId}/attendance`),

  submitAttendance: (payload: SubmitChoirAttendancePayload) =>
    apiClient.post<never, { saved: number }>(
      `/choir/scheduling/activities/${payload.activityId}/attendance`,
      payload),

  getCalendar: (choirId: string, params?: { from?: string; to?: string }) =>
    apiClient.get<never, ChoirActivity[]>(
      `/choir/scheduling/calendar/${choirId}`, { params }),
}
