'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirSchedulingApi, financeApi, memberPortalApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { memberOnboardingHref } from '@/lib/choir/membership-intake'

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function VicePresidentCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: ctx } = useQuery({
    queryKey: ['choir-dashboard-context', choirId],
    queryFn: () => memberPortalApi.getChoirDashboardContext(choirId!),
    enabled: !!choirId,
  })

  const { data: health, isPending: loadingHealth } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })

  const { data: analytics } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn: () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

  const delegation = ctx?.presidentDelegation
  const h = health as Record<string, unknown> | undefined
  const a = analytics as Record<string, unknown> | undefined
  const attendance = num(h?.attendanceRate ?? h?.avgAttendanceRate)
  const campaignPct = num(a?.collectionRate ?? a?.participationRate)
  const onboardingHref = memberOnboardingHref(choirLink)

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (loadingHealth) {
    return <SkeletonCard rows={4} />
  }

  return (
    <div className="space-y-6">
      {delegation?.outOfOffice && (
        <Card padding="md" accent="warning">
          <p className="text-sm font-semibold text-text-primary">Acting for president</p>
          <p className="text-xs text-text-muted mt-1">
            President is out of office — support operations and escalate care or treasury items as needed.
          </p>
        </Card>
      )}

      <OfficeCommandHome
        title="Vice president command"
        subtitle="Choir health, onboarding support, and executive follow-up."
        widgets={[
          {
            id: 'onboarding',
            label: 'Member onboarding',
            primary: 'Admin',
            secondary: 'Singers are provisioned by admin — no join queue',
            cta: 'Open onboarding →',
            href: onboardingHref,
          },
          {
            id: 'health',
            label: 'Choir health',
            primary: attendance > 0 ? `${attendance}%` : '—',
            secondary:
              campaignPct > 0
                ? `Campaign ${campaignPct}% · finance view-only`
                : 'Attendance and stewardship summary',
            cta: 'View reports →',
            href: choirLink('reports'),
          },
          {
            id: 'followup',
            label: 'Executive follow-up',
            primary: delegation?.outOfOffice ? 'OOO' : 'On duty',
            secondary: delegation?.outOfOffice
              ? 'President away — monitor officer queues'
              : 'President on duty',
            cta: 'Governance hub →',
            href: choirLink('vice-president'),
          },
        ]}
      />

      <Card padding="md">
        <p className="text-sm text-text-secondary">
          New members are added through{' '}
          <Link href={onboardingHref} className="text-primary-600 font-semibold hover:underline">
            member onboarding
          </Link>
          , not self-serve join requests.
        </p>
      </Card>
    </div>
  )
}
