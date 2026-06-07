'use client'

import { FamilyAdminPanel } from '@/components/choir/FamilyAdminPanel'

export default function FamiliesPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Families</h2>
        <p className="text-text-secondary text-sm mt-1">
          View teams, assign heads, add members, and move singers between families.
        </p>
      </div>

      <FamilyAdminPanel />
    </div>
  )
}
