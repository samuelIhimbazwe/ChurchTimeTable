'use client'

import { Download } from 'lucide-react'
import { toast } from '@/components/shared'
import { protocolApi } from '@/lib/api'
import type { ProtocolReportExportType } from '@/lib/protocol/report-types'

type Props = {
  year: number
  month: number
  types: ProtocolReportExportType[]
}

async function downloadBlob(fetcher: () => Promise<Blob>, filename: string) {
  try {
    const blob = await fetcher()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  } catch {
    toast.error('Export failed')
  }
}

const LABELS: Record<ProtocolReportExportType, string> = {
  'monthly-service': 'Services CSV',
  attendance: 'Attendance CSV',
  replacements: 'Replacements CSV',
  reliability: 'Reliability CSV',
  scheduling: 'Scheduling CSV',
  quota: 'Quota CSV',
}

export function ProtocolReportExportBar({ year, month, types }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() =>
            downloadBlob(
              () => protocolApi.exportReportCsv(type, { year, month }),
              `protocol-${type}-${year}-${month}.csv`,
            )
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-surface-raised transition-colors"
        >
          <Download size={14} />
          {LABELS[type]}
        </button>
      ))}
    </div>
  )
}

export async function downloadHealthPackPdf(year: number, month: number) {
  await downloadBlob(
    () => protocolApi.exportHealthPackPdf({ year, month }) as unknown as Promise<Blob>,
    `protocol-report-${year}-${String(month).padStart(2, '0')}.pdf`,
  )
}
