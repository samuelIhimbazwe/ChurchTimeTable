'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { contributionsApi, financeApi, type ContributionClaim } from '@/lib/api'
import type { MemberContributionGoal } from '@/lib/api/modules/finance'
import { ContributeClaimForm } from '@/components/choir/ContributeClaimForm'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import { HubTabs } from '@/components/shared/HubTabs'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { ResponsiveDataView, TableScroll } from '@/components/shared/TableScroll'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  familyReviewLabel,
  goalProgressBarClass,
  memberStatusBadgeVariant,
  memberStatusLabel,
  resolveMemberDisplayStatus,
} from '@/lib/contribution/member-display'
import { ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview', label: 'Summary' },
  { id: 'submit', label: 'Submit payment' },
  { id: 'balances', label: 'By type' },
  { id: 'history', label: 'All claims' },
] as const

type TabId = (typeof TABS)[number]['id']

type NavState = {
  tab: TabId
  status?: string
  typeId?: string
  detailId?: string
}

type Props = {
  choirId?: string
  title?: string
  subtitle?: string
  /** Used when the URL has no `tab` query param */
  defaultTab?: TabId
}

function useContributionNav(defaultTab: TabId = 'overview') {
  const router = useRouter()
  const searchParams = useSearchParams()

  const state: NavState = {
    tab: (searchParams.get('tab') as TabId) || defaultTab,
    status: searchParams.get('status') ?? undefined,
    typeId: searchParams.get('typeId') ?? undefined,
    detailId: searchParams.get('detailId') ?? undefined,
  }

  const navigate = useCallback(
    (next: Partial<NavState>) => {
      const params = new URLSearchParams()
      const tab = next.tab ?? state.tab
      params.set('tab', tab)
      const status = next.status !== undefined ? next.status : state.status
      const typeId = next.typeId !== undefined ? next.typeId : state.typeId
      const detailId = next.detailId !== undefined ? next.detailId : state.detailId
      if (status) params.set('status', status)
      if (typeId) params.set('typeId', typeId)
      if (detailId) params.set('detailId', detailId)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, state.detailId, state.status, state.tab, state.typeId],
  )

  return { state, navigate }
}

function GoalCard({
  goal,
  onClick,
}: {
  goal: MemberContributionGoal
  onClick: () => void
}) {
  const label = goal.typeName ?? goal.name
  const target = goal.memberGoalAmount ?? 0
  const pct = goal.progressPct ?? 0
  const remaining = goal.remaining ?? Math.max(0, target - goal.confirmedEffective)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-surface p-4 hover:shadow-raised transition-shadow"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="font-semibold text-sm">{label}</p>
        <ChevronRight size={16} className="text-primary-600 shrink-0" />
      </div>
      <p className="text-xs text-text-muted">
        Confirmed {formatCurrency(goal.confirmedEffective)} / {formatCurrency(target)}
      </p>
      <div className="mt-2 h-2 rounded-full bg-surface-overlay overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${goalProgressBarClass(pct)}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-xs mt-2 text-text-secondary">
        {pct.toFixed(0)}% · Remaining {formatCurrency(remaining)}
      </p>
    </button>
  )
}

function StatusBadge({ claim }: { claim: ContributionClaim }) {
  const display = resolveMemberDisplayStatus(claim)
  return (
    <Badge variant={memberStatusBadgeVariant(display)} dot>
      {memberStatusLabel(display)}
    </Badge>
  )
}

