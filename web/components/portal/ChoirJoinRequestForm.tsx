'use client'

import { CHOIR_JOIN_INTENTS } from '@/lib/constants/choir-positions'
import { FormField, Textarea } from '@/components/shared/form'
import { cn } from '@/lib/utils'

type Props = {
  requestType: string
  onRequestTypeChange: (value: string) => void
  message: string
  onMessageChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  submitting?: boolean
  requestTypeError?: string
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
  requestTypeError,
  className = '',
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className={cn('space-y-3', className)}
    >
      <FormField label="How are you joining?" required error={requestTypeError}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHOIR_JOIN_INTENTS.map((t) => {
            const selected = requestType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onRequestTypeChange(t.value)}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm font-semibold border transition-colors text-left',
                  selected
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-surface text-text-primary border-border hover:bg-surface-raised',
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </FormField>

      <FormField label="Message to leaders" hint="Optional — tell leaders about your experience or voice part.">
        <Textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Optional message to choir leaders…"
          rows={2}
        />
      </FormField>

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
