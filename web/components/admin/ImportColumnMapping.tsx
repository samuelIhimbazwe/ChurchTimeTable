'use client'

import { useMemo } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared'
import {
  IMPORT_COLUMN_SPECS,
  matchColumnToSpec,
  type ImportColumnSpec,
} from '@/lib/import/import-column-specs'
import { cn } from '@/lib/utils'

type Props = {
  importType: string
  fileColumns: string[]
}

export function ImportColumnMapping({ importType, fileColumns }: Props) {
  const specs = IMPORT_COLUMN_SPECS[importType] ?? []

  const rows = useMemo(() => {
    const matchedSpecKeys = new Set<string>()
    const fileMappings = fileColumns.map((col) => {
      const spec = matchColumnToSpec(col, specs)
      if (spec) matchedSpecKeys.add(spec.key)
      return { fileColumn: col, spec, status: spec ? 'matched' as const : 'unknown' as const }
    })
    const missingRequired = specs.filter(
      (s) => s.required && !matchedSpecKeys.has(s.key),
    )
    return { fileMappings, missingRequired }
  }, [fileColumns, specs])

  if (!specs.length) return null

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle>Column mapping</CardTitle>
        <CardDescription>
          Matched file headers against expected fields for this import type
        </CardDescription>
      </CardHeader>

      {fileColumns.length === 0 ? (
        <p className="text-sm text-text-muted">
          Upload a file to see column mapping. Excel files show mapping after preview.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="pb-2 pr-4 font-semibold">File column</th>
                <th className="pb-2 pr-4 font-semibold">Maps to</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.fileMappings.map((row) => (
                <tr key={row.fileColumn}>
                  <td className="py-2 pr-4 font-mono text-xs">{row.fileColumn}</td>
                  <td className="py-2 pr-4">{row.spec?.label ?? '—'}</td>
                  <td className="py-2">
                    {row.status === 'matched' ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                        <CheckCircle2 size={14} /> OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warning text-xs font-semibold">
                        <AlertTriangle size={14} /> Unmapped
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.missingRequired.length > 0 && (
        <div className="mt-4 rounded-lg border border-warning/40 bg-warning-light px-3 py-2">
          <p className="text-xs font-semibold text-warning">Missing required columns</p>
          <ul className="mt-1 space-y-0.5">
            {rows.missingRequired.map((s: ImportColumnSpec) => (
              <li key={s.key} className="text-xs text-text-secondary">
                {s.label}
                {s.aliases?.length ? ` (${s.aliases.join(', ')})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-4">
        <summary className="text-xs font-semibold text-primary-600 cursor-pointer">
          Expected columns reference
        </summary>
        <ul className={cn('mt-2 space-y-1 text-xs text-text-muted')}>
          {specs.map((s) => (
            <li key={s.key}>
              <span className="font-medium text-text-secondary">{s.label}</span>
              {s.required && ' (required)'}
              {s.aliases?.length ? ` — aliases: ${s.aliases.join(', ')}` : ''}
            </li>
          ))}
        </ul>
      </details>
    </Card>
  )
}
