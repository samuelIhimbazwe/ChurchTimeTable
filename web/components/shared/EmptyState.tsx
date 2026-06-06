'use client'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?:       React.ElementType
  title:       string
  description?: string
  action?:     { label: string; onClick: () => void }
  className?:  string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      className,
    )}>
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-surface-overlay flex items-center justify-center mb-4">
          <Icon size={24} className="text-text-muted" />
        </div>
      )}
      <p className="font-display text-xl text-text-primary">{title}</p>
      {description && (
        <p className="text-sm text-text-muted mt-2 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
