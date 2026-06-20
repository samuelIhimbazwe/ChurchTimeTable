const PREFIX = 'cmms-snooze-'

export function snoozeUntil(entityKey: string, until: Date): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${PREFIX}${entityKey}`, until.toISOString())
}

export function clearSnooze(entityKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${PREFIX}${entityKey}`)
}

export function getSnoozeUntil(entityKey: string): Date | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(`${PREFIX}${entityKey}`)
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isSnoozed(entityKey: string): boolean {
  const until = getSnoozeUntil(entityKey)
  if (!until) return false
  if (until.getTime() <= Date.now()) {
    clearSnooze(entityKey)
    return false
  }
  return true
}

export function snoozeForDays(entityKey: string, days: number): void {
  const until = new Date()
  until.setDate(until.getDate() + days)
  snoozeUntil(entityKey, until)
}
