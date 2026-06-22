'use client'

import { FamilyAdminPanel } from '@/components/choir/FamilyAdminPanel'
import { CapabilityGate, EmptyState } from '@/components/shared'

export default function FamiliesPage() {
  return (
    <CapabilityGate
      uiCapability="family-hub"
      fallback={
        <EmptyState
          title="Families not available"
          description="You do not have permission to view choir families."
        />
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Families</h2>
          <p className="text-text-secondary text-sm mt-1">
            View teams, assign heads, add members, and move singers between families.
          </p>
        </div>

        <FamilyAdminPanel />
      </div>
    </CapabilityGate>
  )
}
