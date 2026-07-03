import type { ScheduleServiceRow } from '@/lib/protocol/schedule-calendar'

/** Mirrors backend SERVICE_DEFAULT_TIMES */
export const SERVICE_TIMES: Record<
  string,
  { startHour: number; startMinute: number; endHour: number; endMinute: number }
> = {
  SUNDAY_SERVICE_1: { startHour: 8, startMinute: 0, endHour: 10, endMinute: 0 },
  SUNDAY_SERVICE_2: { startHour: 10, startMinute: 30, endHour: 12, endMinute: 30 },
  TUESDAY_SERVICE: { startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 },
  FRIDAY_SERVICE: { startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 },
  IGABURO: { startHour: 17, startMinute: 0, endHour: 19, endMinute: 0 },
}

/** Soft pastel palette — aligned with bulletin column tints */
export const CHOIR_SEGMENT_COLORS = [
  { bg: '#B8D4E8', border: '#8BB4D4', text: '#1E3A5F' },
  { bg: '#F5D0A8', border: '#E0B080', text: '#5C3D1E' },
  { bg: '#C8E6C9', border: '#9FD4A0', text: '#1E4D2E' },
  { bg: '#A5D6A7', border: '#7BC47E', text: '#1A4020' },
  { bg: '#E8F4FC', border: '#B8D8F0', text: '#1E4A6E' },
  { bg: '#F5E6A8', border: '#E8D080', text: '#5C4A1A' },
  { bg: '#D4C4E8', border: '#B8A0D4', text: '#3D2E5C' },
  { bg: '#F8C8D8', border: '#E8A8C0', text: '#5C2E3E' },
  { bg: '#C8E0E8', border: '#98C8D8', text: '#1E4A56' },
  { bg: '#E8D4C8', border: '#D4B8A8', text: '#4A3828' },
  { bg: '#D8E8C8', border: '#B8D898', text: '#2E4A1E' },
  { bg: '#C8D8E8', border: '#A8C0D8', text: '#2E3E5C' },
] as const

export function choirSegmentPalette(colorIndex: number) {
  if (colorIndex < 0) {
    return { bg: '#F5E6A8', border: '#E8D080', text: '#78350F' }
  }
  return CHOIR_SEGMENT_COLORS[colorIndex % CHOIR_SEGMENT_COLORS.length]
}

export type ChoirColorMap = Map<string, number>

/** One stable color per choir name across the whole month. */
export function buildChoirColorMap(services: ScheduleServiceRow[]): ChoirColorMap {
  const names = new Set<string>()
  for (const service of services) {
    for (const name of service.choirs) names.add(name)
  }
  const sorted = [...names].sort((a, b) => a.localeCompare(b))
  const map: ChoirColorMap = new Map()
  sorted.forEach((name, i) => {
    map.set(name, i % CHOIR_SEGMENT_COLORS.length)
  })
  return map
}

export function choirColorEntries(map: ChoirColorMap): Array<{ name: string; colorIndex: number }> {
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, colorIndex]) => ({ name, colorIndex }))
}

export type TimelineSegment = {
  choirName: string
  colorIndex: number
  /** 0–100 within the service bar */
  leftPct: number
  widthPct: number
}

export type TimelineServiceRow = {
  occurrenceId: string
  templateCode: string | null
  serviceLabel: string
  date: string
  dateLabel: string
  isToday: boolean
  startAt: Date
  endAt: Date
  startLabel: string
  endLabel: string
  durationLabel: string
  choirs: string[]
  segments: TimelineSegment[]
  unassigned: boolean
  hourMarkers: string[]
}

function formatClock(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDuration(start: Date, end: Date) {
  const mins = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function serviceWindow(service: ScheduleServiceRow): { start: Date; end: Date } {
  const base = new Date(service.date)
  const times = service.templateCode ? SERVICE_TIMES[service.templateCode] : null
  if (!times) {
    const start = new Date(base)
    start.setHours(8, 0, 0, 0)
    const end = new Date(base)
    end.setHours(10, 0, 0, 0)
    return { start, end }
  }
  const start = new Date(base)
  start.setHours(times.startHour, times.startMinute, 0, 0)
  const end = new Date(base)
  end.setHours(times.endHour, times.endMinute, 0, 0)
  return { start, end }
}

function buildHourMarkers(start: Date, end: Date): string[] {
  const markers: string[] = []
  const cursor = new Date(start)
  cursor.setMinutes(0, 0, 0)
  if (cursor < start) cursor.setHours(cursor.getHours() + 1)
  while (cursor <= end) {
    markers.push(
      cursor.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
    )
    cursor.setHours(cursor.getHours() + 1)
  }
  if (markers.length === 0) {
    markers.push(formatClock(start).replace(/\s?(AM|PM)/i, ''))
  }
  return markers
}

function dateRowLabel(iso: string, now: Date): { label: string; isToday: boolean } {
  const d = new Date(iso)
  const today =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (today) return { label: 'Today', isToday: true }
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const day = d.getDate()
  return { label: `${weekday}, ${day}`, isToday: false }
}

function buildSegments(choirs: string[], colorMap: ChoirColorMap): TimelineSegment[] {
  if (choirs.length === 0) {
    return [{ choirName: 'Unassigned', colorIndex: -1, leftPct: 0, widthPct: 100 }]
  }
  const width = 100 / choirs.length
  return choirs.map((choirName, i) => ({
    choirName,
    colorIndex: colorMap.get(choirName) ?? i % CHOIR_SEGMENT_COLORS.length,
    leftPct: i * width,
    widthPct: width,
  }))
}

export function buildTimelineRows(
  services: ScheduleServiceRow[],
  now = new Date(),
): TimelineServiceRow[] {
  const colorMap = buildChoirColorMap(services)
  return services.map((service) => {
    const { start, end } = serviceWindow(service)
    const { label, isToday } = dateRowLabel(service.date, now)
    const choirs = service.choirs
    return {
      occurrenceId: service.occurrenceId,
      templateCode: service.templateCode,
      serviceLabel: service.labelRw || service.labelEn,
      date: service.date,
      dateLabel: label,
      isToday,
      startAt: start,
      endAt: end,
      startLabel: formatClock(start),
      endLabel: formatClock(end),
      durationLabel: formatDuration(start, end),
      choirs,
      segments: buildSegments(choirs, colorMap),
      unassigned: choirs.length === 0,
      hourMarkers: buildHourMarkers(start, end),
    }
  })
}

export type TimelineSummary = {
  totalServices: number
  assignedServices: number
  unassignedServices: number
  totalChoirSlots: number
  uniqueChoirs: number
}

export function timelineSummary(rows: TimelineServiceRow[]): TimelineSummary {
  const choirSet = new Set<string>()
  let totalChoirSlots = 0
  let unassignedServices = 0
  for (const row of rows) {
    if (row.unassigned) unassignedServices += 1
    totalChoirSlots += row.choirs.length
    for (const c of row.choirs) choirSet.add(c)
  }
  return {
    totalServices: rows.length,
    assignedServices: rows.length - unassignedServices,
    unassignedServices,
    totalChoirSlots,
    uniqueChoirs: choirSet.size,
  }
}
