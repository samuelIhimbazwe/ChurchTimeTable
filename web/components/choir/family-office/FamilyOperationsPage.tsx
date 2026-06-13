'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { choirActivityApi } from '@/lib/api'
import { choirPath } from '@/lib/choir/paths'
import { Card, PermissionGate, SkeletonCard } from '@/components/shared'
import { OfficeNavCard } from '@/components/choir/OfficeNavCard'
import { formatDate, formatTime } from '@/lib/utils/format'
import { ChevronRight } from 'lucide-react'

export function FamilyOperationsPage() {
  const params = useParams()
  const choirId = String(params.choirId)

  const { data: activities, isLoading } = useQuery({
    queryKey: ['choir-activities-family-office', choirId],
    queryFn: () => choirActivityApi.getAll({ choirId, limit: 12 }),
    enabled: !!choirId,
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-text-primary">Operations</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Activities your family attends — mark team attendance at each event.
        </p>
      </div>
      <Card padding="md">
        <p className="text-sm text-text-secondary">
          Mark attendance for your family members at each choir activity.
        </p>
      </Card>
      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (
        <ul className="space-y-3">
          {(activities?.items ?? []).map((a) => (
            <OfficeNavCard
              key={a.id}
              href={choirPath(choirId, 'attendance', a.id)}
              showChevron={false}
            >
              <div className="flex justify-between gap-3 items-center">
                <div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatDate(a.date)}
                    {a.startTime ? ` · ${formatTime(a.startTime)}` : ''}
                  </p>
                </div>
                <PermissionGate anyOf={['attendance.mark', 'attendance:write']}>
                  <span className="text-xs font-semibold text-primary-600 shrink-0 inline-flex items-center gap-1">
                    Mark team <ChevronRight size={14} />
                  </span>
                </PermissionGate>
              </div>
            </OfficeNavCard>
          ))}
        </ul>
      )}
    </div>
  )
}
