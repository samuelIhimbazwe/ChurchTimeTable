'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi, financeApi, familiesApi, type ContributionClaim } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, PermissionGate } from '@/components/shared'
import { SponsorContributionInboxPanel } from '@/components/choir/SponsorContributionInboxPanel'
import { useResolvedChoirScope } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils/format'

const ADJUST_CATEGORIES = [
  { value: 'CORRECTION', label: 'Correction' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'REVERSAL', label: 'Reversal' },
  { value: 'MISCLASSIFICATION', label: 'Misclassification' },
  { value: 'OTHER', label: 'Other' },
] as const

type TreasuryRow = ContributionClaim & {
  effectiveAmount?: number | null
}

function normalizeList(raw: unknown): TreasuryRow[] {
  if (!raw || typeof raw !== 'object') return []
  const obj = raw as Record<string, unknown>
  const items = Array.isArray(obj.items) ? obj.items : Array.isArray(raw) ? raw : []
  return items.map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: String(r.id ?? ''),
      referenceNumber: r.referenceNumber != null ? String(r.referenceNumber) : undefined,
      status: String(r.status ?? ''),
      memberName: r.memberName != null ? String(r.memberName) : undefined,
      familyId: r.familyId != null ? String(r.familyId) : undefined,
      claimedAmount: Number(r.claimedAmount ?? r.amount ?? 0),
      confirmedAmount: r.confirmedAmount != null ? Number(r.confirmedAmount) : null,
      effectiveAmount: r.effectiveAmount != null ? Number(r.effectiveAmount) : null,
      discrepancyAmount: r.discrepancyAmount != null ? Number(r.discrepancyAmount) : null,
      discrepancyReason: r.discrepancyReason != null ? String(r.discrepancyReason) : null,
      typeName: r.typeName != null ? String(r.typeName) : undefined,
      paymentAt: r.paymentAt != null ? String(r.paymentAt) : null,
      createdAt: r.createdAt != null ? String(r.createdAt) : undefined,
    }
  })
}

