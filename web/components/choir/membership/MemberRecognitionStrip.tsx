'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, ChevronRight, Heart, CalendarCheck } from 'lucide-react'
import { Card } from '@/components/shared'
import { choirSchedulingApi } from '@/lib/api'
import { membershipProfilePath } from '@/lib/choir/membership-office'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { CelebrationMoment } from '@/components/member/CelebrationMoment'
import { useCelebrationSet } from '@/lib/hooks/useCelebrationSeen'

type Props = {
  choirId: string
}

const BADGE_LABEL_KEYS: Record<string, string> = {
  ATTENDANCE_PRESENT_MONTH: 'Present this month',
  ATTENDANCE_STEADY_SERVICE: 'Steady at worship',
  ATTENDANCE_FAITHFUL_SERVICE: 'Faithful at worship',
  ATTENDANCE_REHEARSAL_FAITHFUL: 'Rehearsal faithful',
  ATTENDANCE_PERFECT_SERVICE_MONTH: 'Perfect Sunday month',
  ATTENDANCE_SERVICE_JOURNEY: 'Long journey',
  CONTRIBUTION_FIRST_GIFT: 'First gift recorded',
  CONTRIBUTION_ON_TRACK: 'On track',
  CONTRIBUTION_GOAL_MET: 'Goal met',
  CONTRIBUTION_STEADY_GIVER: 'Steady giver',
}

function badgeLabel(kind: string, fallback: string, tr: (s: string) => string) {
  const key = BADGE_LABEL_KEYS[kind]
  return key ? tr(key) : fallback
}

export function MemberRecognitionStrip({ choirId }: Props) {
  const { tr } = useTranslations()
  const { findNew, markItems } = useCelebrationSet(`recognition-badges-${choirId}`)
  const [newBadgeKind, setNewBadgeKind] = useState<string | null>(null)
  const celebratedKeyRef = useRef<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['choir-recognition', choirId],
    queryFn: () => choirSchedulingApi.getMyRecognition(choirId),
    retry: 1,
  })

  const earned = useMemo(
    () => (data?.enabled === false ? [] : (data?.earned ?? [])),
    [data?.enabled, data?.earned],
  )
  const earnedKindsKey = useMemo(
    () => earned.map((b) => b.kind).sort().join('|'),
    [earned],
  )

  useEffect(() => {
    if (!earnedKindsKey) return
    if (celebratedKeyRef.current === earnedKindsKey) return

    const kinds = earnedKindsKey.split('|').filter(Boolean)
    const fresh = findNew(kinds)
    if (fresh.length === 0) {
      celebratedKeyRef.current = earnedKindsKey
      return
    }

    celebratedKeyRef.current = earnedKindsKey
    setNewBadgeKind(fresh[0])
    markItems(kinds)
  }, [earnedKindsKey, findNew, markItems])

  const newBadgeLabel = useMemo(() => {
    if (!newBadgeKind) return null
    const badge = earned.find((b) => b.kind === newBadgeKind)
    return badge ? badgeLabel(badge.kind, badge.label, tr) : newBadgeKind
  }, [earned, newBadgeKind, tr])

  if (isLoading) {
    return (
      <Card padding="md" className="mb-5">
        <p className="text-sm text-text-muted">{tr('Loading recognition…')}</p>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card padding="md" className="mb-5 border-warning/40">
        <p className="text-sm text-text-primary font-medium">{tr('My recognition')}</p>
        <p className="text-sm text-text-muted mt-1">
          {tr('Could not load recognition right now.')}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-800"
        >
          {tr('Retry')}
        </button>
      </Card>
    )
  }

  if (data.enabled === false) {
    return null
  }

  const milestones = data.nextMilestones ?? []
  const attendanceHref = membershipProfilePath(choirId, 'attendance')
  const givingHref = membershipProfilePath(choirId, 'giving')

  return (
    <>
      {newBadgeLabel && (
        <CelebrationMoment
          show
          title="New badge earned!"
          message={`You earned “${newBadgeLabel}”. Keep serving faithfully — only you see this recognition.`}
          onDismiss={() => setNewBadgeKind(null)}
          className="mb-5"
        />
      )}
    <Card padding="md" className="mb-5 border-gold-500/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700 flex items-center gap-1.5">
            <Award size={14} />
            {tr('My recognition')}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {tr('Private milestones for attendance and giving — only you see this.')}
          </p>
        </div>
      </div>

      {earned.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {earned.map((badge) => {
            const Icon =
              badge.category === 'contribution' ? Heart : CalendarCheck
            const href =
              badge.category === 'contribution' ? givingHref : attendanceHref
            return (
              <Link
                key={badge.kind}
                href={href}
                title={badge.detail ?? undefined}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-left',
                  'border-border bg-surface-raised hover:bg-surface-overlay transition-colors',
                  badge.category === 'contribution'
                    ? 'border-gold-500/30'
                    : 'border-info/20',
                )}
              >
                <Icon
                  size={16}
                  className={
                    badge.category === 'contribution'
                      ? 'text-gold-700 shrink-0'
                      : 'text-info shrink-0'
                  }
                />
                <span className="text-xs font-semibold text-text-primary">
                  {badgeLabel(badge.kind, badge.label, tr)}
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted mt-4">
          {tr('No badges yet — attend services and give consistently to earn recognition.')}
        </p>
      )}

      {milestones.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {tr('Next milestones')}
          </p>
          {milestones.map((m) => {
            const href = m.category === 'contribution' ? givingHref : attendanceHref
            return (
            <Link key={m.kind} href={href} className="block rounded-lg hover:bg-surface-raised px-1 -mx-1 py-1 transition-colors">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-text-primary">
                  {badgeLabel(m.kind, m.label, tr)}
                </span>
                <span className="text-text-muted">{m.progressPct}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-surface-overlay overflow-hidden">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all"
                  style={{ width: `${Math.min(100, m.progressPct)}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1">{tr(m.hint) === m.hint ? m.hint : tr(m.hint)}</p>
            </Link>
          )})}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold">
        <Link
          href={attendanceHref}
          className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1"
        >
          {tr('My attendance')} <ChevronRight size={12} />
        </Link>
        <Link
          href={givingHref}
          className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1"
        >
          {tr('My giving')} <ChevronRight size={12} />
        </Link>
      </div>
    </Card>
    </>
  )
}
