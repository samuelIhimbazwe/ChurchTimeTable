'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  choirActivityApi, choirSchedulingApi, financeApi, welfareApi, disciplineApi, choirApi, familiesApi,
} from '@/lib/api'
import { choirServiceOpsApi } from '@/lib/api/modules/choirServiceOps'
import { ContributionAmountDisplay } from '@/components/choir/ContributionAmountDisplay'
import { useResolvedChoirId } from '@/lib/hooks'
import { legacyOrScopedChoirPath } from '@/lib/choir/paths'
import {
  Card, StatTile, SkeletonStatTile, CapabilityGate, HubTabs,
} from '@/components/shared'
import { HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { formatDate } from '@/lib/utils/format'
import {
  UserPlus, Settings2, Heart, BookOpen, DollarSign, FileText, Shield,
  Calendar, Users, BarChart3, KeyRound, ClipboardList,
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'governance', label: 'Governance' },
  { id: 'officers', label: 'Officer hubs' },
]

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

type Props = { deputyMode?: boolean }

export function ChoirExecutiveHubContent({ deputyMode = false }: Props) {
  const [tab, setTab] = useState('overview')

  const choirId = useResolvedChoirId()

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId),
    enabled: !!choirId,
  })
  const h = health as Record<string, unknown> | undefined

  const { data: joinRequests } = useQuery({
    queryKey: ['choir-join-requests', choirId],
    queryFn: () => choirApi.getJoinRequests({ choirId, status: 'PENDING' }),
    enabled: !!choirId,
  })

  const { data: activities } = useQuery({
    queryKey: ['choir-activities', choirId, { limit: 5 }],
    queryFn: () => choirActivityApi.getAll({ choirId, limit: 5 }),
    enabled: !!choirId,
  })

  const { data: analytics } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn: () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

  const { data: familyTotals } = useQuery({
    queryKey: ['families-effective-totals', choirId],
    queryFn: () => familiesApi.getAll({ includeMetrics: true, limit: 100 }),
    enabled: !!choirId,
  })

  const familyConfirmedTotal = (familyTotals ?? []).reduce(
    (sum, f) => sum + (f.totalContributions ?? 0),
    0,
  )
  const familyEffectiveTotal = (familyTotals ?? []).reduce(
    (sum, f) => sum + (f.effectiveContributions ?? f.totalContributions ?? 0),
    0,
  )

  const { data: discipline } = useQuery({
    queryKey: ['discipline-active'],
    queryFn: () => disciplineApi.getAll(),
  })
  const activeDiscipline = discipline?.filter((c) => !c.resolvedAt).length ?? 0

  const { data: welfare } = useQuery({
    queryKey: ['welfare-open'],
    queryFn: () => welfareApi.getAll(),
  })
  const openWelfare = welfare?.filter((c) => c.status !== 'RESOLVED').length ?? 0

  const pendingJoins = joinRequests?.length ?? 0

  const { data: serviceRequests } = useQuery({
    queryKey: ['church-service-requests', 'PENDING', choirId],
    queryFn: () =>
      choirServiceOpsApi.listChurchRequests({ status: 'PENDING', choirId }),
    enabled: !!choirId,
  })

  return (
    <div className="space-y-4">
      {deputyMode && (
        <Card padding="md" accent="info">
          <p className="text-sm text-text-secondary">
            As Vice President you have nearly the same access as the President — lead operations,
            review joins, and use all officer hubs. Stand in fully when the President is away.
          </p>
        </Card>
      )}

      <HubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loadingHealth ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
            ) : (
              <>
                <StatTile label="Attendance rate" value={num(h?.attendanceRate ?? h?.avgAttendanceRate)} suffix="%" icon={Calendar} animate href={legacyOrScopedChoirPath(choirId, 'reports')} />
                <StatTile label="Pending joins" value={pendingJoins} icon={UserPlus} animate href={legacyOrScopedChoirPath(choirId, 'president/decisions')} />
                <StatTile label="Active discipline" value={activeDiscipline} icon={Shield} animate href={legacyOrScopedChoirPath(choirId, 'discipline')} />
                <StatTile label="Open welfare" value={openWelfare} icon={Heart} animate href={legacyOrScopedChoirPath(choirId, 'welfare')} />
              </>
            )}
          </div>
          <Card padding="md" href={legacyOrScopedChoirPath(choirId, 'stewardship')}>
            <p className="font-semibold mb-3">Family contributions (effective)</p>
            <ContributionAmountDisplay
              confirmed={familyConfirmedTotal}
              effective={familyEffectiveTotal}
              size="md"
            />
            <p className="text-xs text-text-muted mt-2">
              Stewardship MTD: {num(analytics?.contributionsMtd ?? analytics?.totalContributions).toLocaleString()} RWF
            </p>
            <Link href={legacyOrScopedChoirPath(choirId, 'stewardship')} className="text-xs font-semibold text-primary-600 mt-2 inline-block">
              Stewardship dashboard →
            </Link>
          </Card>
          <Card padding="md" href={legacyOrScopedChoirPath(choirId, 'activities')}>
            <div className="flex justify-between mb-3">
              <p className="font-semibold">Upcoming activities</p>
              <span className="text-xs font-semibold text-primary-600">All →</span>
            </div>
            <ul className="space-y-2">
              {(activities?.items ?? []).slice(0, 4).map((a) => (
                <li key={a.id} className="text-sm flex justify-between gap-2">
                  <span>{a.title}</span>
                  <span className="text-text-muted shrink-0">{formatDate(a.date)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'governance' && (
        <div className="space-y-4">
          <CapabilityGate uiCapability="admin-executive-join-card">
            <Card padding="md" accent="gold">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <UserPlus size={18} /> Join requests
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {pendingJoins} pending — review applicants and assign positions.
                  </p>
                </div>
                <Link href={legacyOrScopedChoirPath(choirId, 'president/decisions')} className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg shrink-0">
                  Open decisions
                </Link>
              </div>
            </Card>
          </CapabilityGate>
          <div className="grid sm:grid-cols-2 gap-4">
            <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'admin')} label="Administration hub" desc="Joins, roster, families, settings" icon={Shield} />
            <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'public-profile')} label="Public choir profile" desc="What members and visitors see" icon={Settings2} />
            <CapabilityGate uiCapability="admin-executive-roles-link">
              <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'roles')} label="Position roles" desc="Customize officer permissions" icon={KeyRound} />
            </CapabilityGate>
            <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'members')} label="Roster" desc="Manage members and positions" icon={Users} />
            <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'admin/families')} label="Families structure" desc="Move members — privacy-safe view" icon={Users} />
            <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'settings')} label="Choir settings" desc="Membership rules and configuration" icon={Settings2} />
            <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'reports')} label="Reports" desc="Export leadership summaries" icon={BarChart3} />
          </div>
        </div>
      )}

      {tab === 'officers' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'care')} label="Care & discipline" desc="Rules, welfare, discipline" icon={Heart} />
          <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'spiritual')} label="Spiritual life" desc="Intercession, prayer, devotions" icon={BookOpen} />
          <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'budget')} label="Treasurer & budget" desc="Umusanzu and project planning" icon={DollarSign} />
          <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'records')} label="Secretary records" desc="Activities, music, documents" icon={FileText} />
          <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'scheduling')} label="Scheduling" desc="Calendar and assignments" icon={Calendar} />
          <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'service-preparation')} label="Service preparation" desc="Per-service plans and songs" icon={Calendar} />
          <HubQuickLink href="/church/service-requests" label="Church service requests" desc="Approve choir assignments for services" icon={ClipboardList} stat={(serviceRequests?.length ?? 0) > 0 ? `${serviceRequests!.length} pending` : undefined} />
          <HubQuickLink href={legacyOrScopedChoirPath(choirId, 'discipline')} label="Discipline module" desc="Full case management" icon={Shield} />
        </div>
      )}
    </div>
  )
}
