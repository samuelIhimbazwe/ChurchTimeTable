'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirActivityApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Card, Badge, PermissionGate } from '@/components/shared'
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'
import type { ChoirActivityType } from '@/types'

const TYPE_BADGE: Partial<Record<ChoirActivityType, 'role-choir-president' | 'ministry-choir' | 'ministry-protocol' | 'role-member' | 'role-admin' | 'status-excused'>> = {
  SERVICE:          'role-choir-president',
  REHEARSAL:        'ministry-choir',
  PRAYER:           'ministry-protocol',
  MEETING:          'role-member',
  CONCERT:          'role-admin',
  SPECIAL_REHEARSAL:'status-excused',
}

export default function ActivitiesPage() {
  const [type, setType] = useState<string>('')
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data, isLoading } = useQuery({
    queryKey: ['choir-activities', choirId, { type: type || undefined }],
    queryFn:  () => choirActivityApi.getAll({
      choirId,
      limit: 30,
      activityType: type || undefined,
    }),
    enabled: !!choirId,
  })

  const TYPES = ['', 'SERVICE', 'REHEARSAL', 'PRAYER', 'MEETING', 'CONCERT']

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl text-text-primary">Activities</h2>
        <PermissionGate anyOf={['choir.events.manage', 'event:write']}>
          <Link
            href={choirLink('activities/new')}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + New Activity
          </Link>
        </PermissionGate>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t || 'all'}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              type === t
                ? 'bg-primary-700 text-white border-primary-700'
                : 'border-border text-text-secondary hover:border-primary-400'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} padding="md" className="animate-skeleton-pulse h-20">
              <div />
            </Card>
          ))}
        </div>
      ) : (data?.items?.length ?? 0) === 0 ? (
        <Card padding="md">
          <p className="text-center text-text-muted py-8">No activities found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.items?.map((a) => (
            <Link key={a.id} href={choirLink('attendance', a.id)}>
              <Card padding="md" className="hover:shadow-raised transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={TYPE_BADGE[a.activityType] ?? 'default'}>
                        {a.activityType}
                      </Badge>
                      {!a.attendanceOpen && (
                        <Badge variant="status-inactive">Locked</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-text-primary">{a.title}</p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(a.date)}
                      </span>
                      {a.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {formatTime(a.startTime)}
                        </span>
                      )}
                      {a.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {a.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {a.attendanceCount != null && a.memberCount != null && (
                      <span className="text-sm font-medium text-text-secondary">
                        {a.attendanceCount}/{a.memberCount}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-text-muted" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
