'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirServiceOpsApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { choirPath } from '@/lib/choir/paths'
import { formatDate, formatTime } from '@/lib/utils/format'
import { ClipboardList, ChevronRight } from 'lucide-react'

function upcomingRange() {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)
  return { from: now.toISOString(), to: to.toISOString() }
}

export function MemberServicePrepCard({ choirId }: { choirId: string }) {
  const range = useMemo(() => upcomingRange(), [])

  const { data: services, isLoading } = useQuery({
    queryKey: ['member-service-preparation', choirId, range],
    queryFn: () => choirServiceOpsApi.listMemberPreparation(choirId, range),
    enabled: !!choirId,
  })

  const upcoming = (services ?? []).slice(0, 4)

  if (isLoading) return <SkeletonCard rows={3} />

  if (upcoming.length === 0) return null

  return (
    <Card padding="md">
      <p className="font-semibold mb-3 flex items-center gap-2">
        <ClipboardList size={16} /> Upcoming service prep
      </p>
      <ul className="divide-y divide-border">
        {upcoming.map((s) => (
          <li key={s.occurrenceId}>
            <Link
              href={choirPath(choirId, `service-preparation/${s.occurrenceId}`)}
              className="flex items-center justify-between gap-3 py-2.5 hover:text-primary-600 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.occurrence.title}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatDate(s.occurrence.startAt)} · {formatTime(s.occurrence.startAt)}
                </p>
                {s.planSummary?.uniformNotes && (
                  <p className="text-xs text-text-secondary mt-1 truncate">
                    Uniform: {s.planSummary.uniformNotes}
                  </p>
                )}
                {s.planSummary?.pepTalkTitle && (
                  <p className="text-xs text-text-secondary truncate">
                    Pep talk: {s.planSummary.pepTalkTitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={s.hasPlan ? 'status-active' : 'status-pending'}>
                  {s.hasPlan ? 'Ready' : 'Pending'}
                </Badge>
                <ChevronRight size={14} className="text-text-muted" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
