'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  Calendar,
  Download,
  FileText,
  Heart,
  RefreshCw,
  Shield,
  Trophy,
  Users,
} from 'lucide-react'
import { protocolApi } from '@/lib/api'
import {
  Badge,
  CapabilityGate,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  HubTabs,
  SkeletonCard,
  SkeletonStatTile,
  StatTile,
  type DataTableColumn,
} from '@/components/shared'
import { ProtocolHealthCharts } from '@/components/protocol/ProtocolHealthCharts'
import { ProtocolOfficerSlaPanel } from '@/components/protocol/ProtocolOfficerSlaPanel'
import {
  ProtocolTeamReportForm,
  teamReportOptionsFromDashboard,
} from '@/components/protocol/ProtocolTeamReportForm'
import { formatDate } from '@/lib/utils/format'
import {
  PROTOCOL_REPORT_TABS,
  type ProtocolAttendanceReport,
  type ProtocolMonthlyServiceReport,
  type ProtocolQuotaReport,
  type ProtocolReplacementReport,
  type ProtocolReliabilityReport,
  type ProtocolReportTabId,
  type ProtocolSchedulingReport,
} from '@/lib/protocol/report-types'
import {
  ProtocolReportMonthPicker,
  formatReportPeriod,
} from './ProtocolReportMonthPicker'
import {
  ProtocolReportExportBar,
  downloadHealthPackPdf,
} from './ProtocolReportExportBar'

function healthBadgeVariant(grade?: string) {
  if (grade === 'A' || grade === 'B') return 'status-active' as const
  if (grade === 'C') return 'status-pending' as const
  return 'status-inactive' as const
}

function statusBadge(status: string) {
  if (status === 'PUBLISHED' || status === 'APPROVED' || status === 'COMPLETED') {
    return 'status-active' as const
  }
  if (status === 'PENDING' || status === 'GENERATED' || status === 'REVIEWED') {
    return 'status-pending' as const
  }
  if (status === 'REJECTED') return 'status-inactive' as const
  return 'role-member' as const
}

