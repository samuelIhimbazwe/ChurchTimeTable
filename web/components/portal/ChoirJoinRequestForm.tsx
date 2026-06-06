'use client'

import { CHOIR_JOIN_REQUEST_TYPES } from '@/lib/constants/choir-positions'

type Props = {
  requestType: string
  onRequestTypeChange: (value: string) => void
  message: string
  onMessageChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  submitting?: boolean
  className?: string
}

export function ChoirJoinRequestForm({
  requestType,
  onRequestTypeChange,
  message,
  onMessageChange,
  onSubmit,
  onCancel,
  submitting = false,
  className = '',
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className={`space-y-3 ${className}`}
    >
      <div>
        <p className="text-xs font-semibold text-text-primary mb-2">
          How are you joining?
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          {CHOIR_JOIN_REQUEST_TYPES.map((t) => {
            const selected = requestType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onRequestTypeChange(t.value)}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-colors text-left ${
                  selected
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-surface text-text-primary border-border hover:bg-surface-raised'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
      <textarea
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="Optional message to choir leaders…"
        rows={2}
        className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit request'}
        </button>
      </div>
    </form>
  )
}
