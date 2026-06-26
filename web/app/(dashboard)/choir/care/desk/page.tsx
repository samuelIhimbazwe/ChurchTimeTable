'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { welfareApi } from '@/lib/api'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { CareCaseConsole } from '@/components/choir/committee/CareCaseConsole'
import { CapabilityGate } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

export default function CareDeskPage() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: dashboard } = useQuery({
    queryKey: ['care-dashboard', choirId],
    queryFn: () => welfareApi.getCareDashboard(),
    enabled: !!choirId,
  })

  const breaches = dashboard?.slaBreaches ?? 0

  return (
    <CapabilityGate
      uiCapability="welfare-care-inbox"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">Care desk access required.</p>
        </div>
      }
    >
    <ChoirPositionHubShell
      roleKey="discipline_social_welfare"
      subtitle="Triage member care cases with SLA tracking and confidential follow-up."
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <Link
        href={choirLink('care')}
        className="inline-block text-sm font-semibold text-primary-600 hover:underline mb-4"
      >
        ← Back to care command
      </Link>
      {breaches > 0 && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm text-warning">
          {breaches} case{breaches === 1 ? '' : 's'} past SLA — prioritize triage today.
        </div>
      )}
      <CareCaseConsole />
    </ChoirPositionHubShell>
    </CapabilityGate>
  )
}
