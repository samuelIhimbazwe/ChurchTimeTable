'use client'

import { useQuery } from '@tanstack/react-query'
import { choirSchedulingApi, welfareApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

function hoursLabel(hours: number | null | undefined): string | null {
  if (hours == null) return null
  if (hours < 24) return `${hours}h open`
  const days = Math.floor(hours / 24)
  return `${days}d open`
}

export function CareCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['care-dashboard', choirId],
    queryFn: () => welfareApi.getCareDashboard(),
    enabled: !!choirId,
  })

  const { data: health } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (isLoading) {
    return <SkeletonCard rows={4} />
  }

  const openCases = dashboard?.openCases ?? 0
  const slaBreaches = dashboard?.slaBreaches ?? 0
  const urgentCases = dashboard?.urgentCases ?? 0
  const deskHref = choirLink('care/desk')
  const h = health as Record<string, unknown> | undefined
  const chronicAbsence = Number(h?.chronicAbsenceCount ?? h?.membersAtRisk ?? 0)

  return (
    <OfficeCommandHome
      title="Care command"
      subtitle="Member wellbeing cases, SLA follow-up, and attendance-driven alerts."
      widgets={[
        {
          id: 'cases',
          label: 'Open cases',
          primary: openCases > 0 ? openCases : '✓',
          secondary:
            openCases > 0
              ? `${urgentCases} urgent · ${slaBreaches} SLA breach${slaBreaches === 1 ? '' : 'es'}`
              : 'No active welfare cases',
          cta: openCases > 0 ? 'Open case desk →' : 'Review history →',
          href: deskHref,
          tone: slaBreaches > 0 ? 'warning' : openCases > 0 ? 'default' : 'success',
        },
        {
          id: 'sla',
          label: 'SLA breaches',
          primary: slaBreaches > 0 ? slaBreaches : '✓',
          secondary:
            slaBreaches > 0
              ? hoursLabel(dashboard?.oldestCaseHours)
                ? `Oldest: ${hoursLabel(dashboard?.oldestCaseHours)}`
                : 'Cases past response target'
              : 'All cases within SLA',
          cta: slaBreaches > 0 ? 'Triage now →' : 'Case desk →',
          href: deskHref,
          tone: slaBreaches > 0 ? 'warning' : 'success',
        },
        {
          id: 'attendance',
          label: 'Attendance alerts',
          primary: chronicAbsence > 0 ? chronicAbsence : '—',
          secondary: 'Members with chronic absence patterns',
          cta: 'Care hub →',
          href: choirLink('care'),
        },
      ]}
    />
  )
}
