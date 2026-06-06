'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'
import { membersApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { Heart } from 'lucide-react'

export default function PortalWelfarePage() {
  const userId = useAuthStore((s) => s.user?.id)

  const { data, isLoading } = useQuery({
    queryKey: ['welfare-cases', userId],
    queryFn:  async () => {
      const raw = await membersApi.getWelfareCases(userId!)
      if (Array.isArray(raw)) return raw
      return (raw as { items?: unknown[] }).items ?? []
    },
    enabled: !!userId,
  })

  const cases = (data ?? []) as Array<Record<string, unknown>>

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">My Welfare</h2>
        <p className="text-text-secondary text-sm mt-1">
          Your welfare cases and support requests
        </p>
      </div>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Cases</CardTitle>
          <CardDescription>{cases.length} case{cases.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={4} />
        ) : cases.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No welfare cases"
            description="Your welfare support cases will appear here if any are open."
          />
        ) : (
          <ul className="divide-y divide-border">
            {cases.map((c) => {
              const category = c.category as { name?: string } | undefined
              const coordinator = c.coordinator as { firstName?: string; lastName?: string } | undefined
              return (
                <li
                  key={String(c.id)}
                  className="px-5 py-4 hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {String(c.title ?? c.reference ?? category?.name ?? 'Welfare case')}
                      </p>
                      {c.summary != null && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                          {String(c.summary)}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-1">
                        {category?.name && `${category.name} · `}
                        Updated {formatDate(String(c.updatedAt ?? c.createdAt ?? ''))}
                      </p>
                      {coordinator && (
                        <p className="text-xs text-text-muted mt-0.5">
                          Coordinator: {coordinator.firstName} {coordinator.lastName}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        String(c.status) === 'CLOSED' || String(c.status) === 'RESOLVED'
                          ? 'status-inactive'
                          : String(c.status) === 'OPEN'
                          ? 'status-pending'
                          : 'status-excused'
                      }
                    >
                      {String(c.status ?? '—').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
