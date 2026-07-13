'use client'

import { ChoirMemberOnboardingPanel } from '@/components/choir/ChoirMemberOnboardingPanel'
import { AccessRedirectGate } from '@/components/shared'

export default function ChoirMemberOnboardingPage() {
  return (
    <AccessRedirectGate
      uiCapability="admin-join-link"
    >
      <ChoirMemberOnboardingPanel />
    </AccessRedirectGate>
  )
}
