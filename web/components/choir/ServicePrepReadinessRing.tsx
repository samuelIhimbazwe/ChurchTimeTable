'use client'

import { cn } from '@/lib/utils'

type Props = {
  pct: number
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function ServicePrepReadinessRing({
  pct,
  label = 'Prep readiness',
  size = 'md',
  className,
}: Props) {
  const clamped = Math.min(100, Math.max(0, pct))
  const dim = size === 'sm' ? 48 : 64
  const stroke = size === 'sm' ? 4 : 5
  const radius = (dim - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  const tone =
    clamped >= 75 ? 'text-success' : clamped >= 40 ? 'text-warning' : 'text-text-muted'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg width={dim} height={dim} className={cn('-rotate-90', tone)} aria-hidden>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="opacity-15"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div>
        {label ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        ) : null}
        <p className={cn('font-display font-semibold text-text-primary', size === 'sm' ? 'text-lg' : 'text-2xl')}>
          {clamped}%
        </p>
      </div>
    </div>
  )
}
