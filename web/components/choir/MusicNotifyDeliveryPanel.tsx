'use client'

import { useQuery } from '@tanstack/react-query'
import { choirOperationsApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { relativeTime } from '@/lib/utils/format'

type MusicNotifyItem = {
  id: string
  title: string
  publishedAt: string | null
  deliveredCount: number
  readCount: number
  acknowledgedCount: number
  audienceSize: number
  deliveryRate: number | null
}

export function MusicNotifyDeliveryPanel() {
  const { choirId } = useResolvedChoirScope()

  const { data, isLoading } = useQuery({
    queryKey: ['choir-music-notify-delivery', choirId],
    queryFn: () => choirOperationsApi.getMusicNotifyDelivery(choirId!),
    enabled: !!choirId,
  })

  if (!choirId) return null

  if (isLoading) {
    return <SkeletonCard rows={3} />
  }

  const items = (data?.items ?? []) as MusicNotifyItem[]

  if (items.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm font-semibold text-text-primary">Notify delivery tracking</p>
        <p className="text-xs text-text-muted mt-1">
          Published song lists will appear here with read and delivery rates.
        </p>
      </Card>
    )
  }

  return (
    <Card padding="md">
      <p className="text-sm font-semibold text-text-primary">Notify delivery tracking</p>
      <p className="text-xs text-text-muted mt-1 mb-4">
        Recent music notifications — in-app delivery and read tracking.
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-border px-3 py-2.5">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-medium text-sm text-text-primary">{item.title}</p>
              {item.publishedAt && (
                <span className="text-xs text-text-muted">
                  {relativeTime(item.publishedAt)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="status-pending" dot>
                {item.deliveredCount} delivered
              </Badge>
              <Badge variant="status-approved" dot>
                {item.readCount} read
              </Badge>
              {item.acknowledgedCount > 0 && (
                <Badge variant="ministry-choir">
                  {item.acknowledgedCount} acknowledged
                </Badge>
              )}
              {item.deliveryRate !== null && (
                <Badge variant={item.deliveryRate >= 70 ? 'status-approved' : 'status-pending'}>
                  {item.deliveryRate}% read rate
                </Badge>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
