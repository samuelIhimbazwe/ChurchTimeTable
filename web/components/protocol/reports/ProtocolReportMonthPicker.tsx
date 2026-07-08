'use client'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type Props = {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export function ProtocolReportMonthPicker({ year, month, onChange }: Props) {
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">
        Period
      </label>
      <select
        value={month}
        onChange={(e) => onChange(year, Number(e.target.value))}
        className="text-sm border border-border rounded-md px-2 py-1.5 bg-surface"
        aria-label="Report month"
      >
        {MONTH_NAMES.map((name, idx) => (
          <option key={name} value={idx + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onChange(Number(e.target.value), month)}
        className="text-sm border border-border rounded-md px-2 py-1.5 bg-surface"
        aria-label="Report year"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}

export function formatReportPeriod(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`
}
