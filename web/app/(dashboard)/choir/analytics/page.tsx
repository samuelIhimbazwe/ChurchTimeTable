'use client'



import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import Link from 'next/link'

import { useRouter } from 'next/navigation'

import { choirSchedulingApi } from '@/lib/api'

import { useResolvedChoirScope } from '@/lib/hooks'

import {

  Card, CardHeader, CardTitle, CardDescription,

  StatTile, SkeletonStatTile, SkeletonCard, Avatar,
} from '@/components/shared'

import { ChoirParticipationChart } from '@/components/choir/analytics/ChoirParticipationChart'
import { AtRiskMembersPanel } from '@/components/choir/analytics/AtRiskMembersPanel'
import { ChoirInsightsShell } from '@/components/choir/ChoirInsightsShell'
import { ChoirHealthScore } from '@/components/dashboard/ChoirHealthScore'
import { UnifiedAttentionInbox } from '@/components/dashboard/UnifiedAttentionInbox'

import {

  Users, CheckCircle2, Heart, Shield, TrendingUp,

} from 'lucide-react'



function num(data: Record<string, unknown> | undefined, ...keys: string[]) {

  if (!data) return 0

  for (const k of keys) {

    if (data[k] != null) return Number(data[k])

  }

  return 0

}



function arrLen(data: Record<string, unknown> | undefined, ...keys: string[]) {

  if (!data) return 0

  for (const k of keys) {

    const v = data[k]

    if (Array.isArray(v)) return v.length

  }

  return 0

}



type ParticipationRow = {

  memberId?: string

  name: string

  score: number

  unexcusedAbsences?: number

  serviceAttendanceRate?: number

}



function parseParticipationTrend(raw: unknown): ParticipationRow[] {

  if (!Array.isArray(raw)) return []

  return raw.map((item) => {

    const row = item as Record<string, unknown>

    const member = row.member as { firstName?: string; lastName?: string } | undefined

    const name =

      (row.name as string | undefined) ??

      (member ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() : 'Member')

    return {

      memberId: row.memberId as string | undefined,

      name,

      score: Number(row.score ?? row.overallParticipationScore ?? 0),

    }

  })

}



function parseAtRiskMembers(raw: unknown): ParticipationRow[] {

  if (!Array.isArray(raw)) return []

  return raw.map((item) => {

    const row = item as Record<string, unknown>

    const member = row.member as { firstName?: string; lastName?: string } | undefined

    const name =

      (row.name as string | undefined) ??

      (member ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() : 'Member')

    return {

      memberId: row.memberId as string | undefined,

      name,

      score: Number(row.overallParticipationScore ?? row.score ?? 0),

      unexcusedAbsences: Number(row.unexcusedAbsences ?? 0),

      serviceAttendanceRate: Number(row.serviceAttendanceRate ?? 0),

    }

  })

}



function memberRosterHref(choirLink: (path: string, ...segments: string[]) => string, name: string) {

  return `${choirLink('members')}?q=${encodeURIComponent(name)}`

}



