'use client'

import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'role-super-admin'
  | 'role-admin'
  | 'role-choir-president'
  | 'role-protocol-leader'
  | 'role-member'
  | 'status-present'
  | 'status-absent'
  | 'status-excused'
  | 'status-pending'
  | 'status-late'
  | 'status-active'
  | 'status-inactive'
  | 'ministry-choir'
  | 'ministry-protocol'
  | 'ministry-both'
  | 'default'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  'role-super-admin':     'bg-primary-900 text-gold-400 border border-gold-700',
  'role-admin':           'bg-gold-500 text-primary-900',
  'role-choir-president': 'bg-primary-800 dark:bg-primary-100 text-gold-300 dark:text-gold-400',
  'role-protocol-leader': 'bg-primary-700 dark:bg-primary-100 text-primary-100 dark:text-gold-400',
  'role-member':          'bg-surface-overlay text-text-secondary border border-border',
  'status-present':       'bg-success-light text-success',
  'status-absent':        'bg-danger-light text-danger',
  'status-excused':       'bg-warning-light text-warning',
  'status-pending':       'bg-info-light text-info',
  'status-late':          'bg-warning-light text-warning border border-warning/30',
  'status-active':        'bg-success-light text-success',
  'status-inactive':      'bg-surface-overlay text-text-muted border border-border',
  'ministry-choir':       'bg-primary-100 text-primary-700',
  'ministry-protocol':    'bg-gold-100 text-gold-900',
  'ministry-both':        'bg-primary-100 text-primary-700',
  'default':              'bg-surface-overlay text-text-secondary border border-border',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export default function Badge({
  variant = 'default',
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
        'text-xs font-semibold leading-none whitespace-nowrap',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      )}
      {children}
    </span>
  )
}
