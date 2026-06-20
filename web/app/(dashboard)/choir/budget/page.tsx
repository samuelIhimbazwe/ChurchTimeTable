'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, StatTile, HubTabs, PermissionGate, SkeletonCard, SkeletonStatTile,
} from '@/components/shared'
import { ContributionTreasuryPanel } from '@/components/choir/ContributionTreasuryPanel'
import { TreasurerCommandHome } from '@/components/choir/committee/TreasurerCommandHome'
import { useResolvedChoirScope } from '@/lib/hooks'
import { DollarSign, Wallet, TrendingUp, ClipboardCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'budgets', label: 'Budgets & planning' },
  { id: 'contributions', label: 'Contributions' },
]

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function normalizeBudgets(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>
  if (raw && typeof raw === 'object' && 'items' in raw) {
    return (raw as { items: Array<Record<string, unknown>> }).items
  }
  return []
}

export default function BudgetHubPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')
  const { choirLink } = useResolvedChoirScope()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [planKind, setPlanKind] = useState('Recording / album production')

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn: () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

  const { data: budgetsRaw, isLoading: loadingBudgets } = useQuery({
    queryKey: ['finance-budgets', 'CHOIR'],
    queryFn: () => financeApi.getBudgets({ ministryScope: 'CHOIR' }),
  })
  const budgets = normalizeBudgets(budgetsRaw)

  const { data: pendingFamily } = useQuery({
    queryKey: ['finance-contributions-choir-pending-family'],
    queryFn: () =>
      financeApi.listContributions({
        ministryScope: 'CHOIR',
        status: 'SUBMITTED',
        familyOnly: true,
        limit: 30,
      }),
  })

  const { data: submitOptions } = useQuery({
    queryKey: ['contribution-submit-options'],
    queryFn: financeApi.getContributionSubmitOptions,
  })

  const createBudget = useMutation({
    mutationFn: () =>
      financeApi.createBudget({
        ministryScope: 'CHOIR',
        name: `${planKind}: ${name}`,
        amount: Number(amount),
        periodStart,
        periodEnd,
      }),
    onSuccess: () => {
      toast.success('Budget line created')
      setName('')
      setAmount('')
      qc.invalidateQueries({ queryKey: ['finance-budgets'] })
    },
    onError: () => toast.error('Could not create budget'),
  })

  const queueItems =
    pendingFamily && typeof pendingFamily === 'object' && 'items' in pendingFamily
      ? (pendingFamily as { items: unknown[] }).items
      : []

  const campaigns = (submitOptions as { campaigns?: unknown[] })?.campaigns ?? []

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Treasurer & budget</h1>
        <p className="text-text-secondary text-sm mt-1">
          Umusanzu, savings, and financial planning for recordings, concerts, and choir projects
        </p>
      </div>

      <HubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-4">
          <TreasurerCommandHome />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loadingAnalytics ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
            ) : (
              <>
                <StatTile
                  label="Contributions (MTD)"
                  value={num(analytics?.contributionsMtd ?? analytics?.totalContributions)}
                  icon={DollarSign}
                  animate
                  href={choirLink('finance')}
                />
                <StatTile
                  label="Pending queue"
                  value={queueItems.length}
                  icon={ClipboardCheck}
                  animate
                  href={choirLink('budget/verify')}
                />
                <StatTile
                  label="Active budgets"
                  value={budgets.length}
                  icon={Wallet}
                  animate
                  href={choirLink('budget')}
                />
                <StatTile
                  label="Campaigns"
                  value={campaigns.length}
                  icon={TrendingUp}
                  animate
                  href={choirLink('stewardship/admin')}
                />
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={choirLink('budget/verify')} className="text-sm font-semibold text-primary-600">
              Verification console →
            </Link>
            <Link href={choirLink('stewardship')} className="text-sm font-semibold text-primary-600">
              Stewardship dashboard →
            </Link>
            <Link href={choirLink('finance')} className="text-sm font-semibold text-primary-600">
              Finance analytics →
            </Link>
            <PermissionGate anyOf={['choir.contribution.type.manage', 'choir.contribution.campaign.manage']}>
              <Link href={choirLink('stewardship/admin')} className="text-sm font-semibold text-primary-600">
                Catalog & campaigns →
              </Link>
            </PermissionGate>
          </div>
        </div>
      )}

      {tab === 'budgets' && (
        <div className="space-y-4">
          <PermissionGate anyOf={['choir.finance.manage', 'finance:write']}>
            <Card padding="md" accent="gold">
              <p className="font-semibold text-text-primary mb-3">Plan a budget line</p>
              <p className="text-xs text-text-muted mb-3">
                Use for expensive audio/video production, live concerts, uniforms, or special projects.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={planKind} onChange={(e) => setPlanKind(e.target.value)} className={inputClass}>
                  <option>Recording / album production</option>
                  <option>Live concert logistics</option>
                  <option>Uniforms & attire</option>
                  <option>Equipment purchase</option>
                  <option>General savings</option>
                </select>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name (e.g. Easter concert 2026)"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Target amount (RWF)"
                  className={inputClass}
                />
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                disabled={createBudget.isPending || !name.trim() || !amount || !periodStart || !periodEnd}
                onClick={() => createBudget.mutate()}
                className="mt-4 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
              >
                Create budget line
              </button>
            </Card>
          </PermissionGate>

          {loadingBudgets ? (
            <SkeletonCard rows={4} />
          ) : budgets.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-6">No choir budgets yet.</p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {budgets.map((b) => (
                <Card key={String(b.id)} padding="md">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-primary">{String(b.name ?? 'Budget')}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {formatDate(String(b.periodStart ?? ''))} – {formatDate(String(b.periodEnd ?? ''))}
                      </p>
                    </div>
                    <p className="font-display text-xl font-bold text-primary-700">
                      {num(b.amount).toLocaleString()} RWF
                    </p>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'contributions' && (
        <div className="space-y-4">
          <ContributionTreasuryPanel compact />
          <Link href={choirLink('stewardship')} className="text-sm font-semibold text-primary-600">
            Full stewardship dashboard →
          </Link>
        </div>
      )}
    </div>
  )
}
