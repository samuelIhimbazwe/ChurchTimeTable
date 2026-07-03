'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { X, Inbox, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useAttentionItems } from '@/lib/dashboard/useAttentionItems'

type Props = {
  open: boolean
  onClose: () => void
}

export function UnifiedAttentionDrawer({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)
  const { items, totalCount } = useAttentionItems()

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close attention drawer"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Attention inbox"
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md',
          'bg-surface border-l border-border shadow-overlay',
          'flex flex-col animate-page-enter safe-top safe-bottom',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Inbox size={18} className="text-primary-600" />
            <h2 className="font-semibold text-text-primary">Attention inbox</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {totalCount === 0 ? (
            <div className="text-center py-12">
              <Inbox size={32} className="mx-auto text-text-muted mb-3" />
              <p className="text-sm font-medium text-text-primary">All caught up</p>
              <p className="text-xs text-text-muted mt-1">
                No pending join requests, welfare cases, or admin queues right now.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href ?? '/portal'}
                    onClick={onClose}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                      item.tone === 'warning'
                        ? 'border-warning/30 bg-warning-light hover:bg-warning-light/80'
                        : 'border-border hover:bg-surface-raised',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                      {item.detail && (
                        <p className="text-xs text-text-muted mt-0.5">{item.detail}</p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-text-muted shrink-0 mt-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border text-xs text-text-muted">
          Aggregates join requests, welfare, at-risk members, and admin queues.
        </div>
      </aside>
    </>
  )
}
