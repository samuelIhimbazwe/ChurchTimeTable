'use client'

import Link from 'next/link'
import { useNotifications } from '@/lib/hooks'
import {
  Card, EmptyState, SkeletonCard,
} from '@/components/shared'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/utils/format'
import {
  Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle,
} from 'lucide-react'
import type { ApiNotification } from '@/types'

const TYPE_ICON: Record<ApiNotification['type'], React.ElementType> = {
  info:    Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error:   AlertCircle,
}

const TYPE_COLOR: Record<ApiNotification['type'], string> = {
  info:    'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error:   'text-danger',
}

export default function NotificationsPage() {
  const { data: notifications, isLoading, markRead, markAllRead } = useNotifications()
  const unread = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Notifications</h2>
          <p className="text-text-secondary text-sm mt-1">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary-600 hover:text-primary-800 border border-border rounded-lg hover:bg-surface-raised transition-colors disabled:opacity-60"
          >
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      <Card padding="none">
        {isLoading ? (
          <SkeletonCard rows={6} />
        ) : (notifications?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up — check back later."
          />
        ) : (
          <ul className="divide-y divide-border">
            {notifications?.map((n) => {
              const Icon  = TYPE_ICON[n.type]
              const color = TYPE_COLOR[n.type]
              const content = (
                <>
                  <div className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                    'bg-surface-overlay',
                  )}>
                    <Icon size={16} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm leading-snug',
                      n.read ? 'text-text-secondary' : 'font-semibold text-text-primary',
                    )}>
                      {n.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{n.body}</p>
                    <p className="text-xs text-text-muted mt-1">{relativeTime(n.createdAt)}</p>
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