export default function AnalyticsPage() {

  const router = useRouter()

  const { choirId, choirLink } = useResolvedChoirScope()



  const { data: dashboard, isLoading } = useQuery({

    queryKey: ['choir-leader-dashboard', choirId],

    queryFn:  () => choirSchedulingApi.getLeaderDashboard(choirId),

    enabled:  !!choirId,

  })



  const d = dashboard as Record<string, unknown> | undefined

  const participationTrend = useMemo(

    () => parseParticipationTrend(d?.participationTrend),

    [d?.participationTrend],

  )

  const missingMembers = useMemo(

    () => parseAtRiskMembers(d?.missingMembers),

    [d?.missingMembers],

  )

  const rankingOverview = (d?.rankingOverview ?? []) as Array<{

    rank?: number

    member?: { firstName?: string; lastName?: string }

    score?: number

  }>



  const openMember = (name: string) => {

    router.push(memberRosterHref(choirLink, name))

  }

  const healthScore = useMemo(() => {
    const avg = participationTrend.length
      ? participationTrend.reduce((s, p) => s + p.score, 0) / participationTrend.length
      : 65
    const penalty = Math.min(35, missingMembers.length * 5)
    return Math.round(Math.max(0, Math.min(100, avg - penalty)))
  }, [participationTrend, missingMembers])

  const healthDrivers = useMemo(() => {
    const avg = participationTrend.length
      ? Math.round(participationTrend.reduce((s, p) => s + p.score, 0) / participationTrend.length)
      : 0
    return [
      { id: 'participation', label: 'Avg participation', score: avg, max: 100 },
      { id: 'at-risk', label: 'Member stability', score: Math.max(0, 100 - missingMembers.length * 12), max: 100 },
      { id: 'schedule', label: 'Schedule readiness', score: Math.min(100, Number(d?.upcomingServices ?? 0) * 15 + 40), max: 100 },
    ]
  }, [participationTrend, missingMembers, d])



  return (
    <ChoirInsightsShell
      title="Choir Analytics"
      subtitle="Participation, health, and rankings for your choir."
    >
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {!isLoading && (
          <ChoirHealthScore score={healthScore} drivers={healthDrivers} />
        )}
        <div className="lg:col-span-2">
          <UnifiedAttentionInbox title="Leader attention inbox" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {isLoading ? (

          Array.from({ length: 8 }).map((_, i) => <SkeletonStatTile key={i} />)

        ) : (

          <>

            <StatTile label="Attendance Rate"   value={num(d, 'attendanceRate', 'avgAttendanceRate')} suffix="%" icon={CheckCircle2} animate href={choirLink('reports')} />

            <StatTile label="Reliability"       value={num(d, 'reliability', 'reliabilityScore')} suffix="%" icon={TrendingUp} animate href={choirLink('reports')} />

            <StatTile label="Active Members"    value={num(d, 'activeMembers', 'activeMemberCount', 'totalMembers')} icon={Users} animate href={choirLink('members')} />

            <StatTile label="Inactive Members"  value={num(d, 'inactiveMembers', 'inactiveMemberCount')} icon={Users} animate href={choirLink('members')} />

            <StatTile label="Welfare Alerts"    value={num(d, 'welfareAlerts', 'activeWelfare', 'activeWelfareCases') || arrLen(d, 'welfareCases')} icon={Heart} animate href={choirLink('welfare')} />

            <StatTile label="Discipline Alerts" value={num(d, 'disciplineAlerts', 'activeDiscipline', 'activeDisciplineCases')} icon={Shield} animate href={choirLink('discipline')} />

            <StatTile label="Upcoming Services" value={num(d, 'upcomingServices')} icon={CheckCircle2} animate href={choirLink('scheduling')} />

            <StatTile label="Upcoming Rehearsals" value={num(d, 'upcomingRehearsals')} icon={CheckCircle2} animate href={choirLink('activities')} />

          </>

        )}

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card padding="none">

          <CardHeader className="px-5 pt-5">

            <CardTitle>Participation scores</CardTitle>

            <CardDescription>Top members by overall score — click a bar to open roster</CardDescription>

          </CardHeader>

          {isLoading ? (

            <SkeletonCard rows={4} />

          ) : participationTrend.length === 0 ? (

            <p className="text-center text-text-muted py-8 text-sm">No participation data.</p>

          ) : (

            <ChoirParticipationChart

              data={participationTrend}

              onBarClick={(p) => openMember(p.name)}

            />

          )}

        </Card>



        <AtRiskMembersPanel
          members={missingMembers}
          isLoading={isLoading}
          rosterHref={choirLink('members')}
          onMemberClick={(m) => openMember(m.name)}
        />



        <Card padding="none" className="lg:col-span-2">

          <CardHeader className="px-5 pt-5">

            <CardTitle>Rankings overview</CardTitle>

            <CardDescription>Overall category leaders</CardDescription>

          </CardHeader>

          {isLoading ? (

            <SkeletonCard rows={3} />

          ) : rankingOverview.length === 0 ? (

            <p className="text-center text-text-muted py-8 text-sm">No ranking data.</p>

          ) : (

            <ul className="divide-y divide-border">

              {rankingOverview.map((r, i) => {

                const name = r.member

                  ? `${r.member.firstName ?? ''} ${r.member.lastName ?? ''}`.trim()

                  : 'Member'

                return (

                  <li key={i}>

                    <Link

                      href={memberRosterHref(choirLink, name)}

                      className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors"

                    >

                      <span className="font-display font-bold text-2xl text-text-muted w-8 text-right">

                        {r.rank ?? i + 1}

                      </span>

                      <Avatar name={name} size="sm" />

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-medium text-text-primary">{name}</p>

                      </div>

                      <span className="font-display font-bold text-xl text-gold-700">{r.score ?? 0}</span>

                    </Link>

                  </li>

                )

              })}

            </ul>

          )}

        </Card>

      </div>

    </div>
    </ChoirInsightsShell>
  )
}

