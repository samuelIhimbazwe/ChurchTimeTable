'use client'

import { useTranslations } from '@/lib/i18n'

export type HubTab = { id: string; label: string }

type Props = {
  tabs: HubTab[]
  active: string
  onChange: (id: string) => void
}

export function HubTabs({ tabs, active, onChange }: Props) {
  const { tr } = useTranslations()

  return (
    <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto -mx-1 px-1 scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors shrink-0 ${
            active === tab.id
              ? 'bg-primary-700 text-white'
              : 'text-text-secondary hover:bg-surface-raised'
          }`}
        >
          {tr(tab.label)}
        </button>
      ))}
    </div>
  )
}
