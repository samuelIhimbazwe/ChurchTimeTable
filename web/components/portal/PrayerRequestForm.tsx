'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'

type Props = {
  compact?: boolean
  initialOpen?: boolean
  onSuccess?: () => void
}

export function PrayerRequestForm({ compact, initialOpen = false, onSuccess }: Props) {
  const [open, setOpen] = useState(initialOpen || !compact)
  const [content, setContent] = useState('')
  const [shareIdentity, setShareIdentity] = useState(false)
  const [displayName, setDisplayName] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      memberPortalApi.submitPrayerRequest({
        content,
        shareIdentity,
        displayName: shareIdentity ? displayName : undefined,
      }),
    onSuccess: () => {
      toast.success('Prayer request submitted. Our intercessors will pray for you.')
      setContent('')
      setShareIdentity(false)
      setDisplayName('')
      setOpen(false)
      onSuccess?.()
    },
    onError: () => toast.error('Could not submit prayer request'),
  })

  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-primary-600 hover:text-primary-800"
      >
        Submit prayer request (ibyifuzo)
      </button>
    )
  }

  return (
    <Card padding="md" accent="gold" className={compact ? 'mt-3' : undefined}>
      {compact && (
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-text-primary">Prayer request</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      )}
      {!compact && (
        <p className="text-sm font-semibold text-text-primary mb-1">Prayer request (ibyifuzo)</p>
      )}
      <p className="text-xs text-text-muted mb-3">
        Your request is sent to the intercessors ministry. By default you remain anonymous.
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={compact ? 3 : 5}
        placeholder="Write your prayer need…"
        className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
      />
      <label className="flex items-center gap-2 mt-3 text-sm text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={shareIdentity}
          onChange={(e) => setShareIdentity(e.target.checked)}
          className="rounded border-border"
        />
        I am willing to be known by name
      </label>
      {shareIdentity && (
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name (optional)"
          className="mt-2 w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border"
        />
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={submit.isPending || content.trim().length < 3}
          onClick={() => submit.mutate()}
          className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
        >
          {submit.isPending ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </Card>
  )
}
