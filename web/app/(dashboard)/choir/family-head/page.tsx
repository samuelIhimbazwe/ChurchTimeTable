'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { familiesApi, choirActivityApi, financeApi } from '@/lib/api'
import {
  Card, StatTile, Badge, SkeletonCard, PermissionGate,
} from '@/components/shared'
import { ChoirPositionHubShell, HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { FamilyRankingsPanel } from '@/components/choir/FamilyRankingsPanel'
import { FamilyContributionInboxPanel } from '@/components/choir/FamilyContributionInboxPanel'
import { FamilyPaymentSettingsForm } from '@/components/choir/FamilyPaymentSettingsForm'
import { legacyOrScopedChoirPath } from '@/lib/choir/paths'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'
import { Users, CheckCircle2, Heart, DollarSign, Lock } from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'My team' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'operations', label: 'Operations' },
]

export default function FamilyHeadHubPage() {
  const [tab, setTab] = useState('overview')
  const choirCtx = useOptionalChoirDashboardCtx()
  const scopedChoirId = choirCtx?.choirId
  const choirLink = (...segments: string[]) => legacyOrScopedChoirPath(scopedChoirId, ...segments)

  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: financeApi.getFamilyContributionContext,
  })

  const myFamilyMeta = context?.families?.[0]
  const myFamilyId = myFamilyMeta?.familyId
  const canViewAll = context?.canViewAllFamilies ?? false

  const { data: myFamilyMetrics } = useQuery({
    queryKey: ['family-metrics', myFamilyId],
    queryFn: () => familiesApi.getMetrics(myFamilyId!),
    enabled: !!myFamilyId,
  })

  const { data: familyDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['family-detail', myFamilyId],
    queryFn: () => familiesApi.getById(myFamilyId!),
    enabled: !!myFamilyId && (tab === 'team' || tab === 'overview' || tab === 'contributions'),
  })

  const { data: activities, isLoading: loadingAct } = useQuery({
    queryKey: ['choir-activities-family-head'],
    queryFn: () => choirActivityApi.getAll({ limit: 8 }),
    enabled: tab === 'operations' || tab === 'overview',
  })

  return (
    <ChoirPositionHubShell roleKey="family_head" tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'overview' && (
        <div className="space-y-4">
          <Card padding="md" accent="info">
            <div className="flex items-start gap-3">
              <Lock size={18} className="text-primary-600 shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                You see <strong>your family only</strong> — rankings, contributions, attendance, and
                operations for your team. Other families are hidden unless you hold another leadership role.
              </p>
            </div>
          </Card>

          {loadingContext ? (
            <SkeletonCard rows={3} />
          ) : !myFamilyId ? (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-6">
                No family assigned yet. Contact the Family Coordinator.
              </p>
            </Card>
          ) : (
            <>
              <Card padding="md" accent="gold">
                <p className="font-semibold text-lg">{myFamilyMeta?.familyName ?? familyDetail?.name}</p>
                <p className="text-sm text-text-muted mt-1">
                  Your role: {myFamilyMeta?.role?.replace(/_/g, ' ') ?? 'Family head'}
                  {myFamilyMetrics?.health?.grade && (
                    <> · Health grade <Badge variant="default" className="ml-1">{myFamilyMetrics.health.grade}</Badge></>
                  )}
                </p>
              </Card>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatTile
                  label="Team members"
                  value={myFamilyMetrics?.participation?.activeMembers ?? familyDetail?.memberCount ?? '—'}
                  icon={Users}
                  animate
                />
                <StatTile
                  label="Attendance rate"
                  value={myFamilyMetrics?.attendance?.attendanceRate?.toFixed(0) ?? '—'}
                  suffix={myFamilyMetrics ? '%' : ''}
                  icon={CheckCircle2}
                  animate
                />
                <StatTile
                  label="Confirmed umusanzu"
                  value={
                    myFamilyMetrics?.contributions
                      ? formatCurrency(myFamilyMetrics.contributions.confirmedAmount)
                      : '—'
                  }
                  icon={DollarSign}
                  animate
                />
              </div>
            </>
          )}

          {!canViewAll && (
            <HubQuickLink href={choirLink('welfare')} label="Flag welfare need" desc="Escalate to coordinator" icon={Heart} />
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="space-y-4">
          {loadingDetail || loadingContext ? (
            <SkeletonCard rows={4} />
          ) : !familyDetail ? (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-8">Family not found or not assigned.</p>
            </Card>
          ) : (
            <>
              <Card padding="md">
                <p className="font-semibold">{familyDetail.name}</p>
                <p className="text-sm text-text-muted mt-1">
                  Head: {familyDetail.headName} · {familyDetail.memberCount} members
                </p>
              </Card>
              {Array.isArray(familyDetail.members) && familyDetail.members.length > 0 ? (
                <ul className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
                  {(familyDetail.members as Array<{ member?: { firstName?: string; lastName?: string }; role?: string }>).map((m, i) => (
                    <li key={i} className="px-4 py-3 text-sm flex justify-between gap-2">
                      <span>
                        {m.member?.firstName} {m.member?.lastName}
                      </span>
                      <Badge variant="default">{String(m.role ?? 'MEMBER').replace(/_/g, ' ')}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <Card padding="md">
                  <p className="text-sm text-text-secondary">
                    Member roster loads from your family record. Contact the coordinator if the list is empty.
                  </p>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'rankings' && (
        myFamilyId ? (
          <FamilyRankingsPanel familyId={myFamilyId} showOverview={false} />
        ) : (
          <Card padding="md"><p className="text-sm text-text-muted text-center py-8">No family assigned.</p></Card>
        )
      )}

      {tab === 'contributions' && (
        <div className="space-y-4">
          {myFamilyId && familyDetail && (
            <FamilyPaymentSettingsForm
              familyId={myFamilyId}
              initial={{
                paymentMomoNumber: (familyDetail as Record<string, unknown>).paymentMomoNumber as string | null,
                paymentMomoAccountName: (familyDetail as Record<string, unknown>).paymentMomoAccountName as string | null,
                paymentBankAccount: (familyDetail as Record<string, unknown>).paymentBankAccount as string | null,
                paymentBankName: (familyDetail as Record<string, unknown>).paymentBankName as string | null,
                paymentInstructions: (familyDetail as Record<string, unknown>).paymentInstructions as string | null,
              }}
            />
          )}
          {myFamilyMetrics?.contributions && (
            <Card padding="md">
              <p className="font-semibold mb-2">Your family contributions</p>
              <p className="text-sm">
                Confirmed: {formatCurrency(myFamilyMetrics.contributions.confirmedAmount)}
              </p>
              <p className="text-sm text-text-muted">
                Pending: {formatCurrency(myFamilyMetrics.contributions.pendingAmount)}
              </p>
            </Card>
          )}
          <FamilyContributionInboxPanel familyId={myFamilyId} />
        </div>
      )}

      {tab === 'operations' && (
        <div className="space-y-4">
          <Card padding="md">
            <p className="font-semibold mb-2">Activities your team attends</p>
            <p className="text-sm text-text-secondary mb-3">
              Mark attendance for your family members at each event.
            </p>
          </Card>
          {loadingAct ? (
            <SkeletonCard rows={4} />
          ) : (
            <ul className="space-y-3">
              {(activities?.items ?? []).slice(0, 6).map((a) => (
                <Card key={a.id} padding="md">
                  <div className="flex justify-between gap-3 items-center">
                    <div>
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {formatDate(a.date)}
                        {a.startTime ? ` · ${formatTime(a.startTime)}` : ''}
                      </p>
                    </div>
                    <PermissionGate anyOf={['attendance.mark', 'attendance:write']}>
                      <Link href={choirLink('attendance', a.id)} className="text-xs font-semibold text-primary-600 shrink-0">
                        Mark team →
                      </Link>
                    </PermissionGate>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </div>
      )}
    </ChoirPositionHubShell>
  )
}
