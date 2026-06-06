'use client'

import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { ChoirExecutiveHubContent } from '@/components/choir/ChoirExecutiveHubContent'

export default function VicePresidentHubPage() {
  return (
    <ChoirPositionHubShell
      roleKey="vice_president"
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <ChoirExecutiveHubContent deputyMode />
    </ChoirPositionHubShell>
  )
}
