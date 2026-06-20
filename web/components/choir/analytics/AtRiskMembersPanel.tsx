'use client'

import Link from 'next/link'
import { AlertTriangle, ChevronRight, Users } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Avatar,
  Badge,
  EmptyState,
  SkeletonCard,
} from '@/components/shared'
import { cn } from '@/lib/utils'

export type AtRiskMember = {
  memberId?: string
  name: string
  score: number
  unexcusedAbsences?: number
  serviceAttendanceRate?: number
}

type Props = {
  members: AtRiskMember[]
  isLoading?: boolean
  rosterHref: string
  onMemberClick?: (member: AtRiskMember) => void
  className?: string
}

function scoreTone(score: number) {
  if (score < 30) return 'text-danger'
  if (score < 50) return 'text-warning'
  return 'text-text-secondary'
}

export function AtRiskMembersPanel({
  members,
  isLoading,
  rosterHref,
  onMemberClick,
  className,
}: Props) {
  return (
    <Card padding="none" accent="warning" className={cn('overflow-hidden', className)}>
      <CardHeader className="px-5 pt-5 pb-4 border-b border-warning/15 bg-warning-light/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle size={17} className="text-warning shrink-0" />
              At-risk members
            </CardTitle>
            <CardDescription className="mt-1.5 leading-relaxed">
              Low participation or unexcused absences — open roster to follow up
            </CardDescription>
          </div>
          {!isLoading && members.length > 0 && (
            <Badge variant="status-excused" className="shrink-0">
              {members.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <div className="px-5 py-4">
        {isLoading ? (
          <SkeletonCard rows={3} />
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No at-risk members flagged"
            description="Everyone is meeting participation expectations for now."
            className="py-8"
          />
        ) : (
          <>
            <ul className="space-y-2.5" role="list">
              {members.map((member) => {
                const attendance =
                  member.serviceAttendanceRate != null
                    ? `${Math.round(member.serviceAttendanceRate)}% attendance`
                    : null
                const meta = [
                  `Score ${member.score}`,
                  attendance,
                  member.unexcusedAbsences
                    ? `${member.unexcusedAbsences} unexcused`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')

                const row = (
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={member.name} size="sm" className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {member.name}
                      </p>
                      <p className={cn('text-xs mt-0.5 tabular-nums', scoreTone(member.score))}>
                        {meta}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-text-muted shrink-0 group-hover:text-primary-600 transition-colors"
                    />
                  </div>
                )

                const className =
                  'group w-full text-left rounded-xl border border-border bg-surface px-4 py-3.5 hover:bg-surface-raised hover:border-warning/30 transition-colors touch-target'

                return (
                  <li key={member.memberId ?? member.name}>
                    {onMemberClick ? (
                      <button type="button" className={className} onClick={() => onMemberClick(member)}>
                        {row}
                      </button>
                    ) : (
                      <Link href={rosterHref} className={cn('block', className)}>
                        {row}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
              <p className="text-xs text-text-muted">
                Tap a member to open their roster profile
              </p>
              <Link
                href={rosterHref}
                className="text-xs font-semibold text-primary-600 hover:text-primary-800 whitespace-nowrap"
              >
                Open roster
              </Link>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