export function ProtocolReportsHub() {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tab, setTab] = useState<ProtocolReportTabId>('overview')
  const [showForm, setShowForm] = useState(false)
  const [drillDown, setDrillDown] = useState<string | null>(null)

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['protocol-report-summary', year, month],
    queryFn: () => protocolApi.getReportSummary(year, month),
  })

  const { data: monthlyService, isLoading: loadingServices } = useQuery({
    queryKey: ['protocol-monthly-service-report', year, month],
    queryFn: () => protocolApi.getMonthlyServiceReport(year, month),
    enabled: tab === 'services' || tab === 'overview',
  })

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['protocol-attendance-report', year, month],
    queryFn: () => protocolApi.getAttendanceReport(year, month),
    enabled: tab === 'attendance',
  })

  const { data: replacements, isLoading: loadingReplacements } = useQuery({
    queryKey: ['protocol-replacement-report', year, month],
    queryFn: () => protocolApi.getReplacementReport(year, month),
    enabled: tab === 'replacements' || tab === 'overview',
  })

  const { data: reliability, isLoading: loadingReliability } = useQuery({
    queryKey: ['protocol-reliability-report'],
    queryFn: () => protocolApi.getReliabilityReport(),
    enabled: tab === 'reliability',
  })

  const { data: scheduling, isLoading: loadingScheduling } = useQuery({
    queryKey: ['protocol-scheduling-report', year, month],
    queryFn: () => protocolApi.getSchedulingReport(year, month),
    enabled: tab === 'scheduling' || tab === 'overview',
  })

  const { data: quota, isLoading: loadingQuota } = useQuery({
    queryKey: ['protocol-quota-report', year, month],
    queryFn: () => protocolApi.getQuotaReport(year, month),
    enabled: tab === 'quota',
  })

  const { data: narratives, isLoading: loadingNarratives } = useQuery({
    queryKey: ['protocol-team-narratives'],
    queryFn: protocolApi.getReports,
    enabled: tab === 'narratives',
  })

  const { data: leaderDash } = useQuery({
    queryKey: ['protocol-team-leader-dashboard'],
    queryFn: protocolApi.getTeamLeaderDashboard,
    retry: false,
  })

  const { data: allTeams } = useQuery({
    queryKey: ['protocol-teams'],
    queryFn: () => protocolApi.listTeams(),
    retry: false,
  })

  const ledTeams = ((leaderDash as Record<string, unknown> | undefined)?.teams ?? []) as Array<{
    id: string
    occurrence?: { title?: string; startAt?: string }
  }>
  const teamOptions = ledTeams.length > 0
    ? teamReportOptionsFromDashboard(ledTeams)
    : teamReportOptionsFromDashboard(
        ((allTeams ?? []) as Array<{ id: string; occurrence?: { title?: string; startAt?: string } }>),
      )

  const health = summary?.health

  const serviceColumns = useMemo<DataTableColumn<ProtocolMonthlyServiceReport['teams'][number]>>(
    () => [
      {
        id: 'occurrence',
        header: 'Service',
        accessorFn: (row) => row.occurrenceTitle,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-text-primary">{row.original.occurrenceTitle}</p>
            <p className="text-xs text-text-muted">{formatDate(row.original.startAt)}</p>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Team status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <Badge variant={statusBadge(row.original.status)} dot>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'roster',
        header: 'Roster',
        accessorFn: (row) => row.memberCount,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.attended}/{row.original.memberCount}
          </span>
        ),
      },
    ],
    [],
  )

  const attendanceColumns = useMemo<DataTableColumn<ProtocolAttendanceReport['rows'][number]>>(
    () => [
      {
        id: 'member',
        header: 'Member',
        accessorFn: (row) => `${row.member.firstName} ${row.member.lastName}`,
      },
      { id: 'assigned', header: 'Assigned', accessorKey: 'assigned' },
      { id: 'attended', header: 'Attended', accessorKey: 'attended' },
      {
        id: 'rate',
        header: 'Rate %',
        accessorKey: 'attendanceRate',
        cell: ({ row }) => <span className="tabular-nums">{row.original.attendanceRate}%</span>,
      },
      { id: 'late', header: 'Late', accessorKey: 'lateArrivals' },
      { id: 'unexcused', header: 'Unexcused', accessorKey: 'unexcusedAbsences' },
    ],
    [],
  )

  const replacementColumns = useMemo<DataTableColumn<ProtocolReplacementReport['rows'][number]>>(
    () => [
      {
        id: 'date',
        header: 'Requested',
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <Badge variant={statusBadge(row.original.status)} dot>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'original',
        header: 'Original',
        accessorFn: (row) =>
          `${row.originalMember.firstName} ${row.originalMember.lastName}`,
      },
      {
        id: 'replacement',
        header: 'Replacement',
        accessorFn: (row) =>
          `${row.replacementMember.firstName} ${row.replacementMember.lastName}`,
      },
      {
        id: 'occurrence',
        header: 'Service',
        accessorFn: (row) => row.occurrenceTitle ?? '—',
      },
    ],
    [],
  )

  const reliabilityColumns = useMemo<DataTableColumn<ProtocolReliabilityReport['rows'][number]>>(
    () => [
      {
        id: 'member',
        header: 'Member',
        accessorFn: (row) => `${row.member.firstName} ${row.member.lastName}`,
      },
      { id: 'score', header: 'Reliability', accessorKey: 'reliabilityScore' },
      {
        id: 'rate',
        header: 'Attendance %',
        accessorKey: 'attendanceRate',
        cell: ({ row }) => <span className="tabular-nums">{row.original.attendanceRate}%</span>,
      },
      { id: 'services', header: 'Services', accessorKey: 'attendedCount' },
      { id: 'replacements', header: 'Cover-ups', accessorKey: 'replacementServices' },
      { id: 'unexcused', header: 'Unexcused', accessorKey: 'unexcusedAbsences' },
    ],
    [],
  )

  const quotaColumns = useMemo<DataTableColumn<ProtocolQuotaReport['rows'][number]>>(
    () => [
      { id: 'name', header: 'Member', accessorKey: 'name' },
      {
        id: 'count',
        header: 'Assignments',
        accessorKey: 'assignmentsThisMonth',
        cell: ({ row }) => (
          <span className={row.original.compliant ? '' : 'text-danger font-semibold'}>
            {row.original.assignmentsThisMonth}
          </span>
        ),
      },
      { id: 'max', header: 'Max', accessorKey: 'maxAllowed' },
      {
        id: 'ok',
        header: 'Compliant',
        accessorFn: (row) => (row.compliant ? 'Yes' : 'No'),
        cell: ({ row }) => (
          <Badge variant={row.original.compliant ? 'status-active' : 'status-inactive'} dot>
            {row.original.compliant ? 'Yes' : 'Over cap'}
          </Badge>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Protocol Reports</h2>
          <p className="text-text-secondary text-sm mt-1 max-w-2xl">
            Ministry analytics for scheduling, service delivery, attendance, replacements,
            quota compliance, and leadership oversight.
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <ProtocolReportMonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y)
              setMonth(m)
            }}
          />
          <CapabilityGate platformUiCapability="protocol-report">
            <button
              type="button"
              onClick={() => downloadHealthPackPdf(year, month)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
            >
              <Download size={15} />
              Full ministry report PDF
            </button>
          </CapabilityGate>
        </div>
      </div>

      <HubTabs
        tabs={PROTOCOL_REPORT_TABS.map((t) => ({ id: t.id, label: t.label }))}
        active={tab}
        onChange={(id) => setTab(id as ProtocolReportTabId)}
      />

      {tab === 'overview' && (
        <CapabilityGate platformUiCapability="protocol-report">
          <div className="space-y-6">
            {loadingSummary ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonStatTile key={i} />
                ))}
              </div>
            ) : summary && health ? (
              <>
                <p className="text-sm text-text-muted">
                  Executive summary for {formatReportPeriod(year, month)}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatTile
                    label="Health score"
                    value={health.score}
                    suffix={` (${health.grade})`}
                    icon={Activity}
                    animate
                  />
                  <StatTile
                    label="Services"
                    value={summary.monthlyService.serviceCount}
                    icon={Calendar}
                    animate
                  />
                  <StatTile
                    label="Attendance rate"
                    value={summary.monthlyService.attendanceRate}
                    suffix="%"
                    icon={Heart}
                    animate
                  />
                  <StatTile
                    label="Teams published"
                    value={summary.scheduling.publishedTeams}
                    icon={Shield}
                    animate
                  />
                  <StatTile
                    label="Active members"
                    value={health.activeMembers}
                    icon={Users}
                    animate
                  />
                  <StatTile
                    label="Replacements"
                    value={summary.replacements.total}
                    icon={RefreshCw}
                    animate
                  />
                  <StatTile
                    label="Quota violations"
                    value={summary.quota.violationCount}
                    icon={Trophy}
                    animate
                  />
                  <StatTile
                    label="Team narratives"
                    value={summary.teamReportsCount}
                    icon={FileText}
                    animate
                  />
                </div>

                <ProtocolHealthCharts
                  health={health}
                  onDrillDown={(metric) => setDrillDown(metric)}
                />

                {drillDown && (
                  <Card padding="md" accent="info">
                    <p className="text-sm font-semibold capitalize">{drillDown} drill-down</p>
                    <p className="text-sm text-text-secondary mt-1">
                      {drillDown === 'attendance' && `Average attendance: ${health.attendanceRateAvg}%`}
                      {drillDown === 'members' && `Active protocol members: ${health.activeMembers}`}
                      {drillDown === 'claims' && `Pending claims: ${health.pendingClaims}`}
                      {drillDown === 'replacements' && `Pending replacements: ${health.pendingReplacements}`}
                      {drillDown === 'teams' && `Draft teams in queue: ${health.draftTeams}`}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setDrillDown(null)}
                        className="text-xs font-semibold text-text-muted"
                      >
                        Close
                      </button>
                      {drillDown === 'claims' && (
                        <button
                          type="button"
                          onClick={() => router.push('/protocol/claims')}
                          className="text-xs font-semibold text-primary-600"
                        >
                          Open claims →
                        </button>
                      )}
                      {drillDown === 'replacements' && (
                        <button
                          type="button"
                          onClick={() => router.push('/protocol/replacements')}
                          className="text-xs font-semibold text-primary-600"
                        >
                          Open replacements →
                        </button>
                      )}
                      {drillDown === 'teams' && (
                        <button
                          type="button"
                          onClick={() => router.push('/protocol/teams')}
                          className="text-xs font-semibold text-primary-600"
                        >
                          Open teams →
                        </button>
                      )}
                    </div>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <Card padding="md">
                    <CardHeader>
                      <CardTitle>Scheduling pipeline</CardTitle>
                      <CardDescription>
                        Choir timetable and protocol team readiness for the month.
                      </CardDescription>
                    </CardHeader>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-text-muted">Monthly plan</dt>
                        <dd className="font-semibold">
                          {scheduling?.plan?.status ?? 'Not generated'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-text-muted">Choir slots</dt>
                        <dd className="font-semibold">{scheduling?.plan?.entryCount ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-text-muted">Teams built</dt>
                        <dd className="font-semibold">{scheduling?.totalTeams ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-text-muted">Published</dt>
                        <dd className="font-semibold">{scheduling?.publishedTeams ?? 0}</dd>
                      </div>
                    </dl>
                    <Link
                      href="/protocol/scheduling"
                      className="inline-block mt-4 text-xs font-semibold text-primary-600"
                    >
                      Open scheduling desk →
                    </Link>
                  </Card>

                  <Card padding="md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Ministry health
                        <Badge variant={healthBadgeVariant(health.grade)} dot>
                          Grade {health.grade}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Backlog penalty {health.factors.backlogPenalty} · Officer penalty{' '}
                        {health.factors.officerAttentionPenalty}
                      </CardDescription>
                    </CardHeader>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-text-muted">Open claims</dt>
                        <dd className="font-semibold">{health.pendingClaims}</dd>
                      </div>
                      <div>
                        <dt className="text-text-muted">Open replacements</dt>
                        <dd className="font-semibold">{health.pendingReplacements}</dd>
                      </div>
                      <div>
                        <dt className="text-text-muted">Draft teams</dt>
                        <dd className="font-semibold">{health.draftTeams}</dd>
                      </div>
                      <div>
                        <dt className="text-text-muted">Officer attention</dt>
                        <dd className="font-semibold">{health.officerAttentionCount ?? 0}</dd>
                      </div>
                    </dl>
                  </Card>
                </div>

                <ProtocolOfficerSlaPanel />
              </>
            ) : null}
          </div>
        </CapabilityGate>
      )}

      {tab === 'scheduling' && (
        <CapabilityGate platformUiCapability="protocol-report">
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <CardTitle>Monthly scheduling report</CardTitle>
              <CardDescription>
                Choir assignment plan and protocol team build status for {formatReportPeriod(year, month)}.
              </CardDescription>
            </CardHeader>
            {loadingScheduling ? (
              <SkeletonCard rows={4} />
            ) : scheduling ? (
              <>
                <SchedulingSummary data={scheduling} />
                <ProtocolReportExportBar year={year} month={month} types={['scheduling']} />
              </>
            ) : null}
          </Card>
        </CapabilityGate>
      )}

      {tab === 'services' && (
        <CapabilityGate platformUiCapability="protocol-report">
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <CardTitle>Service delivery report</CardTitle>
              <CardDescription>
                Per-service protocol teams, roster size, and attendance outcomes.
              </CardDescription>
            </CardHeader>
            {loadingServices ? (
              <SkeletonCard rows={6} />
            ) : monthlyService ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-text-muted">Services</p>
                    <p className="text-xl font-bold tabular-nums">{monthlyService.serviceCount}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-text-muted">Roster slots</p>
                    <p className="text-xl font-bold tabular-nums">{monthlyService.rosterSlots}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-text-muted">Attended</p>
                    <p className="text-xl font-bold tabular-nums">{monthlyService.attended}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-text-muted">Rate</p>
                    <p className="text-xl font-bold tabular-nums">{monthlyService.attendanceRate}%</p>
                  </div>
                </div>
                <DataTable
                  data={monthlyService.teams}
                  columns={serviceColumns}
                  pagination={{ pageSize: 10 }}
                  emptyMessage="No protocol teams for this month yet."
                />
                <ProtocolReportExportBar year={year} month={month} types={['monthly-service']} />
              </>
            ) : null}
          </Card>
        </CapabilityGate>
      )}

      {tab === 'attendance' && (
        <CapabilityGate platformUiCapability="protocol-report">
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <CardTitle>Member attendance report</CardTitle>
              <CardDescription>
                Monthly member profiles — assigned vs attended, punctuality, and absences.
              </CardDescription>
            </CardHeader>
            {loadingAttendance ? (
              <SkeletonCard rows={6} />
            ) : attendance ? (
              <>
                <p className="text-sm text-text-secondary">
                  {attendance.rowCount} members · average {attendance.avgAttendanceRate}% attendance
                </p>
                <DataTable
                  data={attendance.rows}
                  columns={attendanceColumns}
                  pagination={{ pageSize: 15 }}
                  emptyMessage="No attendance profiles for this month."
                />
                <ProtocolReportExportBar year={year} month={month} types={['attendance']} />
              </>
            ) : null}
          </Card>
        </CapabilityGate>
      )}

      {tab === 'replacements' && (
        <CapabilityGate platformUiCapability="protocol-report">
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <CardTitle>Replacement activity</CardTitle>
              <CardDescription>
                Self-found substitutions requested and reviewed during the month.
              </CardDescription>
            </CardHeader>
            {loadingReplacements ? (
              <SkeletonCard rows={5} />
            ) : replacements ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="role-member">{replacements.total} total</Badge>
                  <Badge variant="status-pending">{replacements.pending} pending</Badge>
                  <Badge variant="status-active">{replacements.approved} approved</Badge>
                  <Badge variant="status-inactive">{replacements.rejected} rejected</Badge>
                </div>
                <DataTable
                  data={replacements.rows}
                  columns={replacementColumns}
                  pagination={{ pageSize: 15 }}
                  emptyMessage="No replacement requests this month."
                />
                <ProtocolReportExportBar year={year} month={month} types={['replacements']} />
              </>
            ) : null}
          </Card>
        </CapabilityGate>
      )}

      {tab === 'reliability' && (
        <CapabilityGate platformUiCapability="protocol-report">
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <CardTitle>Reliability standings</CardTitle>
              <CardDescription>
                Lifetime reliability scores across all active protocol members.
              </CardDescription>
            </CardHeader>
            {loadingReliability ? (
              <SkeletonCard rows={6} />
            ) : reliability ? (
              <>
                <p className="text-sm text-text-secondary">{reliability.rowCount} active members</p>
                <DataTable
                  data={reliability.rows}
                  columns={reliabilityColumns}
                  pagination={{ pageSize: 15 }}
                  emptyMessage="No reliability data yet."
                />
                <ProtocolReportExportBar year={year} month={month} types={['reliability']} />
                <Link
                  href="/protocol/rankings"
                  className="inline-block text-xs font-semibold text-primary-600"
                >
                  Open monthly rankings →
                </Link>
              </>
            ) : null}
          </Card>
        </CapabilityGate>
      )}

      {tab === 'quota' && (
        <CapabilityGate platformUiCapability="protocol-report">
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <CardTitle>Monthly quota compliance</CardTitle>
              <CardDescription>
                Official protocol assignments per member (three-service rule).
              </CardDescription>
            </CardHeader>
            {loadingQuota ? (
              <SkeletonCard rows={6} />
            ) : quota ? (
              <>
                <p className="text-sm text-text-secondary">
                  Max {quota.maxPerMonth} official services · {quota.violationCount} over cap
                </p>
                <DataTable
                  data={quota.rows}
                  columns={quotaColumns}
                  pagination={{ pageSize: 15 }}
                  emptyMessage="No protocol members found."
                />
                <ProtocolReportExportBar year={year} month={month} types={['quota']} />
              </>
            ) : null}
          </Card>
        </CapabilityGate>
      )}

      {tab === 'narratives' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl text-text-primary">Team leader narratives</h3>
              <p className="text-text-secondary text-sm mt-1">
                Post-service summaries submitted by team heads
              </p>
            </div>
            <CapabilityGate platformUiCapability="protocol-report-team-ops">
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
              >
                {showForm ? 'Cancel' : '+ Submit report'}
              </button>
            </CapabilityGate>
          </div>

          {showForm && (
            <ProtocolTeamReportForm
              teams={teamOptions}
              onSuccess={() => setShowForm(false)}
            />
          )}

          {loadingNarratives ? (
            <SkeletonCard rows={4} />
          ) : !narratives?.length ? (
            <Card padding="md">
              <div className="text-center py-12">
                <FileText size={32} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No team reports submitted yet.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {(narratives as Record<string, unknown>[]).map((r, i) => {
                const team = r.team as Record<string, unknown> | undefined
                const occurrence = team?.occurrence as { title?: string } | undefined
                return (
                  <Card key={String(r.id ?? i)} padding="md">
                    <div>
                      {occurrence?.title && (
                        <p className="text-xs font-semibold text-primary-600 mb-1">
                          {occurrence.title}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-text-primary">
                        {String(r.summary ?? 'Report').slice(0, 200)}
                        {String(r.summary ?? '').length > 200 ? '…' : ''}
                      </p>
                      {r.issues != null && String(r.issues).trim() && (
                        <p className="text-sm text-text-secondary mt-1">
                          Issues: {String(r.issues)}
                        </p>
                      )}
                      {r.recommendations != null && String(r.recommendations).trim() && (
                        <p className="text-sm text-text-secondary mt-1">
                          Recommendations: {String(r.recommendations)}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-2">
                        {r.submittedAt != null && formatDate(String(r.submittedAt))}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SchedulingSummary({ data }: { data: ProtocolSchedulingReport }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-md border border-border p-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            Choir monthly plan
          </p>
          {data.plan ? (
            <>
              <p className="font-semibold text-text-primary">{data.plan.label}</p>
              <p className="text-sm text-text-secondary mt-1">
                Status: <Badge variant={statusBadge(data.plan.status)}>{data.plan.status}</Badge>
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {data.plan.entryCount} choir assignment rows
              </p>
              {data.plan.publishedAt && (
                <p className="text-xs text-text-muted mt-2">
                  Published {formatDate(data.plan.publishedAt)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-text-muted">No plan generated for this month.</p>
          )}
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            Protocol teams
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Church occurrences</dt>
              <dd className="font-semibold tabular-nums">{data.occurrencesInMonth}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Teams built</dt>
              <dd className="font-semibold tabular-nums">{data.totalTeams}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Published</dt>
              <dd className="font-semibold tabular-nums">{data.publishedTeams}</dd>
            </div>
          </dl>
          {Object.keys(data.teamsByStatus).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(data.teamsByStatus).map(([status, count]) => (
                <Badge key={status} variant={statusBadge(status)}>
                  {status}: {count}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
