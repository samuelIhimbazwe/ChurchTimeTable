'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi, financeApi, type ContributionClaim } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, PermissionGate } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const ADJUST_CATEGORIES = [
  { value: 'CORRECTION', label: 'Correction' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'REVERSAL', label: 'Reversal' },
  { value: 'OTHER', label: 'Other' },
] as const

type TreasuryRow = ContributionClaim & { effectiveAmount?: number | null }

function normalizeList(raw: unknown): TreasuryRow[] {
  if (!raw || typeof raw !== 'object') return []
  const obj = raw as Record<string, unknown>
  const items = Array.isArray(obj.items) ? obj.items : []
  return items.map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: String(r.id ?? ''),
      referenceNumber: r.referenceNumber != null ? String(r.referenceNumber) : undefined,
      status: String(r.status ?? ''),
      memberName: r.memberName != null ? String(r.memberName) : undefined,
      claimedAmount: Number(r.claimedAmount ?? r.amount ?? 0),
      confirmedAmount: r.confirmedAmount != null ? Number(r.confirmedAmount) : null,
      effectiveAmount: r.effectiveAmount != null ? Number(r.effectiveAmount) : null,
      typeName: r.typeName != null ? String(r.typeName) : undefined,
      paymentAt: r.paymentAt != null ? String(r.paymentAt) : null,
      createdAt: r.createdAt != null ? String(r.createdAt) : undefined,
    }
  })
}

