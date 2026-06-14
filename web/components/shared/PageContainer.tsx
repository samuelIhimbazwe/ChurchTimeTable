'use client'

import { cn } from '@/lib/utils'

type MaxWidth = '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'

const MAX: Record<MaxWidth, string> = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

type Props = {
  children: React.ReactNode
  max?: MaxWidth
  className?: string
}

/** Standard page width + bottom padding for mobile browser chrome. */
export function PageContainer({ children, max = '5xl', className }: Props) {
  return (
    <div className={cn('mx-auto w-full min-w-0 pb-8 sm:pb-10', MAX[max], className)}>
      {children}
    </div>
  )
}

type PageHeaderProps = {
  title: string
  subtitle?: string
  meta?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, meta, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h2 className="page-heading font-display text-text-primary">{title}</h2>
        {subtitle && (
          <p className="text-sm text-text-secondary leading-relaxed">{subtitle}</p>
        )}
        {meta && <div className="text-xs text-text-muted">{meta}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  )
}

export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
