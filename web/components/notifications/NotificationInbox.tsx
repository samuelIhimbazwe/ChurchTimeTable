'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/lib/hooks'
import {
  Card, EmptyState, SkeletonCard,
} from '@/components/shared'
import { NotificationInlineActions } from '@/components/notifications/NotificationInlineActions'
import {
  NOTIFICATION_CATEGORY_TABS,
  filterNotificationsByCategory,
  type NotificationCategory,
} from '@/lib/notifications/categories'
import { filterChoirNotifications } from '@/lib/notifications/choir-notifications'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/utils/format'
import {
  Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle,
} from 'lucide-react'
import type { ApiNotification } from '@/types'

const TYPE_ICON: Record<ApiNotification['type'], React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
}

const TYPE_COLOR: Record<ApiNotification['type'], string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
}

type Props = {
  choirId?: string
  showMarkAll?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function NotificationInbox({
  choirId,
  showMarkAll = true,
  emptyTitle = 'No notifications',
  emptyDescription = "You're all caught up — check back later.",
}: Props) {
  const [category, setCategory] = useState<NotificationCategory>('all')
  const { data: notifications, isLoading, markRead, markAllRead } = useNotifications()

  const scoped = useMemo(() => {
    const base = notifications ?? []
    return choirId ? filterChoirNotifications(base, choirId) : base
  }, [notifications, choirId])

  const filtered = useMemo(
    () => filterNotificationsByCategory(scoped, category),
    [scoped, category],
  )

  const unread = scoped.filter((n) => !n.read).length

  const tabCounts = useMemo(() => {
    const counts: Partial<Record<NotificationCategory, number>> = { all: scoped.length }
    for (const tab of NOTIFICATION_CATEGORY_TABS) {
      if (tab.id === 'all') continue
      counts[tab.id] = filterNotificationsByCategory(scoped, tab.id).length
    }
    return counts
  }, [scoped])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {NOTIFICATION_CATEGORY_TABS.map((tab) => {
            const count = tabCounts[tab.id] ?? 0
            if (tab.id !== 'all' && count === 0) return null
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors',
                  category === tab.id
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'border-border text-text-muted hover:bg-surface-raised',
                )}
              >
                {tab.label}
                {count > 0 && tab.id !== 'all' && (
                  <span className="ml-1 opacity-80">({count})</span>
                )}
              </button>
            )
          })}
        </div>
        {showMarkAll && unread > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 border border-border rounded-lg hover:bg-surface-raised transition-colors disabled:opacity-60"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {unread > 0 && (
        <p className="text-xs text-text-muted">
          {unread} unread{choirId ? ' for this choir' : ''}
        </p>
      )}

      <Card padding="none">
        {isLoading ? (
          <SkeletonCard rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Bell} title={emptyTitle} description={emptyDescription} className="py-10" />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((n) => {
              const Icon = TYPE_ICON[n.type]
              const color = TYPE_COLOR[n.type]
              const content = (
                <>
                  <div
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                      'bg-surface-overlay',
                    )}
                  >
                    <Icon size={16} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        n.read ? 'text-text-secondary' : 'font-semibold text-text-primary',
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-text-muted mt-1">{relativeTime(n.createdAt)}</p>
                    <NotificationInlineActions
                      notification={n}
                      compact
                      onAction={() => !n.read && markRead.mutate(n.id)}
                    />
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
                  )}
                </>
              )

              const className = cn(
                'flex items-start gap-3 px-5 py-4 transition-colors',
                n.read ? 'hover:bg-surface-raised' : 'bg-primary-50 hover:bg-primary-100',
              )

              if (n.link) {
                return (
                  <li key={n.id}>
                    <Link
                      href={n.link}
                      onClick={() => !n.read && markRead.mutate(n.id)}
                      className={className}
                    >
                      {content}
                    </Link>
                  </li>
                )
              }

              return (
                <li
                  key={n.id}
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  className={cn(className, 'cursor-pointer')}
                >
                  {content}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
