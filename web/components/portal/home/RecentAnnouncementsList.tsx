'use client'

import Link from 'next/link'
import { Megaphone, ChevronRight } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardDescription, Badge,
} from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type PortalAnnouncement = {
  id: string
  title: string
  body: string
  publishedAt: string | null
  pinned?: boolean
  source: string
}

type Props = {
  announcements: PortalAnnouncement[]
  max?: number
  compact?: boolean
  allHref?: string
  itemHref?: (announcement: PortalAnnouncement) => string | undefined
}

export function RecentAnnouncementsList({
  announcements,
  max = 5,
  compact = false,
  allHref = '/announcements',
  itemHref,
}: Props) {
  const { tr } = useTranslations()
  const items = announcements.slice(0, max)

  return (
    <Card padding="none" className="h-full flex flex-col">
      <CardHeader className={compact ? 'px-4 pt-4 pb-2' : 'px-5 pt-5'}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone size={18} /> {tr('Announcements')}
        </CardTitle>
        {!compact && (
          <CardDescription>{tr('Updates from our local church')}</CardDescription>
        )}
      </CardHeader>
      {items.length === 0 ? (
        <p className="text-center text-text-muted text-sm py-6 px-4 flex-1">
          {tr('No announcements right now.')}
        </p>
      ) : (
        <ul className="divide-y divide-border flex-1">
          {items.map((a) => {
            const href = itemHref?.(a) ?? allHref
            const row = (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                  {a.pinned && <Badge variant="status-excused">{tr('Pinned')}</Badge>}
                  <Badge variant="default">
                    {a.source === 'church' ? tr('Church') : tr('Choir')}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary mt-1 line-clamp-2">{a.body}</p>
                {a.publishedAt && (
                  <p className="text-xs text-text-muted mt-1.5">{formatDate(a.publishedAt)}</p>
                )}
              </>
            )
            return (
              <li key={`${a.source}-${a.id}`} className={compact ? '' : ''}>
                <Link
                  href={href}
                  className={cn(
                    'interactive-link block',
                    compact ? 'px-4 py-3' : 'px-5 py-4',
                    'hover:text-primary-600',
                  )}
                >
                  {row}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <div className={`${compact ? 'px-4' : 'px-5'} py-3 border-t border-border mt-auto`}>
        <Link
          href={allHref}
          className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
        >
          {tr('All announcements')} <ChevronRight size={14} />
        </Link>
      </div>
    </Card>
  )
}
