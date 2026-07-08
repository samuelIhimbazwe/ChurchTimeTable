'use client'

import { ChoirMemberOnboardingPanel } from '@/components/choir/ChoirMemberOnboardingPanel'
import { CapabilityGate, EmptyState } from '@/components/shared'

export default function ChoirMemberOnboardingPage() {
  return (
    <CapabilityGate
      uiCapability="admin-join-link"
      fallback={
        <EmptyState
          title="Member onboarding not available"
          description="You do not have permission to add or invite choir members."
        />
      }
    >
      <ChoirMemberOnboardingPanel />
    </CapabilityGate>
  )
}
