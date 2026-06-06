'use client'

export type HubTab = { id: string; label: string }

type Props = {
  tabs: HubTab[]
  active: string
  onChange: (id: string) => void
}

export function HubTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            active === tab.id
              ? 'bg-primary-700 text-white'
              : 'text-text-secondary hover:bg-surface-raised'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
