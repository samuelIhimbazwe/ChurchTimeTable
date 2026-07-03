import type { ProtocolSchedulePlanEntry } from '@/lib/api/modules/protocol'

export type ScheduleViolation = {
  code: 'SAME_DAY_CHOIR'
  message: string
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

export function collectSameDayViolations(
  entries: ProtocolSchedulePlanEntry[],
): ScheduleViolation[] {
  const byKey = new Map<string, ProtocolSchedulePlanEntry[]>()
  for (const entry of entries) {
    if (!entry.occurrence) continue
    const key = `${dayKey(entry.occurrence.startAt)}:${entry.choirId}`
    const list = byKey.get(key) ?? []
    list.push(entry)
    byKey.set(key, list)
  }

  const violations: ScheduleViolation[] = []
  for (const group of byKey.values()) {
    if (group.length < 2) continue
    const choirName = group[0].choir?.name ?? 'Choir'
    const services = group
      .map((e) => e.occurrence?.title)
      .filter(Boolean)
      .join(', ')
    violations.push({
      code: 'SAME_DAY_CHOIR',
      message: `${choirName} is scheduled twice on the same day (${services}).`,
    })
  }
  return violations
}