function ReviewModal({
  item,
  onClose,
  canApprove,
}: {
  item: ContributionClaim
  onClose: () => void
  canApprove: boolean
}) {
  const qc = useQueryClient()
  const [confirmedAmount, setConfirmedAmount] = useState(String(item.claimedAmount))
  const [discrepancyReason, setDiscrepancyReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const partial =
    confirmedAmount && parseFloat(confirmedAmount) !== item.claimedAmount

  const approve = useMutation({
    mutationFn: () =>
      contributionsApi.approveFamily(item.id, {
        confirmedAmount: parseFloat(confirmedAmount),
        discrepancyReason: discrepancyReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Contribution confirmed')
      qc.invalidateQueries({ queryKey: ['protocol-contribution-inbox'] })
      qc.invalidateQueries({ queryKey: ['finance-contributions-protocol'] })
      onClose()
    },
    onError: (err: Error) => toast.error('Could not confirm', err.message),
  })

  const reject = useMutation({
    mutationFn: () =>
      contributionsApi.rejectFamily(item.id, { rejectionReason: rejectReason.trim() }),
    onSuccess: () => {
      toast.success('Claim rejected')
      qc.invalidateQueries({ queryKey: ['protocol-contribution-inbox'] })
      onClose()
    },
    onError: (err: Error) => toast.error('Could not reject', err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <Card padding="md" className="w-full max-w-md">
        <p className="font-semibold text-lg">Review protocol contribution</p>
        <p className="text-sm text-text-secondary mt-1">
          {item.memberName} · claimed {formatCurrency(item.claimedAmount)}
        </p>
        {canApprove ? (
          <div className="mt-4 space-y-3">
            <input
              type="number"
              value={confirmedAmount}
              onChange={(e) => setConfirmedAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            {partial && (
              <textarea
                rows={2}
                value={discrepancyReason}
                onChange={(e) => setDiscrepancyReason(e.target.value)}
                placeholder="Why different from claimed?"
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
              />
            )}
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reject reason (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => approve.mutate()}
                disabled={
                  approve.isPending ||
                  !confirmedAmount ||
                  (partial && discrepancyReason.trim().length < 3)
                }
                className="flex-1 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
              >
                Confirm
              </button>
              {rejectReason.trim().length >= 3 && (
                <button
                  type="button"
                  onClick={() => reject.mutate()}
                  disabled={reject.isPending}
                  className="px-4 py-2 text-sm font-semibold text-danger border border-danger/30 rounded-lg"
                >
                  Reject
                </button>
              )}
              <button type="button" onClick={onClose} className="px-3 text-sm text-text-muted">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={onClose} className="mt-4 text-sm text-primary-600 font-semibold">
            Close
          </button>
        )}
      </Card>
    </div>
  )
}

export function ProtocolContributionTreasuryPanel() {
  const qc = useQueryClient()
  const [reviewing, setReviewing] = useState<ContributionClaim | null>(null)
  const [adjusting, setAdjusting] = useState<TreasuryRow | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustCategory, setAdjustCategory] = useState<(typeof ADJUST_CATEGORIES)[number]['value']>('CORRECTION')
  const [adjustReason, setAdjustReason] = useState('')

  const { data: inbox, isLoading: loadingInbox } = useQuery({
    queryKey: ['protocol-contribution-inbox'],
    queryFn: () => contributionsApi.getProtocolInbox({ status: 'SUBMITTED' }),
  })

  const { data: allRaw, isLoading: loadingAll } = useQuery({
    queryKey: ['finance-contributions-protocol'],
    queryFn: () => financeApi.listContributions({ ministryScope: 'PROTOCOL', limit: 80 }),
  })

  const all = normalizeList(allRaw)
  const confirmed = all.filter((c) => c.status === 'CONFIRMED')

  const adjust = useMutation({
    mutationFn: () =>
      contributionsApi.adjust(adjusting!.id, {
        adjustmentAmount: parseFloat(adjustAmount),
        category: adjustCategory,
        reason: adjustReason.trim(),
      }),
    onSuccess: () => {
      toast.success('Contribution adjusted')
      qc.invalidateQueries({ queryKey: ['finance-contributions-protocol'] })
      setAdjusting(null)
    },
    onError: (err: Error) => toast.error('Could not adjust', err.message),
  })

  return (
    <>
      <div className="space-y-4">
        <PermissionGate anyOf={['protocol.finance.approve', 'protocol.finance.manage']}>
          <Card padding="md">
            <p className="font-semibold mb-1">Pending treasurer confirmation</p>
            <p className="text-xs text-text-muted mb-3">
              Members submit directly — you confirm payment received on MoMo/bank.
            </p>
            {loadingInbox ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : (inbox?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-text-muted">No pending claims.</p>
            ) : (
              <ul className="divide-y divide-border">
                {inbox!.items.map((item) => (
                  <li key={item.id} className="py-3 flex justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{item.memberName}</p>
                      <p className="text-xs text-text-muted">
                        {formatCurrency(item.claimedAmount)}
                        {item.typeName && <> · {item.typeName}</>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewing(item)}
                      className="text-xs font-semibold text-primary-600"
                    >
                      Review →
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </PermissionGate>

        <PermissionGate
          anyOf={[
            'protocol.contribution.view.all',
            'protocol.finance.view',
            'protocol.finance.manage',
            'protocol.contribution.adjust',
          ]}
        >
          <Card padding="md">
            <p className="font-semibold mb-2">All protocol contributions</p>
            {loadingAll ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : all.length === 0 ? (
              <p className="text-sm text-text-muted">No records yet.</p>
            ) : (
              <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                {all.map((item) => (
                  <li key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{item.memberName ?? 'Member'}</p>
                      <p className="text-xs text-text-muted">
                        {formatCurrency(item.claimedAmount)}
                        {item.confirmedAmount != null && (
                          <> · confirmed {formatCurrency(item.confirmedAmount)}</>
                        )}
                        {item.paymentAt && <> · {formatDate(item.paymentAt)}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.status === 'CONFIRMED'
                            ? 'status-present'
                            : item.status === 'SUBMITTED'
                              ? 'status-pending'
                              : 'default'
                        }
                      >
                        {item.status}
                      </Badge>
                      {item.status === 'CONFIRMED' && (
                        <PermissionGate
                          anyOf={[
                            'protocol.contribution.adjust',
                            'protocol.finance.manage',
                          ]}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setAdjusting(item)
                              setAdjustAmount('')
                              setAdjustReason('')
                            }}
                            className="text-xs font-semibold text-primary-600"
                          >
                            Adjust
                          </button>
                        </PermissionGate>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-text-muted mt-3">
              {confirmed.length} confirmed · list refreshes after each confirmation
            </p>
          </Card>
        </PermissionGate>
      </div>

      {reviewing && (
        <ReviewModal
          item={reviewing}
          onClose={() => setReviewing(null)}
          canApprove
        />
      )}

      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card padding="md" className="w-full max-w-md">
            <p className="font-semibold">Manual adjustment</p>
            <p className="text-sm text-text-secondary mt-1">{adjusting.memberName}</p>
            <div className="mt-4 space-y-3">
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Amount (+/- RWF)"
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              />
              <select
                value={adjustCategory}
                onChange={(e) => setAdjustCategory(e.target.value as typeof adjustCategory)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              >
                {ADJUST_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <textarea
                rows={2}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => adjust.mutate()}
                  disabled={adjust.isPending || !adjustAmount || adjustReason.trim().length < 3}
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                >
                  Save adjustment
                </button>
                <button type="button" onClick={() => setAdjusting(null)} className="text-sm text-text-muted">
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
