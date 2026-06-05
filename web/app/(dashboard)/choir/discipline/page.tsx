'use client'

import { useQuery } from '@tanstack/react-query'
import { disciplineApi } from '@/lib/api'
import { Card, Badge, Avatar, PermissionGate, SkeletonCard } from '@/components/shared'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { DisciplineStage } from '@/types'

const STAGE_COLOR: Record<DisciplineStage, 'status-pending' | 'status-excused' | 'status-absent' | 'role-super-admin'> = {
  STAGE_1: 'status-pending',
  STAGE_2: 'status-excused',
  STAGE_3: 'status-absent',
  STAGE_4: 'status-absent',
  STAGE_5: 'role-super-admin',
}

export default function DisciplinePage() {
  const { data: cases, isLoading } = useQuery({
    queryKey: ['discipline'],
    queryFn:  disciplineApi.getAll,
  })

  const active = cases?.filter((c) => !c.resolvedAt) ?? []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Discipline Cases</h2>
        <p className="text-text-secondary text-sm mt-1">
          {active.length} active · {(cases?.length ?? 0) - active.length} resolved
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={3} />
      ) : (cases?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <AlertTriangle size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No discipline cases.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {cases?.map((c) => (
            <Card
              key={c.id}
              accent={c.stage === 'STAGE_3' || c.stage === 'STAGE_4' || c.stage === 'STAGE_5' ? 'danger' : 'warning'}
              padding="md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={c.memberName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{c.memberName}</p>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {c.description}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Opened {formatDate(c.openedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={STAGE_COLOR[c.stage]}>
                    {c.stage.replace('_', ' ')}
                  </Badge>
                  {c.resolvedAt && (
                    <Badge variant="status-present">Resolved</Badge>
                  )}
                  <PermissionGate permission="discipline:manage">
                    <button className="text-xs font-semibold text-primary-600 hover:text-primary-800">
                      Advance →
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
