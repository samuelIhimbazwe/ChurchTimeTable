'use client'

import Link from 'next/link'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { PresidentDecisionConsole } from '@/components/choir/committee/PresidentDecisionConsole'
import { useResolvedChoirScope } from '@/lib/hooks'

export default function PresidentDecisionsPage() {
  const { choirLink } = useResolvedChoirScope()

  return (
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
  )
}
