export type SavedTableView = {
  id: string
  name: string
  columnIds: string[]
  createdAt: number
}

const PREFIX = 'cmms-table-view-'

export function loadTableViews(tableId: string): SavedTableView[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${PREFIX}${tableId}`)
    return raw ? (JSON.parse(raw) as SavedTableView[]) : []
  } catch {
    return []
  }
}

export function saveTableView(tableId: string, view: SavedTableView): void {
  const existing = loadTableViews(tableId).filter((v) => v.id !== view.id)
  localStorage.setItem(`${PREFIX}${tableId}`, JSON.stringify([view, ...existing].slice(0, 8)))
}

export function deleteTableView(tableId: string, viewId: string): void {
  const next = loadTableViews(tableId).filter((v) => v.id !== viewId)
  localStorage.setItem(`${PREFIX}${tableId}`, JSON.stringify(next))
}

export function exportRowsToCsv(
  rows: Record<string, unknown>[],
  columns: { id: string; header: string }[],
): void {
  const header = columns.map((c) => c.header)
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const val = row[c.id]
        const cell = val == null ? '' : String(val)
        return `"${cell.replace(/"/g, '""')}"`
      })
      .join(','),
  )
  const csv = [header.map((h) => `"${h}"`).join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
