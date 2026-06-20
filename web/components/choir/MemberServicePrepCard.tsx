'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirServiceOpsApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { choirPath } from '@/lib/choir/paths'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { formatDate, formatTime } from '@/lib/utils/format'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { ServicePrepReadinessRing } from '@/components/choir/ServicePrepReadinessRing'
import { computeServicePrepReadiness } from '@/lib/choir/service-prep-readiness'
import { AddToCalendarButton } from '@/components/member/AddToCalendarButton'
import { ShareLinkButton } from '@/components/member/ShareLinkButton'

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
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="font-semibold flex items-center gap-2">
          <ClipboardList size={16} /> Upcoming service prep
        </p>
        <Link
          href={membershipOfficePath(choirId, 'music')}
          className="text-xs font-semibold text-primary-600 hover:text-primary-800"
        >
          All prep →
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {upcoming.map((s) => {
          const summary = s.planSummary
          const readiness = summary
            ? computeServicePrepReadiness({
                choirId,
                occurrenceId: s.occurrenceId,
                uniformNotes: summary.uniformNotes,
                pepTalkTitle: summary.pepTalkTitle,
                items: [],
              })
            : 0
          return (
            <li key={s.occurrenceId} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={choirPath(choirId, `service-preparation/${s.occurrenceId}`)}
                  className="min-w-0 flex-1 hover:text-primary-600 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{s.occurrence.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDate(s.occurrence.startAt)} · {formatTime(s.occurrence.startAt)}
                  </p>
                  {summary?.uniformNotes && (
                    <p className="text-xs text-text-secondary mt-1 truncate">
                      Uniform: {summary.uniformNotes}
                    </p>
                  )}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {s.hasPlan ? (
                    <ServicePrepReadinessRing pct={readiness} size="sm" label="" />
                  ) : (
                    <Badge variant="status-pending">Pending</Badge>
                  )}
                  <ChevronRight size={14} className="text-text-muted" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5 pl-0.5">
                <AddToCalendarButton
                  title={s.occurrence.title}
                  startAt={s.occurrence.startAt}
                  description={summary?.uniformNotes ?? undefined}
                />
                <ShareLinkButton
                  title={s.occurrence.title}
                  url={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}${choirPath(choirId, `service-preparation/${s.occurrenceId}`)}`
                      : choirPath(choirId, `service-preparation/${s.occurrenceId}`)
                  }
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
