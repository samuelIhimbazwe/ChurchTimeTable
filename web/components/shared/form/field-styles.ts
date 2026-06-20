import { cn } from '@/lib/utils'

export const fieldClassName = cn(
  'w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border',
  'focus:outline-none focus:ring-2 focus:ring-gold-500',
  'disabled:opacity-60 disabled:cursor-not-allowed',
)

export const fieldErrorClassName = 'border-danger focus:ring-danger'
