'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, Video, VideoOff } from 'lucide-react'
import { Card } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { useTranslations } from '@/lib/i18n'
import type { MemberPortalServiceCard } from '@/lib/api/modules/memberPortal'

type Props = {
  service: MemberPortalServiceCard | null
}

export function PortalNextServiceGlance({ service }: Props) {
  const { tr } = useTranslations()
  const next = service?.nextOccurrence

  return (
    <Card padding="md" className="h-full bg-surface/80 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-info">
        {tr('Next service')}
      </p>
      {service && next ? (
        <>
          <p className="font-semibold text-text-primary mt-2">{service.name}</p>
          <p className="text-sm text-text-secondary mt-1">
            <Calendar size={13} className="inline mr-1 -mt-0.5" />
            {formatDate(next.startAt)} · {formatTime(next.startAt)}
          </p>
          {service.liveStreamUrl && !service.liveStreamRestricted ? (
            <a
              href={service.liveStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 mt-2"
            >
              <Video size={14} /> {tr('Watch live')}
            </a>
          ) : service.liveStreamRestricted ? (
            <p className="text-xs text-text-muted flex items-start gap-1.5 mt-2">
              <VideoOff size={14} className="shrink-0 mt-0.5" />
              {service.restrictionReason ?? tr('No live stream for this service.')}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-text-muted mt-2">{tr('No upcoming service scheduled.')}</p>
      )}
      <Link
        href="/events"
        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-primary-600 hover:text-primary-800"
      >
        {tr('Full calendar')} <ChevronRight size={12} />
      </Link>
    </Card>
  )
}
