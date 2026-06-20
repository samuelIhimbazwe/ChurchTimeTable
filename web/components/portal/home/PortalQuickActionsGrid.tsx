'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpen, DollarSign, Clock, Heart, Building2, Music,
  HeartHandshake, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'
import { choirMemberHome } from '@/lib/choir/paths'

type Action = {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
  badge?: string
  disabled?: boolean
}

type Props = {
  choirId?: string
  hasChoirMembership: boolean
  onPrayerRequest: () => void
  pendingApproval?: boolean
  className?: string
}

export function PortalQuickActionsGrid({
  choirId,
  hasChoirMembership,
  onPrayerRequest,
  pendingApproval,
  className,
}: Props) {
  const { tr } = useTranslations()

  const actions: Action[] = [
    { id: 'devotion', label: tr('Devotion'), icon: BookOpen, href: '/portal/devotion' },
    {
      id: 'giving',
      label: tr('Church giving'),
      icon: DollarSign,
      href: '/portal/church-giving',
      disabled: pendingApproval,
    },
    { id: 'schedule', label: tr('My Schedule'), icon: Clock, href: '/portal/schedule' },
    { id: 'welfare', label: tr('Welfare'), icon: Heart, href: '/portal/welfare' },
    { id: 'ministries', label: tr('Ministries'), icon: Building2, href: '/portal/ministries' },
    {
      id: 'choirs',
      label: hasChoirMembership && choirId ? tr('My choir') : tr('Choirs'),
      icon: Music,
      href: hasChoirMembership && choirId ? choirMemberHome(choirId) : '/portal/choirs',
      badge: hasChoirMembership ? tr('Member') : undefined,
    },
    {
      id: 'prayer',
      label: tr('Prayer request'),
      icon: HeartHandshake,
      onClick: onPrayerRequest,
    },
    { id: 'events', label: tr('Church schedule'), icon: CalendarDays, href: '/events' },
  ]

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="font-display text-xl text-text-primary">{tr('Quick actions')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          const inner = (
            <>
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
            </>
          )

          const tileClass = cn(
            'flex items-center gap-3 p-3 rounded-lg border border-border bg-surface',
            'shadow-card transition-colors min-h-[72px]',
            action.disabled
              ? 'opacity-50 pointer-events-none'
              : 'hover:bg-surface-raised hover:border-primary-200 dark:hover:border-primary-700',
          )

          if (action.href) {
            return (
              <Link key={action.id} href={action.href} className={tileClass}>
                {inner}
              </Link>
            )
          }

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={cn(tileClass, 'text-left w-full')}
            >
              {inner}
            </button>
          )
        })}
      </div>
    </section>
  )
}