function ContributionDetailPanel({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const { data: claim, isLoading: loadingClaim } = useQuery({
    queryKey: ['contribution-detail', id],
    queryFn: () => contributionsApi.getById(id),
  })
  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['contribution-timeline', id],
    queryFn: () => contributionsApi.getTimeline(id),
    enabled: !!id,
  })

  if (loadingClaim || !claim) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
        <Card padding="md" className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <p className="text-sm text-text-muted">Loading…</p>
        </Card>
      </div>
    )
  }

  const display = resolveMemberDisplayStatus(claim)
  const events = [...(timeline?.events ?? [])].reverse()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <Card padding="md" className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-b-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Contribution details</p>
            <p className="font-display text-xl font-bold mt-1">{claim.referenceNumber ?? '—'}</p>
            <div className="mt-2">
              <StatusBadge claim={claim} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-raised text-text-muted"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-text-muted text-xs">Type</dt>
            <dd className="font-medium">{claim.typeName ?? '—'}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-text-muted text-xs">Claimed</dt>
              <dd className="font-medium">{formatCurrency(claim.claimedAmount)}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Confirmed</dt>
              <dd className={`font-medium ${display === 'partial' ? 'text-warning' : ''}`}>
                {claim.confirmedAmount != null
                  ? formatCurrency(claim.confirmedAmount)
                  : '—'}
              </dd>
            </div>
          </div>
          {claim.paymentAt && (
            <div>
              <dt className="text-text-muted text-xs">Payment date</dt>
              <dd>{formatDate(claim.paymentAt)}</dd>
            </div>
          )}
          {claim.paymentChannel && (
            <div>
              <dt className="text-text-muted text-xs">How you paid</dt>
              <dd>{claim.paymentChannel}</dd>
            </div>
          )}
          {claim.memberName && (
            <div>
              <dt className="text-text-muted text-xs">Submitted by</dt>
              <dd>
                {claim.memberName}
                {claim.memberNumber ? ` (${claim.memberNumber})` : ''}
              </dd>
            </div>
          )}
          {claim.discrepancyReason && (
            <div className="rounded-lg border-l-4 border-warning bg-warning-light/40 px-3 py-2">
              <p className="text-xs font-semibold text-warning">Verification note</p>
              <p className="text-sm mt-1">{claim.discrepancyReason}</p>
            </div>
          )}
          {claim.familyApprovedByName && (
            <div>
              <dt className="text-text-muted text-xs">Approved by</dt>
              <dd>
                {claim.familyApprovedByName}
                {claim.familyApprovedByNumber ? ` (${claim.familyApprovedByNumber})` : ''}
                {' · Family head'}
              </dd>
            </div>
          )}
          {claim.familyApprovedAt && (
            <div>
              <dt className="text-text-muted text-xs">Approved on</dt>
              <dd>{formatDate(claim.familyApprovedAt)}</dd>
            </div>
          )}
          {claim.rejectionReason && (
            <div className="rounded-lg border-l-4 border-danger bg-danger-light/40 px-3 py-2">
              <p className="text-xs font-semibold text-danger">Rejection reason</p>
              <p className="text-sm mt-1">{claim.rejectionReason}</p>
            </div>
          )}
        </dl>

        <div className="mt-6 border-t border-border pt-4">
          <p className="font-semibold text-sm mb-3">Activity</p>
          {loadingTimeline ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-text-muted">No activity recorded.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((event, i) => {
                const tone =
                  event.type === 'approved'
                    ? 'text-success'
                    : event.type === 'rejected'
                      ? 'text-danger'
                      : 'text-info'
                const comment =
                  event.metadata && typeof event.metadata.comment === 'string'
                    ? event.metadata.comment
                    : null
                return (
                  <li key={`${event.timestamp}-${i}`} className="text-sm">
                    <p className={`font-medium ${tone}`}>
                      {formatDate(event.timestamp)} · {event.summary}
                    </p>
                    {comment && (
                      <p className="text-xs mt-1 rounded-lg border-l-4 border-warning bg-warning-light/40 px-2 py-1.5 text-text-secondary">
                        {comment}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}

export function MemberContributionsHub({
  choirId,
  title = 'My contributions',
  subtitle = 'Pay to your family account, submit a claim, and track confirmation by your family head.',
  defaultTab = 'overview',
}: Props) {
  const { state, navigate } = useContributionNav(defaultTab)
  const [historyStatus, setHistoryStatus] = useState(state.status ?? '')
  const [historyTypeId, setHistoryTypeId] = useState(state.typeId ?? '')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')

  useEffect(() => {
    if (state.status !== undefined) setHistoryStatus(state.status)
    if (state.typeId !== undefined) setHistoryTypeId(state.typeId)
  }, [state.status, state.typeId])

  const { data: totals, isLoading: loadingTotals } = useQuery({
    queryKey: ['member-contribution-totals'],
    queryFn: () => financeApi.getMyContributionTotals(),
  })

  const { data: submitCtx } = useQuery({
    queryKey: ['contribution-submit-context', choirId],
    queryFn: () => contributionsApi.getSubmitContext(choirId),
  })

  const listParams = useMemo(
    () => ({
      limit: state.tab === 'overview' ? 5 : 50,
      status: historyStatus || undefined,
      contributionTypeCatalogId: historyTypeId || undefined,
      from: historyFrom ? new Date(historyFrom).toISOString() : undefined,
      to: historyTo ? new Date(`${historyTo}T23:59:59`).toISOString() : undefined,
    }),
    [historyFrom, historyStatus, historyTo, historyTypeId, state.tab],
  )

  const { data: listData, isLoading: loadingList } = useQuery({
    queryKey: ['my-contributions-list', listParams],
    queryFn: () => contributionsApi.listMine(listParams),
  })

  const claims = listData?.items ?? []
  const goals = totals?.byCampaign ?? []
  const memberHeader = totals?.member
  const types = submitCtx?.types ?? []

  const openDetail = (id: string) => navigate({ detailId: id })
  const closeDetail = () => navigate({ detailId: undefined })

  const goTab = (tab: TabId, extra?: Partial<NavState>) => {
    navigate({ tab, ...extra, detailId: undefined })
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">{title}</h2>
        <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
        {(memberHeader || submitCtx?.family) && (
          <p className="text-sm text-text-muted mt-2">
            {memberHeader?.memberNumber && (
              <span className="font-medium text-text-secondary">
                {memberHeader.memberNumber}
              </span>
            )}
            {memberHeader?.memberName && (
              <span>
                {memberHeader.memberNumber ? ' · ' : ''}
                {memberHeader.memberName}
              </span>
            )}
            {(memberHeader?.familyName ?? submitCtx?.family?.name) && (
              <span>
                {' · Family '}
                {memberHeader?.familyName ?? submitCtx?.family?.name}
              </span>
            )}
          </p>
        )}
      </div>

      <HubTabs
        tabs={[...TABS]}
        active={state.tab}
        onChange={(id) => goTab(id as TabId)}
      />

      {state.tab === 'overview' && (
        <div className="space-y-4">
          {loadingTotals ? (
            <SkeletonCard rows={3} />
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => goTab('balances')}
                className="rounded-xl border border-border p-4 text-left hover:shadow-raised transition-shadow"
              >
                <p className="text-xs text-text-muted">Total confirmed</p>
                <p className="text-2xl font-display font-bold text-success mt-1">
                  {formatCurrency(totals?.confirmed.effectiveTotal ?? 0)}
                </p>
                <p className="text-xs text-primary-600 mt-2 font-semibold">View balances →</p>
              </button>
              <button
                type="button"
                onClick={() => goTab('history', { status: 'SUBMITTED' })}
                className="rounded-xl border border-info/30 bg-info-light/30 p-4 text-left hover:shadow-raised transition-shadow"
              >
                <p className="text-xs text-info">Pending claims</p>
                <p className="text-2xl font-display font-bold text-info mt-1">
                  {totals?.pending.count ?? 0}
                </p>
                <p className="text-xs text-primary-600 mt-2 font-semibold">View waiting →</p>
              </button>
              <button
                type="button"
                onClick={() => goTab('history', { status: 'REJECTED' })}
                className="rounded-xl border border-danger/30 bg-danger-light/30 p-4 text-left hover:shadow-raised transition-shadow"
              >
                <p className="text-xs text-danger">Rejected claims</p>
                <p className="text-2xl font-display font-bold text-danger mt-1">
                  {totals?.rejected.count ?? 0}
                </p>
                <p className="text-xs text-primary-600 mt-2 font-semibold">View rejected →</p>
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goTab('submit')}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg"
            >
              Submit contribution
            </button>
          </div>

          {submitCtx?.family && (
            <FamilyPaymentInstructionsCard
              familyName={submitCtx.family.name}
              headName={submitCtx.family.headName}
              payment={submitCtx.family.payment}
            />
          )}

          <div>
            <p className="font-semibold text-sm mb-3">Your contribution goals</p>
            {goals.length === 0 ? (
              <Card padding="md">
                <p className="text-sm text-text-muted">
                  No personal targets set yet. Your coordinator will publish goals for each
                  contribution type.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.campaignId}
                    goal={goal}
                    onClick={() =>
                      goTab('balances', {
                        typeId: goal.contributionTypeCatalogId,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="font-semibold text-sm">Recent activity</p>
              <button
                type="button"
                onClick={() => goTab('history')}
                className="text-xs font-semibold text-primary-600"
              >
                View all history →
              </button>
            </div>
            {loadingList ? (
              <SkeletonCard rows={3} />
            ) : claims.length === 0 ? (
              <Card padding="md">
                <p className="text-sm text-text-muted text-center py-2">No claims yet.</p>
              </Card>
            ) : (
              <Card padding="none">
                <ul className="divide-y divide-border">
                  {claims.map((claim) => (
                    <li key={claim.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(claim.id)}
                        className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-surface-raised"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {claim.referenceNumber ?? claim.typeName} · {claim.typeName}
                          </p>
                          <p className="text-xs text-text-muted">
                            {claim.paymentAt
                              ? formatDate(claim.paymentAt)
                              : claim.createdAt
                                ? formatDate(claim.createdAt)
                                : ''}
                            {' · '}
                            {formatCurrency(claim.claimedAmount)}
                          </p>
                        </div>
                        <StatusBadge claim={claim} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}

      {state.tab === 'submit' && (
        <ContributeClaimForm
          choirId={choirId}
          initialTypeId={state.typeId}
          onSuccess={() => goTab('history', { status: 'SUBMITTED' })}
        />
      )}

      {state.tab === 'balances' && (
        <div className="space-y-4">
          {loadingTotals ? (
            <SkeletonCard rows={4} />
          ) : (
            <>
              {goals.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-text-muted">No personal targets configured.</p>
                </Card>
              ) : (
                goals
                  .filter(
                    (g) =>
                      !state.typeId || g.contributionTypeCatalogId === state.typeId,
                  )
                  .map((goal) => (
                    <GoalCard
                      key={goal.campaignId}
                      goal={goal}
                      onClick={() =>
                        goTab('history', {
                          typeId: goal.contributionTypeCatalogId,
                        })
                      }
                    />
                  ))
              )}

              {(totals?.pending.count ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => goTab('history', { status: 'SUBMITTED' })}
                  className="w-full rounded-xl border border-info/30 bg-info-light/20 p-4 text-left hover:shadow-raised"
                >
                  <p className="text-sm font-semibold text-info">Pending family review</p>
                  <p className="text-xs text-text-muted mt-1">
                    {totals?.pending.count} claim(s) ·{' '}
                    {formatCurrency(totals?.pending.claimedTotal ?? 0)} claimed
                  </p>
                </button>
              )}

              <Card padding="md" accent="info">
                <p className="text-sm text-text-secondary">
                  Confirmed total:{' '}
                  <strong className="text-success">
                    {formatCurrency(totals?.confirmed.effectiveTotal ?? 0)}
                  </strong>
                </p>
              </Card>
            </>
          )}
        </div>
      )}

      {state.tab === 'history' && (
        <div className="space-y-4">
          <div className="responsive-form-row">
            <select
              value={historyTypeId || state.typeId || ''}
              onChange={(e) => {
                setHistoryTypeId(e.target.value)
                navigate({ typeId: e.target.value || undefined })
              }}
              className="text-sm px-3 py-2 rounded-lg border border-border bg-surface"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={historyStatus || state.status || ''}
              onChange={(e) => {
                setHistoryStatus(e.target.value)
                navigate({ status: e.target.value || undefined })
              }}
              className="text-sm px-3 py-2 rounded-lg border border-border bg-surface"
            >
              <option value="">All statuses</option>
              <option value="SUBMITTED">Waiting for family</option>
              <option value="CONFIRMED">Approved / partial</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <input
              type="date"
              value={historyFrom}
              onChange={(e) => setHistoryFrom(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border border-border bg-surface"
              aria-label="From date"
            />
            <input
              type="date"
              value={historyTo}
              onChange={(e) => setHistoryTo(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border border-border bg-surface"
              aria-label="To date"
            />
          </div>

          {loadingList ? (
            <SkeletonCard rows={6} />
          ) : claims.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-4">No matching claims.</p>
            </Card>
          ) : (
            <ResponsiveDataView
              items={claims}
              keyFn={(claim) => claim.id}
              mobileRow={(claim) => {
                const display = resolveMemberDisplayStatus(claim)
                return (
                  <button
                    key={claim.id}
                    type="button"
                    onClick={() => openDetail(claim.id)}
                    className="w-full text-left rounded-xl border border-border bg-surface p-4 hover:bg-surface-raised transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {claim.referenceNumber ?? '—'}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{claim.typeName ?? '—'}</p>
                      </div>
                      <StatusBadge claim={claim} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-text-muted">Date</p>
                        <p className="font-medium text-text-primary">
                          {claim.paymentAt
                            ? formatDate(claim.paymentAt)
                            : claim.createdAt
                              ? formatDate(claim.createdAt)
                              : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-muted">Claimed</p>
                        <p className="font-medium text-text-primary">
                          {formatCurrency(claim.claimedAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted">Confirmed</p>
                        <p className={cn(
                          'font-medium',
                          display === 'partial' ? 'text-warning' : 'text-text-primary',
                        )}>
                          {claim.confirmedAmount != null
                            ? formatCurrency(claim.confirmedAmount)
                            : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-muted">Family</p>
                        <p className="font-medium text-text-primary truncate">
                          {familyReviewLabel(display)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              }}
              table={
                <Card padding="none">
                  <TableScroll minWidth={640}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-surface-raised text-left text-xs text-text-muted">
                          <th className="px-4 py-3 font-semibold">Ref #</th>
                          <th className="px-4 py-3 font-semibold">Type</th>
                          <th className="px-4 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold text-right">Claimed</th>
                          <th className="px-4 py-3 font-semibold text-right">Confirmed</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Family</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claims.map((claim) => {
                          const display = resolveMemberDisplayStatus(claim)
                          return (
                            <tr
                              key={claim.id}
                              onClick={() => openDetail(claim.id)}
                              className="border-b border-border last:border-0 cursor-pointer hover:bg-primary-50/40 dark:hover:bg-primary-100/10"
                            >
                              <td className="px-4 py-3 font-medium">{claim.referenceNumber ?? '—'}</td>
                              <td className="px-4 py-3">{claim.typeName ?? '—'}</td>
                              <td className="px-4 py-3 text-text-muted">
                                {claim.paymentAt
                                  ? formatDate(claim.paymentAt)
                                  : claim.createdAt
                                    ? formatDate(claim.createdAt)
                                    : '—'}
                              </td>
                              <td className="px-4 py-3 text-right">{formatCurrency(claim.claimedAmount)}</td>
                              <td className="px-4 py-3 text-right">
                                {claim.confirmedAmount != null ? (
                                  <span className={display === 'partial' ? 'text-warning font-medium' : ''}>
                                    {formatCurrency(claim.confirmedAmount)}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge claim={claim} />
                              </td>
                              <td className="px-4 py-3 text-text-muted">
                                {familyReviewLabel(display)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </TableScroll>
                </Card>
              }
            />
          )}
        </div>
      )}

      {state.detailId && (
        <ContributionDetailPanel id={state.detailId} onClose={closeDetail} />
      )}
    </div>
  )
}
