import { dateKey } from './month-utils'

export type WeekCell = {
  date: Date
  key: string
  isToday: boolean
}

export function weekBoundsFromOffset(offset: number): {
  start: Date
  end: Date
  label: string
  days: WeekCell[]
} {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfWeek = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - dayOfWeek + offset * 7)

  const days: WeekCell[] = []
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    days.push({
      date,
      key: dateKey(date),
      isToday: dateKey(date) === dateKey(today),
    })
  }

  const end = new Date(days[6].date)
  end.setHours(23, 59, 59, 999)

  const label = `${days[0].date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${days[6].date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return { start: days[0].date, end, label, days }
}
