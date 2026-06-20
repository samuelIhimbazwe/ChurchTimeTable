'use client'

import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'
import { ChoirSceneIllustration } from '@/components/brand/ChoirSceneIllustration'

type IllustrationVariant = 'choir' | 'music' | 'calendar' | 'giving'

interface EmptyStateProps {
  icon?:       React.ElementType
  illustration?: IllustrationVariant
  title:       string
  description?: string
  action?:     { label: string; onClick: () => void }
  actionHref?: string
  actionLabel?: string
  className?:  string
}

export default function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  actionHref,
  actionLabel,
  className,
}: EmptyStateProps) {
  const { tr } = useTranslations()

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      className,
    )}>
      {illustration ? (
        <div className="mb-4">
          <ChoirSceneIllustration variant={illustration} />
        </div>
      ) : Icon ? (
        <div className="w-14 h-14 rounded-full bg-surface-overlay flex items-center justify-center mb-4">
          <Icon size={24} className="text-text-muted" />
        </div>
      ) : null}
      <p className="font-display text-xl text-text-primary">{tr(title)}</p>
      {description && (
        <p className="text-sm text-text-muted mt-2 max-w-xs">{tr(description)}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
        >
          {tr(action.label)}
        </button>
      )}
      {actionHref && actionLabel && (
        <a
          href={actionHref}
          className="mt-5 px-5 py-2.5 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
        >
          {tr(actionLabel)}
        </a>
      )}
    </div>
  )
}
