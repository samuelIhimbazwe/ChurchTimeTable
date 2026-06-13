'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  value: number | string
  delta?: number          /* e.g. 12 means +12%, -5 means -5% */
  deltaLabel?: string     /* e.g. "vs last month" */
  icon?: React.ElementType
  iconClassName?: string
  prefix?: string         /* e.g. "GHS " for currency */
  suffix?: string         /* e.g. "%" */
  animate?: boolean
  onClick?: () => void
  href?: string
  className?: string
  accent?: boolean        /* primary left border highlight */
}

function useCountUp(target: number, animate: boolean, duration = 800) {
  const [count, setCount] = useState(animate ? 0 : target)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (!animate || typeof target !== 'number') return
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, animate, duration])

  return count
}

export default function StatTile({
  label,
  value,
  delta,
  deltaLabel = 'vs last period',
  icon: Icon,
  iconClassName,
  prefix = '',
  suffix = '',
  animate = true,
  onClick,
  href,
  className,
  accent = false,
}: StatTileProps) {
  const numericValue = typeof value === 'number' ? value : NaN
  const displayed    = useCountUp(isNaN(numericValue) ? 0 : numericValue, animate && !isNaN(numericValue))

  const deltaPositive = delta !== undefined && delta > 0
  const deltaNeutral  = delta === 0
  const DeltaIcon     = deltaNeutral ? Minus : deltaPositive ? TrendingUp : TrendingDown

  const interactive = !!onClick || !!href

  const body = (
    <div
      role={onClick && !href ? 'button' : undefined}
      tabIndex={onClick && !href ? 0 : undefined}
      onKeyDown={onClick && !href ? (e) => e.key === 'Enter' && onClick() : undefined}
      onClick={href ? undefined : onClick}
      className={cn(
        'relative bg-surface rounded-lg p-4 sm:p-5 min-w-0',
        'border border-border shadow-card',
        'flex flex-col gap-3',
        accent && 'border-l-[3px] border-l-primary-600',
        interactive && 'cursor-pointer hover:shadow-raised hover:-translate-y-0.5',
        'transition-all duration-fast',
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-text-secondary leading-snug">{label}</span>
        {Icon && (
          <div className={cn(
            'flex items-center justify-center w-9 h-9 rounded-md',
            'bg-primary-50 dark:bg-primary-100/60',
            iconClassName,
          )}>
            <Icon size={18} className="text-primary-600 dark:text-gold-400" />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="animate-count-up">
        <span className="font-display font-bold text-3xl sm:text-4xl text-text-primary leading-none">
          {prefix}
          {isNaN(numericValue) ? value : displayed.toLocaleString()}
          {suffix}
        </span>
      </div>

      {/* Delta */}
      {delta !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          deltaPositive  ? 'text-success' :
          deltaNeutral   ? 'text-text-muted' : 'text-danger',
        )}>
          <DeltaIcon size={13} />
          <span>
            {deltaPositive ? '+' : ''}{delta}% {deltaLabel}
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        {body}
      </Link>
    )
  }

  return body
}
