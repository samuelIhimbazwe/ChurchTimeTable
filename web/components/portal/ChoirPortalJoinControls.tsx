'use client'

import { useState } from 'react'
import { UserPlus, XCircle } from 'lucide-react'
import { toast } from '@/components/shared/Toast'
import type { ChoirPortalActions } from '@/lib/choir/membership-display'

type Props = {
  actions: ChoirPortalActions
  onJoin?: () => void
  onCancelPending?: (requestId: string) => void
  joinPending?: boolean
  cancelPending?: boolean
  joinLabel?: string
  compact?: boolean
}

export function ChoirPortalJoinControls({
  actions,
  onJoin,
  onCancelPending,
  joinPending = false,
  cancelPending = false,
  joinLabel = 'Join',
  compact = false,
}: Props) {
  const [blockHintVisible, setBlockHintVisible] = useState(false)
  const [blockDetailOpen, setBlockDetailOpen] = useState(false)

  if (actions.showDashboardButton) return null

  if (actions.isPendingJoin) {
    return (
      <div
        className={`flex flex-col gap-1.5 ${compact ? 'items-end text-right' : 'items-start'}`}
      >
        <span
          className={`font-semibold text-amber-800 ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          Pending request
        </span>
        {actions.pendingRequestId && onCancelPending && (
          <button
            type="button"
            onClick={() => onCancelPending(actions.pendingRequestId!)}
            disabled={cancelPending}
            className={`inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 disabled:opacity-60 ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            <XCircle size={compact ? 12 : 14} />
            {cancelPending ? 'Cancelling…' : 'Cancel request'}
          </button>
        )}
      </div>
    )
  }

  if (actions.showJoinButton && onJoin) {
    return (
      <div
        className={`flex flex-col gap-1.5 ${compact ? 'items-end text-right max-w-[220px]' : 'items-start max-w-md'}`}
      >
        <button
          type="button"
          onClick={() => {
            if (actions.joinBlockedByPending) {
              toast.error('Joining choir was unsuccessful. Cancel your pending request first.')
              setBlockHintVisible(true)
              setBlockDetailOpen(false)
              return
            }
            setBlockHintVisible(false)
            setBlockDetailOpen(false)
            onJoin()
          }}
          disabled={joinPending}
          className={`inline-flex items-center gap-1 font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 disabled:opacity-60 shrink-0 ${
            compact ? 'px-2.5 py-1.5 text-xs gap-1' : 'px-3 py-2 text-xs gap-1.5'
          }`}
        >
          <UserPlus size={compact ? 12 : 14} /> {joinPending ? 'Submitting…' : joinLabel}
        </button>

        {blockHintVisible && actions.joinBlockedShortMessage && (
          <div className={compact ? 'text-right' : ''}>
            <button
              type="button"
              onClick={() => setBlockDetailOpen((open) => !open)}
              className={`text-amber-900/90 leading-snug hover:text-amber-950 underline underline-offset-2 text-left ${
                compact ? 'text-xs' : 'text-sm'
              } ${compact ? 'text-right' : ''}`}
            >
              {actions.joinBlockedShortMessage}
            </button>
            {blockDetailOpen && actions.joinBlockedMessage && (
              <p
                className={`mt-1.5 text-amber-900/85 leading-relaxed ${
                  compact ? 'text-xs' : 'text-sm'
                }`}
              >
                {actions.joinBlockedMessage}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
