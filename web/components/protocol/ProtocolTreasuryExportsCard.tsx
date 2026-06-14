'use client'

import { financeApi } from '@/lib/api'
import { Card, PermissionGate, toast } from '@/components/shared'
import { Download } from 'lucide-react'

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

export function ProtocolTreasuryExportsCard() {
  const stamp = new Date().toISOString().slice(0, 10)

  return (
    <PermissionGate anyOf={['protocol.finance.view', 'protocol.finance.manage', 'protocol.finance.approve']}>
      <Card padding="md" className="space-y-3">
        <p className="text-sm font-semibold text-text-primary">Stewardship exports</p>
        <p className="text-xs text-text-muted">
          Protocol-scoped contribution exports for treasurer records (not church-wide finance).
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                () =>
                  financeApi.exportMinistryPdf({ ministryScope: 'PROTOCOL' }) as unknown as Promise<Blob>,
                `protocol-contributions-${stamp}.pdf`,
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-surface-raised"
          >
            <Download size={14} /> Contributions PDF
          </button>
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                () =>
                  financeApi.exportMinistryCsv({ ministryScope: 'PROTOCOL' }) as unknown as Promise<Blob>,
                `protocol-contributions-${stamp}.csv`,
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-surface-raised"
          >
            <Download size={14} /> Contributions CSV
          </button>
        </div>
      </Card>
    </PermissionGate>
  )
}
