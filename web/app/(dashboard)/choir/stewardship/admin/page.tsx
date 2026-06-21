'use client'

import Link from 'next/link'
import { CapabilityGate } from '@/components/shared'
import { ContributionCatalogAdminPanel } from '@/components/choir/ContributionCatalogAdminPanel'
import { FamilyLeadershipHistoryPanel } from '@/components/choir/FamilyLeadershipHistoryPanel'
import { useResolvedChoirScope } from '@/lib/hooks'

export default function StewardshipAdminPage() {
  const { choirId, choirLink } = useResolvedChoirScope()

  return (
    <CapabilityGate
      uiCapability="contribution-catalog"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">Treasurer access required for contribution administration.</p>
        </div>
      }
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <Link
            href={choirLink('stewardship')}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            ← Back to stewardship
          </Link>
          <h2 className="font-display text-3xl text-text-primary mt-2">Contribution administration</h2>
          <p className="text-text-secondary text-sm mt-1">
            Manage catalog types, fundraising campaigns, and family leadership history
          </p>
        </div>

        {choirId ? (
          <>
            <ContributionCatalogAdminPanel choirId={choirId} />
            <FamilyLeadershipHistoryPanel choirId={choirId} />
          </>
        ) : (
          <p className="text-sm text-text-muted">Open from an active choir dashboard to manage catalog.</p>
        )}
      </div>
    </CapabilityGate>
  )
}
