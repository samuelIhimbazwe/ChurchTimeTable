'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import { formatCurrency } from '@/lib/utils/format'

const CHANNELS = [
  { value: 'MOMO', label: 'Mobile Money (MoMo)' },
  { value: 'BANK', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
] as const

function toLocalDatetimeInput(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ProtocolContributeForm() {
  const qc = useQueryClient()
  const { data: ctx, isLoading } = useQuery({
    queryKey: ['protocol-contribution-submit-context'],
    queryFn: () => contributionsApi.getProtocolSubmitContext(),
  })

  const [typeId, setTypeId] = useState('')
  const [customType, setCustomType] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentAt, setPaymentAt] = useState(toLocalDatetimeInput())
  const [channel, setChannel] = useState<'MOMO' | 'BANK' | 'OTHER'>('MOMO')
  const [notes, setNotes] = useState('')

  const selectedType = ctx?.types.find((t) => t.id === typeId)
  const isOther = selectedType?.code === 'other'

  const submit = useMutation({
    mutationFn: () =>
      contributionsApi.submitProtocolClaim({
        contributionTypeCatalogId: typeId,
        claimedAmount: parseFloat(amount),
        paymentAt: new Date(paymentAt).toISOString(),
        paymentChannel: channel,
        currency: 'RWF',
        notes: notes.trim() || undefined,
        customTypeLabel: isOther ? customType.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success(
        'Contribution submitted',
        'The protocol treasurer will confirm your payment.',
      )
      qc.invalidateQueries({ queryKey: ['protocol-contribution-submit-context'] })
      qc.invalidateQueries({ queryKey: ['my-contributions'] })
      setAmount('')
      setNotes('')
      setCustomType('')
    },
    onError: (err: Error) => toast.error('Could not submit', err.message),
  })

  if (isLoading) {
    return <Card padding="md"><p className="text-sm text-text-muted">Loading…</p></Card>
  }

  return (
    <div className="space-y-4">
      {ctx?.payment && (
        <FamilyPaymentInstructionsCard
          familyName="Protocol unity treasury"
          payment={ctx.payment}
        />
      )}

      <Card padding="md">
        <p className="font-semibold mb-1">Submit your contribution</p>
        <p className="text-xs text-text-muted mb-4">
          Protocol members pay directly to the unity treasurer — there is no family approval step.
        </p>
        <div className="space-y-3">
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
          >
            <option value="">Contribution type</option>
            {ctx?.types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {isOther && (
            <input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Describe contribution type"
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
            />
          )}
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (RWF)"
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
          />
          <input
            type="datetime-local"
            value={paymentAt}
            onChange={(e) => setPaymentAt(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
          />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
          >
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border resize-none"
          />
          <button
            type="button"
            disabled={submit.isPending || !typeId || !amount}
            onClick={() => {
              const parsedAmount = parseFloat(amount)
              if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                toast.error('Amount must be greater than zero')
                return
              }
              submit.mutate()
            }}
            className="w-full px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            {submit.isPending ? 'Submitting…' : 'Submit claim'}
          </button>
        </div>
      </Card>
    </div>
  )
}

export function ProtocolMyContributionsList() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['my-contributions'],
    queryFn: contributionsApi.getMine,
  })

  const items = (raw ?? []).filter((c) => !c.familyId && !c.choirId)

  if (isLoading) return <p className="text-sm text-text-muted">Loading history…</p>
  if (items.length === 0) return <p className="text-sm text-text-muted">No contributions yet.</p>

  return (
    <ul className="divide-y divide-border">
      {items.map((c) => (
        <li key={c.id} className="py-2 flex justify-between text-sm">
          <span>{c.typeName ?? 'Contribution'} · {formatCurrency(c.claimedAmount)}</span>
          <span className="text-text-muted">{c.status}</span>
        </li>
      ))}
    </ul>
  )
}
