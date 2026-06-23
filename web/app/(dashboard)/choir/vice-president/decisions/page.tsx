'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { PresidentDecisionConsole } from '@/components/choir/committee/PresidentDecisionConsole'
import { CapabilityGate } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

export function VicePresidentDecisionConsole() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: ctx, isLoading } = useQuery({
    queryKey: ['choir-dashboard-context', choirId],
    queryFn: () => memberPortalApi.getChoirDashboardContext(choirId!),
    enabled: !!choirId,
  })

  const canDecide = ctx?.presidentDelegation?.joinReview === true

  return (
    <>
      <Link
        href={choirLink('vice-president')}
        className="inline-block text-sm font-semibold text-primary-600 hover:underline mb-4"
      >
        ← Back to command
      </Link>
      {!isLoading && !canDecide && (
        <div className="mb-4 rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text-secondary">
          Read-only queue — the president has not delegated join decisions to the vice president.
        </div>
      )}
      <PresidentDecisionConsole
        readOnly={!canDecide}
        readOnlyMessage="Read-only — presidential delegation required to approve or reject."
        actingForPresident={canDecide}
      />
    </>
  )
}

export default function VicePresidentDecisionsPage() {
  return (
    <CapabilityGate
      uiCapability="vice-president-hub"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">You do not have access to vice presidential decisions.</p>
        </div>
      }
    >
    <ChoirPositionHubShell
      roleKey="vice_president"
      subtitle="Review join requests when the president delegates membership decisions."
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <VicePresidentDecisionConsole />
    </ChoirPositionHubShell>
    </CapabilityGate>
  )
}
