'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { familyOfficePath } from '@/lib/choir/family-office'
import { CheckCircle2, Smartphone } from 'lucide-react'

type Props = {
  choirId: string
}

export function ContributionQuickActionPage({ choirId }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qc = useQueryClient()
  const token = searchParams.get('token')

  const { data: preview, isLoading, error } = useQuery({
    queryKey: ['contribution-quick-action', token],
    queryFn: () => financeApi.previewContributionQuickAction(token!),
    enabled: !!token,
    retry: false,
  })

  const approve = useMutation({
    mutationFn: () =>
      financeApi.approveContributionQuickAction({
        token: token!,
        confirmedAmount: preview?.claimedAmount,
      }),
    onSuccess: () => {
      toast.success('Contribution confirmed')
      qc.invalidateQueries({ queryKey: ['family-contribution-inbox'] })
      qc.invalidateQueries({ queryKey: ['family-contribution-dashboard'] })
      router.replace(familyOfficePath(choirId, 'leadership', 'decisions'))
    },
    onError: (err: Error) => toast.error('Could not confirm', err.message),
  })

  if (!token) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">
          Missing approval link. Open the link from your notification or message again.
        </p>
      </Card>
    )
  }

  if (isLoading) return <SkeletonCard rows={4} />

  if (error || !preview) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">
          This approval link is invalid or expired. Sign in as the family head or deputy
          who received it, or open the decision console.
        </p>
      </Card>
    )
  }

  if (!preview.canExecute) {
    return (
      <Card padding="md">
        <CheckCircle2 className="text-success mx-auto mb-3" size={32} />
        <p className="text-sm text-text-primary text-center font-semibold">
          This claim is no longer pending
        </p>
        <p className="text-sm text-text-muted text-center mt-2">
          Reference {preview.referenceNumber}
        </p>
      </Card>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center">
        <Smartphone size={28} className="text-primary-600 mx-auto mb-2" />
        <h2 className="font-display text-xl text-text-primary">Quick approve</h2>
        <p className="text-sm text-text-muted mt-1">
          Confirm the full claimed amount from your phone or message link.
        </p>
      </div>

      <Card padding="md">
        <p className="text-xs uppercase tracking-wide text-text-muted">Member</p>
        <p className="font-semibold text-text-primary mt-1">{preview.memberName}</p>

        <p className="text-xs uppercase tracking-wide text-text-muted mt-4">Amount</p>
        <p className="text-2xl font-display font-bold text-text-primary mt-1">
          {formatCurrency(preview.claimedAmount, preview.currency)}
        </p>

        <dl className="mt-4 space-y-2 text-sm text-text-secondary">
          <div className="flex justify-between gap-3">
            <dt>Reference</dt>
            <dd className="font-mono text-text-primary">{preview.referenceNumber}</dd>
          </div>
          {preview.paymentAt && (
            <div className="flex justify-between gap-3">
              <dt>Payment date</dt>
              <dd>{formatDate(String(preview.paymentAt))}</dd>
            </div>
          )}
          {preview.familyName && (
            <div className="flex justify-between gap-3">
              <dt>Family</dt>
              <dd>{preview.familyName}</dd>
            </div>
          )}
        </dl>

        <button
          type="button"
          disabled={approve.isPending}
          onClick={() => approve.mutate()}
          className="mt-6 w-full rounded-lg bg-primary-600 text-white py-3 text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
        >
          {approve.isPending ? 'Confirming…' : 'Confirm full amount'}
        </button>

        <p className="text-xs text-text-muted text-center mt-3">
          For partial amounts or rejections, use the full decision console.
        </p>
      </Card>
    </div>
  )
}
