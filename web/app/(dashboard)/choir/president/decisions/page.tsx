'use client'

import Link from 'next/link'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { PresidentDecisionConsole } from '@/components/choir/committee/PresidentDecisionConsole'
import { CapabilityGate } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

export default function PresidentDecisionsPage() {
  const { choirLink } = useResolvedChoirScope()

  return (
    <CapabilityGate
      uiCapability="president-hub"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">You do not have access to presidential decisions.</p>
        </div>
      }
    >
    <ChoirPositionHubShell
      roleKey="president"
      subtitle="Review join requests in one place — approve, send requirements, or reject."
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <Link
        href={choirLink('president')}
        className="inline-block text-sm font-semibold text-primary-600 hover:underline mb-4"
      >
        ← Back to command
      </Link>
      <PresidentDecisionConsole />
    </ChoirPositionHubShell>
    </CapabilityGate>
  )
}
