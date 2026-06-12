'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/hooks'
import { X, Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/utils/format'
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

interface NotificationPanelProps {
  open:    boolean
  onClose: () => void
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const router = useRouter()
  const { data: notifications, isLoading, markRead, markAllRead } = useNotifications()

  function openNotification(n: ApiNotification) {
    if (!n.read) markRead.mutate(n.id)
    if (n.link) {
      onClose()
      router.push(n.link)
    }
  }

  const unread = notifications?.filter((n) => !n.read).length ?? 0

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 z-50 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface rounded-xl border border-border shadow-overlay animate-page-enter overflow-hidden">

        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-text-secondary" />
            <span className="text-sm font-semibold text-text-primary">Notifications</span>
            {unread > 0 && (
              <span className="text-xs bg-danger text-white rounded-full px-1.5 py-0.5 font-semibold">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 transition-colors"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="max-h-[480px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-skeleton-pulse">
                  <div className="w-8 h-8 rounded-full bg-surface-overlay shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-overlay rounded w-3/4" />
                    <div className="h-3 bg-surface-overlay rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (notifications?.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <Bell size={28} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">You&apos;re all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications?.map((n) => {
                const Icon  = TYPE_ICON[n.type]
                const color = TYPE_COLOR[n.type]
                return (
                  <li
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                      n.read ? 'hover:bg-surface-raised' : 'bg-primary-50 hover:bg-primary-100',
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5',
                      'bg-surface-overlay',
                    )}>
                      <Icon size={15} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug', n.read ? 'text-text-secondary' : 'font-semibold text-text-primary')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-text-muted mt-1">{relativeTime(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {(notifications?.length ?? 0) > 0 && (
          <div className="px-4 py-2.5 border-t border-border text-center">
            <Link
              href="/notifications"
              className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
