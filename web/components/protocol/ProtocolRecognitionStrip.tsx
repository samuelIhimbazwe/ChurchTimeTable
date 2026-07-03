'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Award, Heart, CalendarCheck } from 'lucide-react'
import { Card } from '@/components/shared'
import { protocolApi } from '@/lib/api'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const BADGE_LABEL_KEYS: Record<string, string> = {
  ATTENDANCE_PRESENT_MONTH: 'Present this month',
  ATTENDANCE_STEADY_SERVICE: 'Steady at worship',
  ATTENDANCE_FAITHFUL_SERVICE: 'Faithful at worship',
  ATTENDANCE_REHEARSAL_FAITHFUL: 'Rehearsal faithful',
  ATTENDANCE_PERFECT_SERVICE_MONTH: 'Perfect service month',
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

export function ProtocolRecognitionStrip() {
  const { tr } = useTranslations()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['protocol-recognition'],
    queryFn: () => protocolApi.getMyRecognition(),
    retry: 1,
  })

  if (isLoading) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted">{tr('Loading recognition…')}</p>
      </Card>
    )
  }

  if (isError || !data) {
    return null
  }

  if (data.enabled === false) {
    return null
  }

  const earned = data.earned ?? []
  const milestones = data.nextMilestones ?? []

  return (
    <Card padding="md" className="border-cyan-500/20 bg-accent-protocol-soft/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 flex items-center gap-1.5">
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
              badge.category === 'contribution' ? '/protocol/treasury' : '/protocol/member'
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
                    : 'border-cyan-500/20',
                )}
              >
                <Icon
                  size={16}
                  className={
                    badge.category === 'contribution'
                      ? 'text-gold-700 shrink-0'
                      : 'text-cyan-700 shrink-0'
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
          {milestones.map((m) => (
            <div key={m.kind}>
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
              <p className="text-[11px] text-text-muted mt-1">{m.hint}</p>
            </div>
          ))}
        </div>
      )}

    </Card>
  )
}
