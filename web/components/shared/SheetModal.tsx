'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  /** sm+ centered card width */
  maxWidth?: 'sm' | 'md' | 'lg'
}

export function SheetModal({
  open,
  onClose,
  title,
  children,
  className,
  maxWidth = 'md',
}: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 safe-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'w-full bg-surface border border-border shadow-overlay',
          'rounded-t-2xl sm:rounded-xl',
          'max-h-[min(92vh,calc(100dvh-env(safe-area-inset-top)-1rem))]',
          'overflow-y-auto animate-page-enter safe-bottom',
          maxWidth === 'sm' && 'sm:max-w-sm',
          maxWidth === 'md' && 'sm:max-w-md',
          maxWidth === 'lg' && 'sm:max-w-lg',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border sticky top-0 bg-surface z-10">
            <p className="font-semibold text-text-primary truncate">{title}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 -mr-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised touch-target shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
