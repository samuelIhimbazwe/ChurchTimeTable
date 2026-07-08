'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: 'gold' | 'success' | 'warning' | 'danger' | 'info'
  elevated?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  href?: string
  onClick?: () => void
  id?: string
}

const ACCENT_CLASSES = {
  gold:    'border-l-4 border-l-gold-500 bg-gold-50/40',
  success: 'border-l-4 border-l-success bg-success-light',
  warning: 'border-l-4 border-l-warning bg-warning-light',
  danger:  'border-l-4 border-l-danger bg-danger-light',
  info:    'border-l-4 border-l-info bg-info-light',
}

const PADDING_CLASSES = {
  none: 'p-0',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

export default function Card({
  children,
  className,
  accent,
  elevated = false,
  padding = 'md',
  href,
  onClick,
  id,
}: CardProps) {
  const surfaceClass = cn(
    'bg-surface rounded-md border border-border',
    elevated && 'shadow-card',
    accent && ACCENT_CLASSES[accent],
    PADDING_CLASSES[padding],
    className,
  )

  if (href) {
    return (
      <Link
        href={href}
        id={id}
        className={cn(
          surfaceClass,
          'block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
          'hover:border-border-strong transition-colors duration-fast',
        )}
      >
        {children}
      </Link>
    )
  }

  if (onClick) {
    return (
      <div
        id={id}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        onClick={onClick}
        className={cn(
          surfaceClass,
          'cursor-pointer hover:border-border-strong transition-colors duration-fast',
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <div id={id} className={surfaceClass}>
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
  action,
}: {
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4', className)}>
      <div className="min-w-0">{children}</div>
      {action && (
        <div className="shrink-0 w-full sm:w-auto flex flex-wrap gap-2 sm:justify-end">
          {action}
        </div>
      )}
    </div>
  )
}

export function CardTitle({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('font-medium text-base text-text-primary tracking-tight', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-sm text-text-secondary mt-0.5', className)}>
      {children}
    </p>
  )
}
