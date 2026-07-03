'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Music, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'
import { choirMemberHome } from '@/lib/choir/paths'

type Action = {
  id: string
  label: string
  icon: LucideIcon
  href: string
  badge?: string
}

type Props = {
  choirId?: string
  hasChoirMembership: boolean
  className?: string
}

export function PortalQuickActionsGrid({
  choirId,
  hasChoirMembership,
  className,
}: Props) {
  const { tr } = useTranslations()

  const actions: Action[] = [
    {
      id: 'choirs',
      label: hasChoirMembership && choirId ? tr('My choir') : tr('Choirs'),
      icon: Music,
      href: hasChoirMembership && choirId ? choirMemberHome(choirId) : '/portal/choirs',
      badge: hasChoirMembership ? tr('Member') : undefined,
    },
    {
      id: 'protocol',
      label: tr('Protocol'),
      icon: Shield,
      href: '/portal/protocol',
    },
  ]

  return (
    <section data-tour="portal-quick-actions" className={cn('space-y-3', className)}>
      <h2 className="font-display text-xl text-text-primary">{tr('Quick actions')}</h2>
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                'interactive-tile flex items-center gap-3 p-3 rounded-lg border border-border bg-surface',
                'shadow-card min-h-[72px] text-left w-full',
                'hover:border-primary-200 dark:hover:border-primary-700',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  'bg-accent-member-soft text-info',
                )}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary leading-tight">
                  {action.label}
                </p>
                {action.badge && (
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                    {action.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
