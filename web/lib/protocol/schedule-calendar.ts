import type { CalendarDayEvent } from '@/components/calendar'
import type { ProtocolMonthlySchedulePrintGrid } from '@/lib/api/modules/protocol'
import { protocolServiceLabelRw } from '@/lib/protocol/schedule-labels'

export type ScheduleServiceRow = {
  occurrenceId: string
  templateCode: string | null
  labelRw: string
  labelEn: string
  date: string
  choirs: string[]
  weekIndex?: number
}

export function flattenScheduleServices(
  data: ProtocolMonthlySchedulePrintGrid,
): ScheduleServiceRow[] {
  const rows: ScheduleServiceRow[] = []
  for (const week of data.weeks) {
    for (const service of week.services) {
      rows.push({ ...service, weekIndex: week.weekIndex })
    }
  }
  for (const service of data.igaburo) {
    rows.push(service)
  }
  return rows.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
}

export function scheduleEventsByDay(
  services: ScheduleServiceRow[],
): Map<string, CalendarDayEvent[]> {
  const map = new Map<string, CalendarDayEvent[]>()
  for (const service of services) {
    const dayKey = service.date.slice(0, 10)
    const list = map.get(dayKey) ?? []
    list.push({
      id: service.occurrenceId,
      title: protocolServiceLabelRw(service.templateCode, service.labelRw),
      startAt: service.date,
      kind: service.templateCode === 'IGABURO' ? 'service' : 'choir',
    })
    map.set(dayKey, list)
  }
  return map
}

export function monthOffsetFromYearMonth(year: number, month: number) {
  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth() + 1
  return (year - nowYear) * 12 + (month - nowMonth)
}
