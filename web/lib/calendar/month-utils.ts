export type MonthCell = {
  date: Date
  inMonth: boolean
  key: string
}

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthBoundsFromOffset(offset: number) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const label = start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return { start, end, label, year: start.getFullYear(), month: start.getMonth() }
}

export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const gridStart = new Date(year, month, 1 - startPad)
  const cells: MonthCell[] = []
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    cells.push({
      date,
      inMonth: date.getMonth() === month,
      key: dateKey(date),
    })
  }
  return cells
}

export function groupByDayKey<T>(
  items: T[],
  getStartAt: (item: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const raw = getStartAt(item)
    if (!raw) continue
    const key = raw.slice(0, 10)
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  return map
}
