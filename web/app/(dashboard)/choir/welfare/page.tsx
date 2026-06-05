'use client'

import { useQuery } from '@tanstack/react-query'
import { welfareApi } from '@/lib/api'
import { Card, Badge, Avatar, PermissionGate, SkeletonCard } from '@/components/shared'
import { Heart } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { WelfareCase } from '@/types'

const STATUS_BADGE: Record<WelfareCase['status'], 'status-absent' | 'status-pending' | 'status-present'> = {
  OPEN:        'status-absent',
  IN_PROGRESS: 'status-pending',
  RESOLVED:    'status-present',
}

export default function WelfarePage() {
  const { data: cases, isLoading } = useQuery({
    queryKey: ['welfare'],
    queryFn:  () => welfareApi.getAll(),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Welfare Cases</h2>
          <p className="text-text-secondary text-sm mt-1">
            {cases?.filter((c) => c.status !== 'RESOLVED').length ?? 0} active cases
          </p>
        </div>
        <PermissionGate permission="choir.welfare.manage">
          <button className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors">
            + New Case
          </button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (cases?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Heart size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No welfare cases recorded.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {cases?.map((c) => (
            <Card key={c.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={c.memberName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{c.memberName}</p>
                    <p className="text-xs text-text-muted capitalize">{c.type}</p>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {c.description}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Opened {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[c.status]}>{c.status}</Badge>
                  <PermissionGate permission="choir.welfare.manage">
                    <button className="text-xs font-semibold text-primary-600 hover:text-primary-800">
                      Update
                    </button>
                  </PermissionGate>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
