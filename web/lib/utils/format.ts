import { ScoreBand } from '@/types'

export function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatTime(time: string): string {
  if (!time) return ''
  // Accepts "09:00" or full ISO
  const t = time.includes('T') ? new Date(time) : new Date(`1970-01-01T${time}`)
  return t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatCurrency(amount: number, currency = 'RWF'): string {
  return `${amount.toLocaleString()} ${currency}`
}

export function scoreBandLabel(band: ScoreBand): string {
  return band === 'excellent' ? 'Excellent' :
         band === 'good'      ? 'Good'      : 'Needs Attention'
}

export function outcomeLabel(outcome: string): string {
  return outcome
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)   return 'just now'
  if (min < 60)  return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24)   return `${hr}h ago`
  const d  = Math.floor(hr / 24)
  return `${d}d ago`
}
