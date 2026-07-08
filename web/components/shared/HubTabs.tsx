'use client'

import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type HubTab = { id: string; label: string }

type Props = {
  tabs: HubTab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function HubTabs({ tabs, active, onChange, className }: Props) {
  const { tr } = useTranslations()

  return (
    <div className={cn('scroll-strip gap-0 border-b border-border', className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-3 py-2.5 min-h-[2.5rem] text-sm shrink-0 touch-target',
              'transition-colors duration-fast -mb-px',
              isActive
                ? 'text-text-primary font-medium'
                : 'text-text-muted hover:text-text-secondary font-normal',
            )}
          >
            {tr(tab.label)}
            {isActive && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 bg-gold-500 rounded-full" aria-hidden />
            )}
          </button>
        )
      })}
    </div>
  )
}
