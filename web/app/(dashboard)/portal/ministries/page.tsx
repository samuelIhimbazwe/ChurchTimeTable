'use client'

import { useQuery } from '@tanstack/react-query'
import { ministriesApi } from '@/lib/api'
import {
  Card, Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { Building2, Users } from 'lucide-react'

export default function PortalMinistriesPage() {
  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn:  ministriesApi.getAll,
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Ministries</h2>
        <p className="text-text-secondary text-sm mt-1">
          Church ministries and service areas
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (ministries?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Building2}
          title="No ministries listed"
          description="Ministry information will appear here when available."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ministries?.map((ministry) => (
            <Card key={ministry.id} padding="md">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-primary">{ministry.name}</p>
                    {ministry.isActive === false && (
                      <Badge variant="status-inactive">Inactive</Badge>
                    )}
                  </div>
                  {ministry.code && (
                    <p className="text-xs text-text-muted mt-0.5">{ministry.code}</p>
                  )}
                  {ministry.description && (
                    <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                      {ministry.description}
                    </p>
                  )}
                  {ministry.memberCount != null && (
                    <div className="mt-3">
                      <Badge variant="default">
                        <Users size={11} className="inline mr-1" />
                        {ministry.memberCount} members
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