export function ContributionTreasuryPanel({ compact = false }: { compact?: boolean }) {
  const { choirId } = useResolvedChoirScope()
  const qc = useQueryClient()
  const [adjusting, setAdjusting] = useState<TreasuryRow | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustCategory, setAdjustCategory] = useState<(typeof ADJUST_CATEGORIES)[number]['value']>('CORRECTION')
  const [adjustReason, setAdjustReason] = useState('')

  const { data: pendingFamilyRaw, isLoading: loadingPendingFamily } = useQuery({
    queryKey: ['finance-contributions-choir-pending-family'],
    queryFn: () =>
      financeApi.listContributions({
        ministryScope: 'CHOIR',
        status: 'SUBMITTED',
        familyOnly: true,
        limit: 30,
      }),
  })

  const { data: allRaw, isLoading: loadingAll } = useQuery({
    queryKey: ['finance-contributions-all'],
    queryFn: () => financeApi.listContributions({ ministryScope: 'CHOIR', limit: 80 }),
  })

  const { data: adjustmentsRaw } = useQuery({
    queryKey: ['contribution-adjustments-recent'],
    queryFn: () => financeApi.getRecentAdjustments({ limit: 10 }),
  })

  const { data: familyRows } = useQuery({
    queryKey: ['families-treasury'],
    queryFn: () => familiesApi.getAll(),
  })

  const familyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of familyRows ?? []) {
      map.set(f.id, f.familyName ?? f.familyCode ?? 'Family')
    }
    return map
  }, [familyRows])

  const pendingFamily = normalizeList(pendingFamilyRaw)
  const all = normalizeList(allRaw)
  const discrepancies = all.filter(
    (c) =>
      (c.discrepancyAmount != null && c.discrepancyAmount !== 0) ||
      (c.confirmedAmount != null && c.confirmedAmount !== c.claimedAmount),
  )
  const confirmed = all.filter((c) => c.status === 'CONFIRMED' || c.status === 'APPROVED')

  const adjust = useMutation({
    mutationFn: () =>
      contributionsApi.adjust(adjusting!.id, {
        adjustmentAmount: parseFloat(adjustAmount),
        category: adjustCategory,
        reason: adjustReason.trim(),
      }),
    onSuccess: () => {
      toast.success('Contribution adjusted')
      qc.invalidateQueries({ queryKey: ['finance-contributions-all'] })
      qc.invalidateQueries({ queryKey: ['contribution-adjustments-recent'] })
      qc.invalidateQueries({ queryKey: ['finance-contributions-choir-pending-family'] })
      setAdjusting(null)
    },
    onError: (err: Error) => toast.error('Could not adjust', err.message),
  })

  function openAdjust(row: TreasuryRow) {
    setAdjusting(row)
    setAdjustAmount('')
    setAdjustCategory('CORRECTION')
    setAdjustReason('')
  }

  const adjustmentItems = (() => {
    if (!adjustmentsRaw || typeof adjustmentsRaw !== 'object') return []
    const obj = adjustmentsRaw as { items?: unknown[] }
    return Array.isArray(obj.items) ? obj.items : []
  })()

  return (
    <>
      <div className={compact ? 'space-y-4' : 'space-y-6'}>
        {!compact && (
          <Card padding="md" accent="info">
            <p className="font-semibold mb-1">Adjustments vs governance fixes</p>
            <div className="text-xs text-text-secondary space-y-2 mt-2">
              <p>
                <strong className="text-text-primary">Adjustments</strong> (correction, transfer, reversal)
                add a signed delta to the <em>effective</em> amount after family confirmation. The original
                claimed and confirmed amounts and the ledger transaction stay unchanged — rankings and audit
                still show what was first approved.
              </p>
              <p>
                <strong className="text-text-primary">Governance fixes</strong> change metadata only — wrong
                family, contribution type, or campaign — with a full audit trail. They do not change amounts
                on the ledger. Use these when the payment was right but it was filed under the wrong family or
                category.
              </p>
            </div>
          </Card>
        )}

        {!compact && (
          <Card padding="md">
            <p className="font-semibold mb-1">Treasury overview</p>
            <p className="text-xs text-text-muted">
              Singer umusanzu waits on family heads; sponsor gifts use the sponsor inbox above.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-2xl font-display font-bold">{pendingFamily.length}</p>
                <p className="text-xs text-text-muted">Awaiting family head</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-warning">{discrepancies.length}</p>
                <p className="text-xs text-text-muted">Amount mismatches</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{confirmed.length}</p>
                <p className="text-xs text-text-muted">Confirmed records</p>
              </div>
            </div>
          </Card>
        )}

        {choirId && (
          <PermissionGate anyOf={['choir.contribution.view.all', 'choir.finance.manage', 'choir.contribution.adjust']}>
            <SponsorContributionInboxPanel choirId={choirId} />
          </PermissionGate>
        )}

        <Card padding="md">
          <p className="font-semibold mb-2">Pending family confirmation</p>
          <p className="text-xs text-text-muted mb-2">
            Singer umusanzu only — sponsors are confirmed in the inbox above.
          </p>
          {loadingPendingFamily ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : pendingFamily.length === 0 ? (
            <p className="text-sm text-text-muted">No claims waiting on family heads.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingFamily.slice(0, compact ? 5 : 15).map((item) => (
                <li key={item.id} className="py-2 flex justify-between gap-2 text-sm">
                  <span>{item.memberName ?? 'Member'} · {formatCurrency(item.claimedAmount)}</span>
                  <Badge variant="status-pending">SUBMITTED</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <p className="font-semibold mb-2">Discrepancy follow-up</p>
          <p className="text-xs text-text-muted mb-3">
            When a family head confirms a different amount than claimed, coordinator and treasurer are notified.
          </p>
          {loadingAll ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : discrepancies.length === 0 ? (
            <p className="text-sm text-text-muted">No mismatches on record.</p>
          ) : (
            <ul className="divide-y divide-border">
              {discrepancies.slice(0, compact ? 5 : 20).map((item) => (
                <li key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.memberName ?? 'Member'}</p>
                    <p className="text-xs text-text-muted">
                      Claimed {formatCurrency(item.claimedAmount)}
                      {item.confirmedAmount != null && <> · Confirmed {formatCurrency(item.confirmedAmount)}</>}
                      {item.discrepancyReason && <> · {item.discrepancyReason}</>}
                    </p>
                  </div>
                  <PermissionGate anyOf={['choir.contribution.adjust', 'choir.finance.manage']}>
                    <button
                      type="button"
                      onClick={() => openAdjust(item)}
                      className="text-xs font-semibold text-primary-600"
                    >
                      Adjust →
                    </button>
                  </PermissionGate>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <PermissionGate anyOf={['choir.contribution.view.all', 'choir.finance.manage', 'choir.contribution.adjust']}>
          <Card padding="md">
            <p className="font-semibold mb-1">All choir contributions</p>
            <p className="text-xs text-text-muted mb-3">
              Every family — view confirmed amounts and apply treasurer adjustments.
            </p>
            {loadingAll ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : all.length === 0 ? (
              <p className="text-sm text-text-muted">No contribution records yet.</p>
            ) : (
              <ul className="divide-y divide-border max-h-[28rem] overflow-y-auto">
                {all.map((item) => {
                  const familyLabel = item.familyId
                    ? familyNameById.get(item.familyId) ?? 'Family'
                    : 'Sponsor'
                  return (
                    <li
                      key={item.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.memberName ?? 'Member'}</p>
                        <p className="text-xs text-text-muted">
                          {familyLabel}
                          {item.typeName && <> · {item.typeName}</>}
                          {' · '}
                          {formatCurrency(item.claimedAmount)}
                          {item.confirmedAmount != null && (
                            <> · confirmed {formatCurrency(item.confirmedAmount)}</>
                          )}
                          {item.effectiveAmount != null &&
                            item.effectiveAmount !== item.confirmedAmount && (
                              <> · effective {formatCurrency(item.effectiveAmount)}</>
                            )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.status === 'CONFIRMED' || item.status === 'APPROVED'
                              ? 'status-present'
                              : item.status === 'SUBMITTED'
                                ? 'status-pending'
                                : 'default'
                          }
                        >
                          {item.status}
                        </Badge>
                        {(item.status === 'CONFIRMED' || item.status === 'APPROVED') && (
                          <PermissionGate anyOf={['choir.contribution.adjust', 'choir.finance.manage']}>
                            <button
                              type="button"
                              onClick={() => openAdjust(item)}
                              className="text-xs font-semibold text-primary-600"
                            >
                              Adjust
                            </button>
                          </PermissionGate>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </PermissionGate>

        {!compact && adjustmentItems.length > 0 && (
          <Card padding="md">
            <p className="font-semibold mb-2">Recent manual adjustments</p>
            <ul className="divide-y divide-border">
              {adjustmentItems.map((row, i) => {
                const r = row as Record<string, unknown>
                return (
                  <li key={String(r.adjustmentId ?? i)} className="py-2 text-sm">
                    <span className="font-medium">{String(r.memberName ?? 'Member')}</span>
                    {' · '}
                    {Number(r.adjustmentAmount) >= 0 ? '+' : ''}
                    {formatCurrency(Number(r.adjustmentAmount ?? 0))}
                    {' · '}
                    <span className="text-text-muted">{String(r.reason ?? '')}</span>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </div>

      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card padding="md" className="w-full max-w-md">
            <p className="font-semibold text-lg">Manual adjustment</p>
            <p className="text-sm text-text-secondary mt-1">
              {adjusting.memberName} · effective{' '}
              {formatCurrency(adjusting.effectiveAmount ?? adjusting.confirmedAmount ?? adjusting.claimedAmount)}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Adjustment amount (RWF, +/-)</label>
                <input
                  type="number"
                  step="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. -2000 or 500"
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={adjustCategory}
                  onChange={(e) => setAdjustCategory(e.target.value as typeof adjustCategory)}
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                >
                  {ADJUST_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Reason (required)</label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setAdjusting(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  adjust.isPending ||
                  !adjustAmount ||
                  parseFloat(adjustAmount) === 0 ||
                  adjustReason.trim().length < 3
                }
                onClick={() => adjust.mutate()}
                className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-50"
              >
                Save adjustment
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

export function StewardshipDashboard() {
  const { data: rankings, isLoading: loadingRankings } = useQuery({
    queryKey: ['contribution-rankings'],
    queryFn: () => financeApi.getContributionRankings({ period: 'year' }),
  })

  const { data: families, isLoading: loadingFamilies } = useQuery({
    queryKey: ['families'],
    queryFn: () => familiesApi.getAll(),
  })

  const rankingList = Array.isArray(rankings) ? rankings : []

  return (
    <div className="space-y-6">
      <ContributionTreasuryPanel />

      <Card padding="none">
        <div className="px-5 pt-5">
          <p className="font-semibold">Family rankings</p>
          <p className="text-xs text-text-muted mb-3">By total confirmed contributions</p>
        </div>
        {loadingRankings && loadingFamilies ? (
          <p className="text-sm text-text-muted px-5 pb-5">Loading…</p>
        ) : (
          <ul className="divide-y divide-border">
            {(rankingList.length ? rankingList : families ?? []).slice(0, 12).map((f, i) => {
              const row = f as Record<string, unknown>
              const name = String(row.familyName ?? row.name ?? 'Family')
              const total = Number(row.totalAmount ?? row.totalContributions ?? 0)
              return (
                <li key={String(row.familyId ?? row.id ?? i)} className="flex items-center gap-4 px-5 py-3">
                  <span className="font-display font-bold text-2xl text-text-muted w-8 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{name}</p>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(total)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
