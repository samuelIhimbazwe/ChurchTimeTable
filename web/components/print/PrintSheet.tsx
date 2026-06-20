'use client'

import { Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PrintColumn = { key: string; label: string }
export type PrintRow = Record<string, string>

type Props = {
  sheetId: string
  title: string
  subtitle?: string
  columns: PrintColumn[]
  rows: PrintRow[]
  buttonLabel?: string
  className?: string
  disabled?: boolean
}

export function PrintSheet({
  sheetId,
  title,
  subtitle,
  columns,
  rows,
  buttonLabel = 'Print',
  className,
  disabled,
}: Props) {
  return (
    <>
      <button
        type="button"
        disabled={disabled || rows.length === 0}
        onClick={() => window.print()}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg',
          'hover:bg-surface-raised transition-colors text-text-secondary disabled:opacity-50 print:hidden',
          className,
        )}
      >
        <Printer size={15} />
        {buttonLabel}
      </button>

      <div
        id={sheetId}
        className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]"
        aria-hidden
      >
        <header className="border-b border-black/20 pb-4 mb-4">
          <p className="text-xs uppercase tracking-wide text-black/60">CMMS</p>
          <h1 className="text-2xl font-bold mt-1">{title}</h1>
          {subtitle && <p className="text-sm text-black/70 mt-1">{subtitle}</p>}
          <p className="text-xs text-black/50 mt-2">
            Printed {new Date().toLocaleString()}
          </p>
        </header>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black/20 text-left">
              {columns.map((col) => (
                <th key={col.key} className="py-2 pr-3 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-black/10">
                {columns.map((col) => (
                  <td key={col.key} className="py-2 pr-3 align-top">
                    {row[col.key] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-sm text-black/60">No rows to print.</p>
        )}
      </div>
    </>
  )
}
