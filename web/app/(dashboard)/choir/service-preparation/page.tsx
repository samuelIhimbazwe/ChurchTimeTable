'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirServiceOpsApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { ClipboardList, ChevronRight } from 'lucide-react'

function monthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)
  return { from: from.toISOString(), to: to.toISOString() }
}

export default function ServicePreparationPage() {
  const range = useMemo(() => monthRange(), [])
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: services, isLoading } = useQuery({
    queryKey: ['service-preparation-list', choirId, range],
    queryFn: () => choirServiceOpsApi.listPreparation(choirId!, range),
    enabled: !!choirId,
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Service preparation</h2>
        <p className="text-text-secondary text-sm mt-1">
          Per-service plan — songs, uniform, pep talk, announcements, and custom prep items
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : (services?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <ClipboardList size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm">
              No assigned church services in this period. Approve a church service request first.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
          {services?.map((s) => (
            <li key={s.occurrenceId}>
              <Link
                href={choirLink('service-preparation', s.occurrenceId)}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-raised transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">{s.occurrence.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDate(s.occurrence.startAt)} · {formatTime(s.occurrence.startAt)}
                    {' · '}{s.role.replace(/_/g, ' ')}
                  </p>
                  {s.planSummary?.pepTalkTitle && (
                    <p className="text-xs text-text-secondary mt-1">Pep talk: {s.planSummary.pepTalkTitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.hasPlan ? 'status-active' : 'status-pending'}>
                    {s.hasPlan ? 'Plan ready' : 'Needs prep'}
                  </Badge>
                  <ChevronRight size={16} className="text-text-muted" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
