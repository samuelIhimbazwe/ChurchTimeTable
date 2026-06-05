'use client'

import { useQuery } from '@tanstack/react-query'
import { contributionsApi, familiesApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, PermissionGate, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import { DollarSign, Users, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

export default function StewardshipPage() {
  const { data: contributions, isLoading: cLoading } = useQuery({
    queryKey: ['contributions', 'all'],
    queryFn:  () => contributionsApi.getAll({ limit: 50 }),
  })

  const { data: families, isLoading: fLoading } = useQuery({
    queryKey: ['families'],
    queryFn:  familiesApi.getAll,
  })

  const pending  = contributions?.items?.filter((c) => c.status === 'PENDING').length ?? 0
  const approved = contributions?.items?.filter((c) => c.status === 'APPROVED').length ?? 0
  const total    = contributions?.items
    ?.filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + c.amount, 0) ?? 0

  return (
    <PermissionGate permission="choir.contribution.view.all" fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">You do not have access to stewardship data.</p>
      </div>
    }>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Stewardship</h2>
          <p className="text-text-secondary text-sm mt-1">
            Contribution overview and family rankings
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)
          ) : (
            <>
              <StatTile label="Total Approved"   value={total}   prefix="RWF " icon={DollarSign} animate />
              <StatTile label="Pending Review"   value={pending}               icon={TrendingUp}  animate />
              <StatTile label="Approved Records" value={approved}              icon={Users}       animate />
            </>
          )}
        </div>

        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Pending Approval</CardTitle>
            <CardDescription>{pending} contributions awaiting review</CardDescription>
          </CardHeader>
          {cLoading ? (
            <SkeletonCard rows={3} />
          ) : pending === 0 ? (
            <p className="text-center text-text-muted py-8 text-sm">
              All contributions are reviewed.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {contributions?.items
                ?.filter((c) => c.status === 'PENDING')
                .map((c) => (
                  <li key={c.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{c.type}</p>
                      <p className="text-xs text-text-muted">{c.month}</p>
                    </div>
                    <span className="font-display font-bold text-lg text-text-primary">
                      {formatCurrency(c.amount, c.currency)}
                    </span>
                    <PermissionGate permission="choir.contribution.adjust">
                      <button
                        onClick={() => contributionsApi.approve(c.id)}
                        className="text-xs font-semibold text-success hover:text-success/80"
                      >
                        Approve
                      </button>
                    </PermissionGate>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Family Rankings</CardTitle>
            <CardDescription>By total contributions</CardDescription>
          </CardHeader>
          {fLoading ? (
            <SkeletonCard rows={4} />
          ) : (
            <ul className="divide-y divide-border">
              {families?.map((f, i) => (
                <li key={f.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="font-display font-bold text-2xl text-text-muted w-8 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{f.name}</p>
                    <p className="text-xs text-text-muted">{f.memberCount} members</p>
                  </div>
                  <span className="font-semibold text-sm text-text-primary">
                    {formatCurrency(f.totalContributions)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PermissionGate>
  )
}
