'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  ClipboardList,
  DollarSign,
  ListTodo,
  Megaphone,
  Music,
  Users,
} from 'lucide-react'
import { membershipAnnouncementsHref, membershipOfficePath, membershipProfilePath } from '@/lib/choir/membership-office'
import { useUiCapability } from '@/lib/hooks/useCapability'
import { choirPath } from '@/lib/choir/paths'
import { cn } from '@/lib/utils'

type Action = {
  id: string
  label: string
  icon: LucideIcon
  href: string
  badge?: string
}

type Props = {
  choirId: string
  todoCount?: number
  className?: string
}

export function ChoirQuickActions({ choirId, todoCount = 0, className }: Props) {
  const canManageAnnouncements = useUiCapability('comms-announcements-manage', choirId)

  const actions: Action[] = [
    {
      id: 'todo',
      label: 'To do',
      icon: ListTodo,
      href: membershipOfficePath(choirId, 'obligations'),
      badge: todoCount > 0 ? String(todoCount) : undefined,
    },
    {
      id: 'giving',
      label: 'Submit giving',
      icon: DollarSign,
      href: choirPath(choirId, 'contributions/submit'),
    },
    {
      id: 'prep',
      label: 'Service prep',
      icon: ClipboardList,
      href: membershipOfficePath(choirId, 'music'),
    },
    {
      id: 'schedule',
      label: 'My schedule',
      icon: Calendar,
      href: membershipProfilePath(choirId, 'attendance'),
    },
    {
      id: 'music',
      label: 'Music library',
      icon: Music,
      href: membershipOfficePath(choirId, 'music'),
    },
    {
      id: 'family',
      label: 'My family',
      icon: Users,
      href: membershipProfilePath(choirId, 'family'),
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Megaphone,
      href: membershipAnnouncementsHref(choirId, { canManage: canManageAnnouncements }),
    },
    {
      id: 'scheduling',
      label: 'Choir calendar',
      icon: Calendar,
      href: choirPath(choirId, 'scheduling'),
    },
  ]

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="font-display text-xl text-text-primary">Quick actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-border bg-surface',
                'shadow-card transition-colors min-h-[88px] text-center overflow-hidden',
                'hover:bg-surface-raised hover:border-primary-200 dark:hover:border-primary-700',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  'bg-accent-choir-soft text-success',
                )}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0 w-full px-0.5">
                <p className="text-xs sm:text-sm font-semibold text-text-primary leading-snug break-words">
                  {action.label}
                </p>
                {action.badge && (
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-warning">
                    {action.badge} open
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
