'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, EmptyState } from '@/components/shared'
import { FormField, Input, Select, Textarea } from '@/components/shared/form'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import {
  contributeClaimFormSchema,
  type ContributeClaimFormValues,
} from '@/lib/validation/schemas'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Wallet } from 'lucide-react'
import { ContributionThankYou } from '@/components/member/ContributionThankYou'

const CHANNELS = [
  { value: 'MOMO', label: 'Mobile Money (MoMo)' },
  { value: 'BANK', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
] as const

function toLocalDatetimeInput(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ContributeClaimForm({
  onSuccess,
  choirId,
  initialTypeId,
}: {
  onSuccess?: (claim?: { id: string }) => void
  choirId?: string
  initialTypeId?: string
}) {
  const qc = useQueryClient()
  const [thankYou, setThankYou] = useState<{
    amount: number
    campaignName: string
  } | null>(null)
  const { data: ctx, isLoading, isError, error } = useQuery({
    queryKey: ['contribution-submit-context', choirId],
    queryFn: () => contributionsApi.getSubmitContext(choirId),
  })

  const form = useForm<ContributeClaimFormValues>({
    resolver: zodResolver(contributeClaimFormSchema),
    defaultValues: {
      typeId: initialTypeId ?? '',
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

  useEffect(() => {
    if (initialTypeId) form.setValue('typeId', initialTypeId)
  }, [initialTypeId, form])

  const submit = useMutation({
    mutationFn: (data: ContributeClaimFormValues) =>
      contributionsApi.submitClaim({
        contributionTypeCatalogId: data.typeId,
        claimedAmount: parseFloat(data.amount),
        paymentAt: new Date(data.paymentAt).toISOString(),
        paymentChannel: data.channel,
        currency: 'RWF',
        notes: data.notes?.trim() || undefined,
        customTypeLabel: isOther ? data.customType?.trim() : undefined,
      }),
    onSuccess: (data, variables) => {
      const typeName =
        ctx?.types.find((t) => t.id === variables.typeId)?.name ?? 'your campaign'
      const amount = parseFloat(variables.amount)
      setThankYou({
        amount: Number.isFinite(amount) ? amount : 0,
        campaignName: typeName,
      })
      qc.invalidateQueries({ queryKey: ['contribution-submit-context'] })
      qc.invalidateQueries({ queryKey: ['my-contributions'] })
      qc.invalidateQueries({ queryKey: ['my-contributions-list'] })
      qc.invalidateQueries({ queryKey: ['member-contribution-totals'] })
      qc.invalidateQueries({ queryKey: ['family-contribution-inbox'] })
      form.reset({
        typeId: initialTypeId ?? '',
        customType: '',
        amount: '',
        paymentAt: toLocalDatetimeInput(),
        channel: 'MOMO',
        notes: '',
      })
      onSuccess?.(data)
    },
    onError: (err: Error) => {
      toast.error('Could not submit', err.message || 'Check your details and try again.')
    },
  })

  const { errors } = form.formState

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

  if (isError) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-secondary">
          {error instanceof Error && error.message
            ? error.message
            : 'Could not load payment submission options. Try again or contact your family coordinator.'}
        </p>
      </Card>
    )
  }

  if (!ctx?.family) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-secondary">
          You must belong to a family before submitting choir contributions. Contact your family coordinator.
        </p>
      </Card>
    )
  }

  return (
  <>
    <ContributionThankYou
      open={thankYou != null}
      onClose={() => setThankYou(null)}
      amount={thankYou?.amount}
      campaignName={thankYou?.campaignName}
    />
    <div className="space-y-4">
      <FamilyPaymentInstructionsCard
        familyName={ctx.family.name}
        headName={ctx.family.headName}
        payment={ctx.family.payment}
      />

      <Card padding="md">
        <p className="font-semibold mb-1">Submit payment claim</p>
        <p className="text-xs text-text-muted mb-4">
          Step 1: Pay using the details above · Step 2: Fill this form · Step 3: Family head confirms
        </p>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Contribution type" required error={errors.typeId?.message}>
            <Select
              {...form.register('typeId')}
              error={!!errors.typeId}
            >
              <option value="">Select type…</option>
              {ctx.types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </FormField>

          {isOther && (
            <FormField label='Describe "Other"' required error={errors.customType?.message}>
              <Input
                {...form.register('customType')}
                placeholder="e.g. Transport for concert"
                error={!!errors.customType}
              />
            </FormField>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Amount you paid (RWF)" required error={errors.amount?.message}>
              <Input
                type="number"
                min="1"
                step="1"
                {...form.register('amount')}
                error={!!errors.amount}
              />
            </FormField>
            <FormField label="Date & time you paid" required error={errors.paymentAt?.message}>
              <Input
                type="datetime-local"
                {...form.register('paymentAt')}
                error={!!errors.paymentAt}
              />
            </FormField>
          </div>

          <FormField label="How you paid" error={errors.channel?.message}>
            <Select {...form.register('channel')}>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Note" hint="Optional — reference number or context for your family head.">
            <Textarea rows={2} {...form.register('notes')} />
          </FormField>

          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
          >
            {submit.isPending ? 'Submitting…' : 'Submit payment claim'}
          </button>
        </form>
      </Card>
    </div>
  </>
  )
}

export function MyContributionsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-contributions'],
    queryFn: contributionsApi.getMine,
  })

  if (isLoading) return <Card padding="md"><p className="text-sm text-text-muted">Loading…</p></Card>

  if (!data?.length) {
    return (
      <EmptyState
        illustration="giving"
        icon={Wallet}
        title="No contribution claims yet"
        description="After you pay, submit a claim so your family head can confirm it."
        className="py-10"
      />
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
              <p className="text-sm font-medium">{c.typeName ?? 'Contribution'}</p>
              <p className="text-xs text-text-muted">
                Claimed {formatCurrency(c.claimedAmount)}
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
