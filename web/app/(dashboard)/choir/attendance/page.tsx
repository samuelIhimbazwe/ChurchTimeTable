'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirActivityApi, choirSchedulingApi } from '@/lib/api'
import {
  AccessRedirectGate,
  Badge,
  Card,
  CapabilityGate,
  SkeletonCard,
  StatTile,
} from '@/components/shared'
import { ChoirOpsShell } from '@/components/choir/ChoirOpsShell'
import { useResolvedChoirScope } from '@/lib/hooks'
import { CalendarCheck, ClipboardList, Plus, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

function monthBounds(now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

export default function AttendanceHubPage() {
  const { choirId, choirLink } = useResolvedChoirScope()
  const { from, to } = monthBounds()

  const { data: monthActivities, isLoading } = useQuery({
    queryKey: ['choir-attendance-month', choirId, from, to],
    queryFn: () => choirActivityApi.getAll({ choirId, from, to, limit: 100 }),
    enabled: !!choirId,
  })

  const { data: history } = useQuery({
    queryKey: ['choir-attendance-history', choirId],
    queryFn: () => choirActivityApi.getAll({ choirId, limit: 40 }),
    enabled: !!choirId,
  })

  const { data: leaderDash } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })

  const monthItems = monthActivities?.items ?? []
  const recordedThisMonth = monthItems.filter((a) => (a.attendanceCount ?? 0) > 0)
  const markedRows = recordedThisMonth.reduce((sum, a) => sum + (a.attendanceCount ?? 0), 0)
  const rosterSize = Math.max(
    ...monthItems.map((a) => a.memberCount ?? 0),
    ...(history?.items ?? []).map((a) => a.memberCount ?? 0),
    0,
  )
  const expectedMarks = recordedThisMonth.length * (rosterSize || 1)
  const monthRate =
    expectedMarks > 0 ? Math.round((markedRows / expectedMarks) * 100) : 0

  const h = leaderDash as Record<string, unknown> | undefined
  const atRisk = (h?.missingMembers as unknown[] | undefined)?.length ?? 0

  const historyItems = useMemo(() => {
    return (history?.items ?? [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)
  }, [history?.items])

  return (
    <AccessRedirectGate uiCapability="ops-attendance-view">
      <ChoirOpsShell
        title="Attendance"
        subtitle="History, this month’s rate, and take attendance for any choir event."
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              Mark presence against the full roster for services and rehearsals.
            </p>
            <CapabilityGate uiCapability="ops-attendance-manage">
              <Link
                href={choirLink('attendance/new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gold-600 text-primary-950 hover:bg-gold-500"
              >
                <Plus size={16} /> New attendance
              </Link>
            </CapabilityGate>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              label="This month attendance"
              value={monthRate}
              suffix="%"
              icon={CalendarCheck}
              animate
            />
            <StatTile
              label="Sessions recorded"
              value={recordedThisMonth.length}
              icon={ClipboardList}
              animate
            />
            <StatTile
              label="Marks this month"
              value={markedRows}
              icon={Users}
              animate
            />
            <StatTile
              label="At-risk members"
              value={atRisk}
              icon={Users}
              animate
              href={choirLink('analytics')}
            />
          </div>

          <Card padding="md">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-text-primary">Attendance history</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Recent events — open any session to review or continue marking
                </p>
              </div>
            </div>

            {isLoading ? (
              <SkeletonCard rows={5} />
            ) : historyItems.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardList size={28} className="mx-auto text-text-muted mb-2" />
                <p className="text-sm text-text-muted mb-4">No attendance sessions yet.</p>
                <CapabilityGate uiCapability="ops-attendance-manage">
                  <Link
                    href={choirLink('attendance/new')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white"
                  >
                    <Plus size={16} /> Take first attendance
                  </Link>
                </CapabilityGate>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {historyItems.map((a) => {
                  const marked = a.attendanceCount ?? 0
                  const total = a.memberCount ?? 0
                  return (
                    <li key={a.id}>
                      <Link
                        href={choirLink('attendance', a.id)}
                        className="flex items-center justify-between gap-3 py-3 hover:bg-surface-raised px-1 -mx-1 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {a.title}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {formatDate(a.date)}
                            {a.location ? ` · ${a.location}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="default">
                            {a.activityType.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs font-semibold text-primary-600">
                            {total > 0 ? `${marked}/${total}` : marked > 0 ? `${marked} marked` : 'Take →'}
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </ChoirOpsShell>
    </AccessRedirectGate>
  )
}
