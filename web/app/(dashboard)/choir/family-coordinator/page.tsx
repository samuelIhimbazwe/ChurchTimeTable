'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { familiesApi, welfareApi, choirActivityApi } from '@/lib/api'
import {
  Card, StatTile, Badge, SkeletonCard, PermissionGate,
} from '@/components/shared'
import { ChoirPositionHubShell, HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { useResolvedChoirScope } from '@/lib/hooks'
import { ContributionTreasuryPanel } from '@/components/choir/ContributionTreasuryPanel'
import { FamilyRankingsPanel } from '@/components/choir/FamilyRankingsPanel'
import { formatDate } from '@/lib/utils/format'
import { ContributionAmountDisplay } from '@/components/choir/ContributionAmountDisplay'
import { Users, Heart, DollarSign, Calendar, BarChart3, Trophy } from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'families', label: 'All families' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'operations', label: 'Operations' },
]

export default function FamilyCoordinatorHubPage() {
  const [tab, setTab] = useState('overview')
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: families, isLoading: loadingFamilies } = useQuery({
    queryKey: ['families-with-metrics'],
    queryFn: () => familiesApi.getAll({ includeMetrics: true, limit: 100 }),
  })

  const { data: welfare } = useQuery({
    queryKey: ['welfare'],
    queryFn: () => welfareApi.getAll(),
  })

  const { data: activities } = useQuery({
    queryKey: ['choir-activities-coord', choirId],
    queryFn: () => choirActivityApi.getAll({ choirId, limit: 10 }),
    enabled: !!choirId && (tab === 'operations' || tab === 'overview'),
  })

  const openWelfare = welfare?.filter((c) => c.status !== 'RESOLVED').length ?? 0
  const totalMembers = families?.reduce((sum, f) => sum + (f.memberCount ?? 0), 0) ?? 0

  return (
    <ChoirPositionHubShell roleKey="family_coordinator" tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'overview' && (
        <div className="space-y-4">
          <Card padding="md" accent="gold">
            <p className="text-sm text-text-secondary">
              You oversee <strong>all families</strong> in the choir — rankings, contributions,
              attendance health, activities, and operations across every team.
            </p>
          </Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Families" value={families?.length ?? 0} icon={Users} animate />
            <StatTile label="Total members" value={totalMembers} icon={Users} animate />
            <StatTile label="Open welfare" value={openWelfare} icon={Heart} animate />
            <StatTile label="Upcoming activities" value={activities?.items?.length ?? 0} icon={Calendar} animate />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <HubQuickLink href={choirLink('families')} label="Manage families" desc="Assign heads and members" icon={Users} />
            <HubQuickLink href={choirLink('welfare')} label="Welfare" desc="Care across all families" icon={Heart} />
            <HubQuickLink href={choirLink('scheduling')} label="Operations schedule" desc="Calendar and assignments" icon={Calendar} />
            <HubQuickLink href={choirLink('reports')} label="Reports" desc="Export family participation" icon={BarChart3} />
          </div>
        </div>
      )}

      {tab === 'families' && (
        <div className="space-y-4">
          <PermissionGate anyOf={['choir.family.manage', 'family:manage']}>
            <Link href={choirLink('families')} className="text-sm font-semibold text-primary-600">
              Open full families module →
            </Link>
          </PermissionGate>
          {loadingFamilies ? (
            <SkeletonCard rows={6} />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
              {families?.map((f, i) => (
                <li key={f.id} className="px-4 py-3 flex items-center gap-4">
                  <span className="font-display font-bold text-xl text-text-muted w-8 text-right shrink-0">
                    {f.rank ?? i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{f.name}</p>
                    <p className="text-xs text-text-muted">
                      {f.familyCode && `${f.familyCode} · `}Head: {f.headName} · {f.memberCount} members
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {f.healthGrade && (
                      <Badge variant="default">Grade {f.healthGrade}</Badge>
                    )}
                    <ContributionAmountDisplay
                      confirmed={f.totalContributions}
                      effective={f.effectiveContributions}
                      className="mt-1"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'rankings' && (
        <FamilyRankingsPanel showOverview />
      )}

      {tab === 'contributions' && (
        <div className="space-y-4">
          <Card padding="md">
            <p className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign size={16} /> Family umusanzu by team
            </p>
            <ul className="space-y-3 mb-6">
              {families?.map((f) => (
                <li key={f.id} className="flex justify-between gap-3 text-sm border-b border-border pb-3">
                  <span className="font-medium">{f.name}</span>
                  <ContributionAmountDisplay
                    confirmed={f.totalContributions}
                    effective={f.effectiveContributions}
                  />
                </li>
              ))}
            </ul>
          </Card>
          <ContributionTreasuryPanel compact />
          <Link href={choirLink('stewardship')} className="text-sm font-semibold text-primary-600">
            Stewardship dashboard →
          </Link>
        </div>
      )}

      {tab === 'operations' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <HubQuickLink href={choirLink('activities')} label="Activities" desc="Rehearsals, services, events" icon={Calendar} />
            <HubQuickLink href={choirLink('scheduling')} label="Scheduling" desc="Assignments and calendar" icon={Calendar} />
            <HubQuickLink href={choirLink('members')} label="Full roster" desc="All choir members" icon={Users} />
            <HubQuickLink href={choirLink('analytics')} label="Analytics" desc="Participation trends" icon={Trophy} />
          </div>
          <Card padding="md">
            <p className="font-semibold mb-3">Upcoming choir activities</p>
            <ul className="space-y-2">
              {(activities?.items ?? []).map((a) => (
                <li key={a.id} className="text-sm flex justify-between gap-2">
                  <Link href={choirLink('attendance', a.id)} className="hover:text-primary-600">{a.title}</Link>
                  <span className="text-text-muted shrink-0">{formatDate(a.date)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </ChoirPositionHubShell>
  )
}
