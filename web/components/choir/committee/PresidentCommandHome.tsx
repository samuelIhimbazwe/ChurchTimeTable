'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirSchedulingApi, financeApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { memberOnboardingHref } from '@/lib/choir/membership-intake'

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function PresidentCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()
  const onboardingHref = memberOnboardingHref(choirLink)

  const { data: health, isPending: loadingHealth } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })

  const { data: analytics } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn: () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

  const h = health as Record<string, unknown> | undefined
  const a = analytics as Record<string, unknown> | undefined
  const attendance = num(h?.attendanceRate ?? h?.avgAttendanceRate)
  const campaignPct = num(a?.collectionRate ?? a?.participationRate)

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
      <OfficeCommandHome
        title="Executive command"
        subtitle="Choir health, member onboarding, and stewardship overview."
        widgets={[
          {
            id: 'onboarding',
            label: 'Member onboarding',
            primary: 'Admin',
            secondary: 'Provision singers and invite officers — no self-serve join queue',
            cta: 'Open onboarding →',
            href: onboardingHref,
          },
          {
            id: 'attendance',
            label: 'Service attendance',
            primary: attendance > 0 ? `${attendance}%` : '—',
            secondary: 'Choir-wide worship attendance trend',
            cta: 'Attendance reports →',
            href: choirLink('reports'),
          },
          {
            id: 'health',
            label: 'Giving on track',
            primary: campaignPct > 0 ? `${campaignPct}%` : '—',
            secondary:
              campaignPct > 0
                ? `Campaign participation · treasurer verifies`
                : 'Stewardship summary read-only',
            cta: 'View stewardship →',
            href: choirLink('stewardship'),
          },
        ]}
      />

      <Card padding="md">
        <p className="text-sm text-text-secondary">
          New singers are added through{' '}
          <Link href={onboardingHref} className="text-primary-600 font-semibold hover:underline">
            member onboarding
          </Link>
          . Sponsors are invited from{' '}
          <Link href={choirLink('join-requests')} className="text-primary-600 font-semibold hover:underline">
            Sponsors
          </Link>
          .
        </p>
      </Card>
    </div>
  )
}
