'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge } from '@/components/shared'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const CHANNELS = [
  { value: 'MOMO', label: 'Mobile Money (MoMo)' },
  { value: 'BANK', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
] as const

function toLocalDatetimeInput(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Props = {
  choirId: string
  choirName?: string
}

export function SponsorGivingPanel({ choirId, choirName }: Props) {
  const qc = useQueryClient()
  const { data: ctx, isLoading } = useQuery({
    queryKey: ['contribution-submit-context', 'sponsor', choirId],
    queryFn: () => contributionsApi.getSubmitContext(choirId),
  })

  const [typeId, setTypeId] = useState('')
  const [customType, setCustomType] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentAt, setPaymentAt] = useState(toLocalDatetimeInput())
  const [channel, setChannel] = useState<'MOMO' | 'BANK' | 'OTHER'>('MOMO')
  const [notes, setNotes] = useState('')

  const selectedType = ctx?.types.find((t) => t.id === typeId)
  const isOther = selectedType?.code === 'other'
  const sponsorChoir = ctx?.sponsorChoir ?? ctx?.sponsorChoirs?.find((c) => c.id === choirId)

  const submit = useMutation({
    mutationFn: () =>
      contributionsApi.submitClaim({
        contributionTypeCatalogId: typeId,
        claimedAmount: parseFloat(amount),
        paymentAt: new Date(paymentAt).toISOString(),
        paymentChannel: channel,
        currency: 'RWF',
        notes: notes.trim() || undefined,
        customTypeLabel: isOther ? customType.trim() : undefined,
        choirId,
      }),
    onSuccess: () => {
      toast.success(
        'Support gift submitted',
        'Sponsors have no family — the choir treasurer will confirm your payment.',
      )
      qc.invalidateQueries({ queryKey: ['contribution-submit-context'] })
      qc.invalidateQueries({ queryKey: ['my-contributions'] })
      setAmount('')
      setNotes('')
      setCustomType('')
    },
    onError: (err: Error) => {
      toast.error('Could not submit', err.message || 'Check your details and try again.')
    },
  })

  if (isLoading) {
    return <Card padding="md"><p className="text-sm text-text-muted">Loading…</p></Card>
  }

  if (ctx?.mode !== 'sponsor' || !sponsorChoir) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-secondary">
          Sponsor giving is not available for this choir. Confirm your sponsorship is approved.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <FamilyPaymentInstructionsCard
        familyName={choirName ?? sponsorChoir.name}
        payment={sponsorChoir.payment}
        compact
      />

      <Card padding="md">
        <p className="font-semibold mb-1">Submit your support gift</p>
        <p className="text-xs text-text-muted mb-4">
          Step 1: Pay using the choir details above · Step 2: Record your gift here · Step 3: Treasurer confirms
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!typeId || !amount) return
            const parsedAmount = parseFloat(amount)
            if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
              toast.error('Amount must be greater than zero')
              return
            }
            if (isOther && customType.trim().length < 2) {
              toast.error('Describe the gift type')
              return
            }
            submit.mutate()
          }}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Gift type</label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
            >
              <option value="">Select type…</option>
              {ctx.types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {isOther && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Describe &quot;Other&quot;</label>
              <input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g. Concert travel support"
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount (RWF)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date & time you paid</label>
              <input
                type="datetime-local"
                value={paymentAt}
                onChange={(e) => setPaymentAt(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">How you paid</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as typeof channel)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
          >
            {submit.isPending ? 'Submitting…' : 'Submit support gift'}
          </button>
        </form>
      </Card>
    </div>
  )
}

export function SponsorGivingHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-contributions'],
    queryFn: contributionsApi.getMine,
  })

  if (isLoading) {
    return <Card padding="md"><p className="text-sm text-text-muted">Loading…</p></Card>
  }

  if (!data?.length) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-4">No gifts recorded yet.</p>
      </Card>
    )
  }

  const statusVariant = (s: string) => {
    if (s === 'CONFIRMED' || s === 'APPROVED') return 'status-present' as const
    if (s === 'REJECTED') return 'status-absent' as const
    return 'status-pending' as const
  }

  return (
    <Card padding="none">
      <ul className="divide-y divide-border">
        {data.map((c) => (
          <li key={c.id} className="px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-medium">{c.typeName ?? 'Support gift'}</p>
              <p className="text-xs text-text-muted">
                {formatCurrency(c.claimedAmount)}
                {c.confirmedAmount != null && c.confirmedAmount !== c.claimedAmount && (
                  <> · Confirmed {formatCurrency(c.confirmedAmount)}</>
                )}
                {c.paymentAt && <> · Paid {formatDate(c.paymentAt)}</>}
              </p>
            </div>
            <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  )
}
