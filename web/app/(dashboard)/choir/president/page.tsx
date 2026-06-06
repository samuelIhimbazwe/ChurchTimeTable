'use client'

import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { ChoirExecutiveHubContent } from '@/components/choir/ChoirExecutiveHubContent'

export default function PresidentHubPage() {
  return (
    <ChoirPositionHubShell
      roleKey="president"
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <ChoirExecutiveHubContent />
    </ChoirPositionHubShell>
  )
}
