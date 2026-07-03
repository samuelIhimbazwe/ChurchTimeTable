'use client'

import { useEffect, useRef, useState } from 'react'
import type { ProtocolMonthlySchedulePrintGrid } from '@/lib/api/modules/protocol'
import {
  exportScheduleExcel,
  exportSchedulePdf,
  exportScheduleWord,
  scheduleExportFilename,
} from '@/lib/protocol/schedule-export'
import { toast } from '@/components/shared/Toast'
import { cn } from '@/lib/utils'
import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react'

type ExportKind = 'pdf' | 'docx' | 'xlsx'

const OPTIONS: Array<{
  kind: ExportKind
  label: string
  hint: string
  icon: React.ElementType
}> = [
  { kind: 'pdf', label: 'PDF', hint: 'Bulletin layout', icon: FileText },
  { kind: 'docx', label: 'Word', hint: 'Editable document', icon: FileType },
  { kind: 'xlsx', label: 'Excel', hint: 'Spreadsheet table', icon: FileSpreadsheet },
]

type Props = {
  data: ProtocolMonthlySchedulePrintGrid
  bulletinElementId?: string
  onBeforePdfExport?: () => Promise<void> | void
  onAfterPdfExport?: () => Promise<void> | void
  className?: string
  buttonClassName?: string
}

export function ProtocolScheduleExportMenu({
  data,
  bulletinElementId = 'protocol-schedule-bulletin',
  onBeforePdfExport,
  onAfterPdfExport,
  className,
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<ExportKind | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const runExport = async (kind: ExportKind) => {
    setBusy(kind)
    try {
      const filename = scheduleExportFilename(data, kind)
      if (kind === 'pdf') {
        await onBeforePdfExport?.()
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
        await exportSchedulePdf(bulletinElementId, filename)
        await onAfterPdfExport?.()
      } else if (kind === 'docx') {
        await exportScheduleWord(data, filename)
      } else {
        await exportScheduleExcel(data, filename)
      }
      toast.success(`Downloaded ${filename}`)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border border-border bg-surface hover:bg-surface-raised disabled:opacity-60',
          buttonClassName,
        )}
        disabled={Boolean(busy)}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Download size={16} />
        {busy ? 'Exporting…' : 'Download'}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full mb-2 right-0 z-[100] min-w-[220px] rounded-xl border border-border bg-surface shadow-xl py-1.5"
        >
          {OPTIONS.map(({ kind, label, hint, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              role="menuitem"
              disabled={Boolean(busy)}
              className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-surface-raised disabled:opacity-60"
              onClick={() => void runExport(kind)}
            >
              <Icon size={18} className="mt-0.5 shrink-0 text-text-muted" />
              <span>
                <span className="block text-sm font-semibold text-text-primary">{label}</span>
                <span className="block text-[11px] text-text-muted">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
