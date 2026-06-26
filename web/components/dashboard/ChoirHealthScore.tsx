'use client'

import { Card } from '@/components/shared'
import { cn } from '@/lib/utils'
import { scoreBandTailwind, scoreBarTailwind } from '@/lib/chart/colors'
import { Activity } from 'lucide-react'

type Driver = {
  id: string
  label: string
  score: number
  max?: number
}

type Props = {
  score: number
  label?: string
  drivers?: Driver[]
  className?: string
}

function scoreTone(score: number) {
  return scoreBandTailwind(score)
}

function scoreBar(score: number) {
  return scoreBarTailwind(score)
}

export function ChoirHealthScore({
  score,
  label = 'Choir health',
  drivers = [],
  className,
}: Props) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))

  return (
    <Card padding="md" className={className}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-raised',
            scoreTone(clamped),
          )}
        >
          <Activity size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className={cn('font-display text-4xl font-bold leading-tight', scoreTone(clamped))}>
            {clamped}
          </p>
          <div className="h-2 rounded-full bg-surface-overlay mt-2 overflow-hidden">
            <div
              className={cn('h-full transition-all', scoreBar(clamped))}
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>
      </div>
      {drivers.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border pt-3">
          {drivers.map((d) => {
            const max = d.max ?? 100
            const pct = Math.round((d.score / max) * 100)
            return (
              <li key={d.id} className="flex items-center gap-3 text-xs">
                <span className="text-text-secondary flex-1 truncate">{d.label}</span>
                <div className="w-20 h-1.5 rounded-full bg-surface-overlay overflow-hidden">
                  <div className={cn('h-full', scoreBar(pct))} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-text-muted tabular-nums w-8 text-right">{pct}%</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
