'use client'

import { TreasurerVerificationConsole } from '@/components/choir/committee/TreasurerVerificationConsole'
import { CapabilityGate } from '@/components/shared'

export default function BudgetVerifyPage() {
  return (
    <CapabilityGate
      uiCapability="contribution-treasury-verify"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">Treasurer verification access required.</p>
        </div>
      }
    >
      <TreasurerVerificationConsole />
    </CapabilityGate>
  )
}
