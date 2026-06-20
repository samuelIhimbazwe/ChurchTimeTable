export function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

export type AgingTone = 'fresh' | 'aging' | 'stale' | 'critical'

export function agingTone(days: number): AgingTone {
  if (days < 3) return 'fresh'
  if (days < 7) return 'aging'
  if (days < 14) return 'stale'
  return 'critical'
}

export function agingLabel(days: number): string {
  if (days === 0) return 'Opened today'
  if (days === 1) return '1 day open'
  return `${days} days open`
}
