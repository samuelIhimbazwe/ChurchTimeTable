'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { HubTabs, Card } from '@/components/shared'
import { ChoirPositionGuide } from '@/components/choir/ChoirPositionGuide'
import { choirPositionMeta } from '@/lib/constants/choir-positions'

export type HubTabDef = { id: string; label: string }

type ShellProps = {
  roleKey: string
  title?: string
  subtitle?: string
  tabs: HubTabDef[]
  activeTab: string
  onTabChange: (id: string) => void
  children: React.ReactNode
}

export function ChoirPositionHubShell({
  roleKey,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
}: ShellProps) {
  const meta = choirPositionMeta(roleKey)
  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl text-text-primary tracking-tight">
          {title ?? meta?.label ?? roleKey.replace(/_/g, ' ')}
        </h1>
        {(subtitle ?? meta?.summary) && (
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            {subtitle ?? meta?.summary}
          </p>
        )}
      </div>
      <ChoirPositionGuide roleKey={roleKey} />
      {tabs.length > 0 && (
        <HubTabs tabs={tabs} active={activeTab} onChange={onTabChange} />
      )}
      {children}
    </div>
  )
}

type QuickLinkProps = {
  href: string
  label: string
  desc: string
  icon: React.ElementType
  stat?: string | number
}

export function HubQuickLink({ href, label, desc, icon: Icon, stat }: QuickLinkProps) {
  return (
    <Link href={href}>
      <Card padding="md" className="h-full hover:border-border-strong transition-colors group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-100/60 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-primary-600 dark:text-gold-400" />
            </div>
            <div>
              <p className="font-semibold text-text-primary group-hover:text-primary-700 dark:group-hover:text-gold-400">{label}</p>
              <p className="text-xs text-text-muted mt-1">{desc}</p>
              {stat != null && (
                <p className="text-xs font-semibold text-primary-600 mt-2">{stat}</p>
              )}
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted group-hover:text-primary-600 dark:group-hover:text-gold-400 shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  )
}
