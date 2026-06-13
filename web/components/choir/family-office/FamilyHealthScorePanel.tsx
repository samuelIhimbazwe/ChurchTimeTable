'use client'

import type { FamilyMetricsDetail } from '@/lib/api/modules/families'
import { Card, Badge } from '@/components/shared'

type Props = {
  metrics: FamilyMetricsDetail
  compact?: boolean
}

function weightLabel(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

export function FamilyHealthScorePanel({ metrics, compact }: Props) {
  const breakdown = metrics.healthBreakdown
  if (!breakdown) {
    return (
      <Card padding="md">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
          Family health
        </p>
        <p className="text-2xl font-display font-bold">
          {metrics.health.grade}{' '}
          <span className="text-base font-semibold text-text-muted">
            ({metrics.health.score}/100)
          </span>
        </p>
      </Card>
    )
  }

  const factors = [
    {
      label: 'Attendance',
      score: breakdown.attendanceRate,
      weight: breakdown.weights.attendance,
    },
    ...(breakdown.contributionScore != null
      ? [
          {
            label: 'Giving',
            score: breakdown.contributionScore,
            weight: breakdown.weights.contribution ?? 0,
          },
        ]
      : []),
    {
      label: 'Participation',
      score: breakdown.participationScore,
      weight: breakdown.weights.participation,
    },
  ]

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Family health
          </p>
          <p className="text-2xl font-display font-bold mt-1">
            Grade {metrics.health.grade}
            <span className="text-base font-semibold text-text-muted ml-2">
              {metrics.health.score}/100
            </span>
          </p>
        </div>
        <Badge
          variant={
            metrics.health.grade === 'A' || metrics.health.grade === 'B'
              ? 'status-present'
              : 'status-pending'
          }
        >
          90-day window
        </Badge>
      </div>

      {!compact && (
        <>
          <p className="text-xs text-text-muted mb-3">
            Weighted score from attendance, giving confirmation rate, and active participation.
          </p>
          <ul className="space-y-2 text-sm">
            {factors.map((factor) => (
              <li key={factor.label} className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">
                  {factor.label}
                  <span className="text-text-muted ml-1">
                    ({weightLabel(factor.weight)})
                  </span>
                </span>
                <span className="font-semibold">{factor.score}%</span>
              </li>
            ))}
          </ul>
          {metrics.attendance && (
            <p className="text-xs text-text-muted mt-3">
              {metrics.attendance.attendanceCount} attended · {metrics.attendance.missedCount}{' '}
              missed in the last 90 days
            </p>
          )}
        </>
      )}
    </Card>
  )
}
