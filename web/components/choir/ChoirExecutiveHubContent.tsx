'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  choirApi, choirActivityApi, choirSchedulingApi, financeApi, welfareApi, disciplineApi,
} from '@/lib/api'
import {
  Card, StatTile, SkeletonStatTile, PermissionGate, HubTabs,
} from '@/components/shared'
import { HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { formatDate } from '@/lib/utils/format'
import {
  UserPlus, Settings2, Heart, BookOpen, DollarSign, FileText, Shield,
  Calendar, Users, BarChart3, KeyRound,
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

  const { data: choirs } = useQuery({ queryKey: ['choirs'], queryFn: choirApi.getAll })
  const choir = choirs?.[0]

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['choir-leader-dashboard', choir?.id],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choir!.id),
    enabled: !!choir?.id,
  })
  const h = health as Record<string, unknown> | undefined

  const { data: joinRequests } = useQuery({
    queryKey: ['choir-join-requests', choir?.id],
    queryFn: () => choirApi.getJoinRequests({ choirId: choir?.id, status: 'PENDING' }),
    enabled: !!choir?.id,
  })

  const { data: activities } = useQuery({
    queryKey: ['choir-activities', { limit: 5 }],
    queryFn: () => choirActivityApi.getAll({ limit: 5 }),
  })

  const { data: analytics } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn: () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

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
                <StatTile label="Attendance rate" value={num(h?.attendanceRate ?? h?.avgAttendanceRate)} suffix="%" icon={Calendar} animate />
                <StatTile label="Pending joins" value={pendingJoins} icon={UserPlus} animate />
                <StatTile label="Active discipline" value={activeDiscipline} icon={Shield} animate />
                <StatTile label="Open welfare" value={openWelfare} icon={Heart} animate />
              </>
            )}
          </div>
          <Card padding="md">
            <p className="font-semibold mb-3">Contributions (MTD)</p>
            <p className="font-display text-2xl font-bold text-primary-700">
              {num(analytics?.contributionsMtd ?? analytics?.totalContributions).toLocaleString()} RWF
            </p>
            <Link href="/choir/stewardship" className="text-xs font-semibold text-primary-600 mt-2 inline-block">
              Stewardship dashboard →
            </Link>
          </Card>
          <Card padding="md">
            <div className="flex justify-between mb-3">
              <p className="font-semibold">Upcoming activities</p>
              <Link href="/choir/activities" className="text-xs font-semibold text-primary-600">All →</Link>
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
          <PermissionGate anyOf={['choir.join.review', 'member:manage']}>
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
                <Link href="/choir/join-requests" className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg shrink-0">
                  Review
                </Link>
              </div>
            </Card>
          </PermissionGate>
          <div className="grid sm:grid-cols-2 gap-4">
            <HubQuickLink href="/choir/public-profile" label="Public choir profile" desc="What members and visitors see" icon={Settings2} />
            <PermissionGate anyOf={['choir.custom_role.manage', 'committee.role.manage']}>
              <HubQuickLink href="/choir/roles" label="Position roles" desc="Customize officer permissions" icon={KeyRound} />
            </PermissionGate>
            <HubQuickLink href="/choir/members" label="Roster" desc="Manage members and positions" icon={Users} />
            <HubQuickLink href="/choir/reports" label="Reports" desc="Export leadership summaries" icon={BarChart3} />
          </div>
        </div>
      )}

      {tab === 'officers' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <HubQuickLink href="/choir/care" label="Care & discipline" desc="Rules, welfare, discipline" icon={Heart} />
          <HubQuickLink href="/choir/spiritual" label="Spiritual life" desc="Intercession, prayer, devotions" icon={BookOpen} />
          <HubQuickLink href="/choir/budget" label="Treasurer & budget" desc="Umusanzu and project planning" icon={DollarSign} />
          <HubQuickLink href="/choir/records" label="Secretary records" desc="Activities, music, documents" icon={FileText} />
          <HubQuickLink href="/choir/scheduling" label="Scheduling" desc="Calendar and assignments" icon={Calendar} />
          <HubQuickLink href="/choir/discipline" label="Discipline module" desc="Full case management" icon={Shield} />
        </div>
      )}
    </div>
  )
}
