'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, EmptyState } from '@/components/shared'
import { FormField, Input, Select, Textarea } from '@/components/shared/form'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import {
  contributeClaimFormSchema,
  type ContributeClaimFormValues,
} from '@/lib/validation/schemas'
import { formatCurrency } from '@/lib/utils/format'
import { Wallet } from 'lucide-react'

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

  const form = useForm<ContributeClaimFormValues>({
    resolver: zodResolver(contributeClaimFormSchema),
    defaultValues: {
      typeId: '',
      customType: '',
      amount: '',
      paymentAt: toLocalDatetimeInput(),
      channel: 'MOMO',
      notes: '',
    },
  })

  const typeId = form.watch('typeId')
  const selectedType = ctx?.types.find((t) => t.id === typeId)
  const isOther = selectedType?.code === 'other'
  const { errors } = form.formState

  const submit = useMutation({
    mutationFn: (data: ContributeClaimFormValues) =>
      contributionsApi.submitProtocolClaim({
        contributionTypeCatalogId: data.typeId,
        claimedAmount: parseFloat(data.amount),
        paymentAt: new Date(data.paymentAt).toISOString(),
        paymentChannel: data.channel,
        currency: 'RWF',
        notes: data.notes?.trim() || undefined,
        customTypeLabel: isOther ? data.customType?.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success(
        'Contribution submitted',
        'The protocol treasurer will confirm your payment.',
      )
      qc.invalidateQueries({ queryKey: ['protocol-contribution-submit-context'] })
      qc.invalidateQueries({ queryKey: ['my-contributions'] })
      form.reset({
        typeId: '',
        customType: '',
        amount: '',
        paymentAt: toLocalDatetimeInput(),
        channel: 'MOMO',
        notes: '',
      })
    },
    onError: (err: Error) => toast.error('Could not submit', err.message),
  })

  function onSubmit(data: ContributeClaimFormValues) {
    if (isOther && (data.customType?.trim().length ?? 0) < 2) {
      form.setError('customType', { message: 'Describe the contribution type' })
      return
    }
    submit.mutate(data)
  }

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
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Contribution type" required error={errors.typeId?.message}>
            <Select {...form.register('typeId')} error={!!errors.typeId}>
              <option value="">Select type…</option>
              {ctx?.types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </FormField>

          {isOther && (
            <FormField label='Describe "Other"' required error={errors.customType?.message}>
              <Input
                {...form.register('customType')}
                placeholder="Describe contribution type"
                error={!!errors.customType}
              />
            </FormField>
          )}

          <FormField label="Amount (RWF)" required error={errors.amount?.message}>
            <Input
              type="number"
              min="1"
              step="1"
              {...form.register('amount')}
              error={!!errors.amount}
            />
          </FormField>

          <FormField label="Payment date & time" required error={errors.paymentAt?.message}>
            <Input type="datetime-local" {...form.register('paymentAt')} error={!!errors.paymentAt} />
          </FormField>

          <FormField label="How you paid">
            <Select {...form.register('channel')}>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Notes" hint="Optional">
            <Textarea rows={2} {...form.register('notes')} placeholder="Notes (optional)" />
          </FormField>

          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            {submit.isPending ? 'Submitting…' : 'Submit claim'}
          </button>
        </form>
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

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No protocol contributions yet"
        description="After you pay the unity treasurer, submit a claim here for confirmation."
        className="py-8"
      />
    )
  }

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
