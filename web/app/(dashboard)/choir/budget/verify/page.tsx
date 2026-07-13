'use client'

import { TreasurerVerificationConsole } from '@/components/choir/committee/TreasurerVerificationConsole'
import { AccessRedirectGate } from '@/components/shared'

export default function BudgetVerifyPage() {
  return (
    <AccessRedirectGate
      uiCapability="contribution-treasury-verify"
    >
      <TreasurerVerificationConsole />
    </AccessRedirectGate>
  )
}
