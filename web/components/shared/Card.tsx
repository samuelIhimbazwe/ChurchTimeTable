'use client'

import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: 'gold' | 'success' | 'warning' | 'danger' | 'info'
  elevated?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const ACCENT_CLASSES = {
  /** Subtle highlight — clean surface, no gold wash */
  gold:    'border-l-[3px] border-l-primary-600 bg-surface-raised',
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
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-lg border border-border',
        elevated ? 'shadow-raised' : 'shadow-card',
        accent && ACCENT_CLASSES[accent],
        PADDING_CLASSES[padding],
        className,
      )}
    >
      {children}
    </div>
  )
}

/* Convenience sub-components */
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
    <h3 className={cn('font-semibold text-lg sm:text-xl text-text-primary', className)}>
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
