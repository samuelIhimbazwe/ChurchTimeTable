'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financeApi, familiesApi } from '@/lib/api'
import { Card, Badge, PermissionGate } from '@/components/shared'
import { SponsorContributionInboxPanel } from '@/components/choir/SponsorContributionInboxPanel'
import { ContributionAdjustModal } from '@/components/shared/finance/ContributionAdjustModal'
import { useResolvedChoirScope } from '@/lib/hooks'
import {
  normalizeContributionList,
  type TreasuryContributionRow,
} from '@/components/shared/finance/contribution-inbox.shared'
import { formatCurrency } from '@/lib/utils/format'

const CHOIR_TREASURY_KEYS = [
  'finance-contributions-all',
  'contribution-adjustments-recent',
  'finance-contributions-choir-pending-family',
] as const

type TreasuryRow = TreasuryContributionRow

export function ContributionTreasuryPanel({ compact = false }: { compact?: boolean }) {
  const { choirId } = useResolvedChoirScope()
  const [adjusting, setAdjusting] = useState<TreasuryRow | null>(null)

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

  const pendingFamily = normalizeContributionList(pendingFamilyRaw)
  const all = normalizeContributionList(allRaw)
  const discrepancies = all.filter(
    (c) =>
      (c.discrepancyAmount != null && c.discrepancyAmount !== 0) ||
      (c.confirmedAmount != null && c.confirmedAmount !== c.claimedAmount),
  )
  const confirmed = all.filter((c) => c.status === 'CONFIRMED' || c.status === 'APPROVED')

  function openAdjust(row: TreasuryRow) {
    setAdjusting(row)
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
        <ContributionAdjustModal
          item={adjusting}
          onClose={() => setAdjusting(null)}
          invalidateQueryKeys={[...CHOIR_TREASURY_KEYS]}
        />
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
