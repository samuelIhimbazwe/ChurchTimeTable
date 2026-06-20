'use client'

import { useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { SheetModal } from '@/components/shared/SheetModal'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { cn } from '@/lib/utils'

export type ContextConfirmOptions = {
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

type Props = ContextConfirmOptions & {
  open: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ContextConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open)

  return (
    <SheetModal open={open} onClose={onCancel} title={title} maxWidth="sm">
      <div ref={ref} className="space-y-4">
        {variant === 'danger' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>This action cannot be undone easily.</span>
          </div>
        )}
        <div className="text-sm text-text-secondary leading-relaxed">{description}</div>
        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60',
              variant === 'danger'
                ? 'bg-danger hover:bg-danger/90'
                : 'bg-primary-700 hover:bg-primary-800',
            )}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </SheetModal>
  )
}
