'use client'

import Link from 'next/link'
import {
  Card, Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { Music } from 'lucide-react'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { ChoirDashboardEntryButton } from '@/components/choir/ChoirDashboardEntryButton'
import { choirMemberHome } from '@/lib/choir/paths'

/** Dual members only — lists choirs they belong to (no public browse). */
export default function PortalChoirsPage() {
  const { activeChoirMemberships, isLoading } = useChoirAccess()

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">My choirs</h2>
        <p className="text-text-secondary text-sm mt-1">
          Choir workspaces you belong to. Open one to continue in your choir system.
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : activeChoirMemberships.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No choir membership"
          description="If you were recently added, sign in with the credentials your administrator provided."
        />
      ) : (
        <div className="space-y-4">
          {activeChoirMemberships.map((choir) => (
            <Card key={choir.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={choirMemberHome(choir.id)}
                  className="flex items-start gap-3 flex-1 min-w-0 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <Music size={18} className="text-primary-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary group-hover:text-primary-700">
                      {choir.name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {choir.code.replace(/_/g, ' ')}
                    </p>
                    <Badge variant="status-present" className="mt-2">
                      Member
                    </Badge>
                  </div>
                </Link>
                <ChoirDashboardEntryButton choirId={choir.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
