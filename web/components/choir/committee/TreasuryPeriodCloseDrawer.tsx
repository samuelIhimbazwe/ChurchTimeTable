'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Download, Lock, X } from 'lucide-react'
import { contributionsApi, type TreasuryPeriodCloseStatus } from '@/lib/api/modules/contributions'
import { toast } from '@/components/shared/Toast'
import { Badge, Card } from '@/components/shared'

type Props = {
  open: boolean
  onClose: () => void
  choirId: string
  status: TreasuryPeriodCloseStatus | undefined
}

function CheckRow({
  done,
  label,
  detail,
}: {
  done: boolean
  label: string
  detail?: string | null
}) {
  const Icon = done ? CheckCircle2 : Circle
  return (
    <li className="flex items-start gap-3 text-sm">
      <Icon
        size={18}
        className={done ? 'text-success shrink-0 mt-0.5' : 'text-text-muted shrink-0 mt-0.5'}
      />
      <div>
        <p className={done ? 'text-text-primary font-medium' : 'text-text-secondary'}>{label}</p>
        {detail && <p className="text-xs text-text-muted mt-0.5">{detail}</p>}
      </div>
    </li>
  )
}

export function TreasuryPeriodCloseDrawer({ open, onClose, choirId, status }: Props) {
  const qc = useQueryClient()

  const exportPack = useMutation({
    mutationFn: () =>
      contributionsApi.exportTreasuryPeriodPdf(choirId, status?.month),
    onSuccess: () => {
      toast.success('Month export pack downloaded')
      qc.invalidateQueries({ queryKey: ['treasury-dashboard', choirId] })
    },
    onError: (err: Error) => toast.error('Could not generate export', err.message),
  })

  const closePeriod = useMutation({
    mutationFn: () =>
      contributionsApi.closeTreasuryPeriod(choirId, { month: status?.month }),
    onSuccess: () => {
      toast.success('Period marked closed')
      qc.invalidateQueries({ queryKey: ['treasury-dashboard', choirId] })
      onClose()
    },
    onError: (err: Error) => toast.error('Could not close period', err.message),
  })

  if (!open) return null

  const monthLabel = status?.monthLabel ?? 'This month'
  const busy = exportPack.isPending || closePeriod.isPending

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close period close drawer"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col max-h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-display text-xl text-text-primary">Period close</p>
            <p className="text-xs text-text-muted mt-0.5">{monthLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-raised text-text-muted"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Card padding="md" accent="info">
            <p className="text-sm text-text-secondary">
              Oracle-style month-end close — clear verification queues, export the board pack,
              then mark the period closed with audit.
            </p>
          </Card>

          {status?.monthClosed && (
            <Badge variant="status-present" dot>
              Closed {status.closedAt ? new Date(status.closedAt).toLocaleDateString() : ''}
            </Badge>
          )}

          <ul className="space-y-4">
            <CheckRow
              done={Boolean(status?.treasuryQueueEmpty)}
              label="Family-approved queue empty"
              detail={
                status?.treasuryQueueEmpty
                  ? 'No family gifts awaiting post'
                  : 'Verify remaining family-approved gifts first'
              }
            />
            <CheckRow
              done={Boolean(status?.sponsorQueueEmpty)}
              label="Sponsor queue empty"
              detail={
                status?.sponsorQueueEmpty
                  ? 'No sponsor gifts awaiting confirm'
                  : 'Confirm sponsor gifts in verify console'
              }
            />
            <CheckRow
              done={Boolean(status?.exportGenerated)}
              label="Month export generated"
              detail={
                status?.exportGenerated
                  ? status.exportGeneratedBy
                    ? `By ${status.exportGeneratedBy}`
                    : 'PDF pack ready'
                  : 'Download the treasury pack for this month'
              }
            />
          </ul>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              disabled={busy || status?.monthClosed}
              onClick={() => exportPack.mutate()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised disabled:opacity-60"
            >
              <Download size={16} />
              {status?.exportGenerated ? 'Regenerate export pack' : 'Generate export pack'}
            </button>
            <button
              type="button"
              disabled={busy || !status?.canClose}
              onClick={() => closePeriod.mutate()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              <Lock size={16} />
              Mark {monthLabel} closed
            </button>
          </div>

          {status && !status.canClose && !status.monthClosed && (
            <p className="text-xs text-text-muted">
              Complete all checklist items before closing ({status.checklistComplete}/
              {status.checklistTotal} done).
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
