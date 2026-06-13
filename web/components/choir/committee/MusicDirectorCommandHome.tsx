'use client'

import { useQuery } from '@tanstack/react-query'
import { musicApi, rehearsalsApi, choirActivityApi, choirSchedulingApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function MusicDirectorCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: songs, isLoading: loadingSongs } = useQuery({
    queryKey: ['music-songs-count'],
    queryFn: () => musicApi.getSongs({ limit: 1 }),
  })

  const { data: voiceSections } = useQuery({
    queryKey: ['voice-sections'],
    queryFn: rehearsalsApi.getVoiceSections,
  })

  const { data: activities } = useQuery({
    queryKey: ['choir-rehearsals-cmd', choirId],
    queryFn: () => choirActivityApi.getAll({ choirId, limit: 10, activityType: 'REHEARSAL' }),
    enabled: !!choirId,
  })

  const { data: health } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (loadingSongs) {
    return <SkeletonCard rows={4} />
  }

  const rehearsalCount = activities?.items?.length ?? 0
  const h = health as Record<string, unknown> | undefined
  const rehearsalRate = num(h?.rehearsalAttendanceRate ?? h?.attendanceRate)

  return (
    <OfficeCommandHome
      title="Music command"
      subtitle="Library, rehearsals, and member song notifications."
      widgets={[
        {
          id: 'library',
          label: 'Music library',
          primary: songs?.total ?? '—',
          secondary: `${voiceSections?.length ?? 0} voice sections tracked`,
          cta: 'Open library →',
          href: choirLink('music'),
        },
        {
          id: 'rehearsals',
          label: 'Upcoming rehearsals',
          primary: rehearsalCount > 0 ? rehearsalCount : '—',
          secondary:
            rehearsalRate > 0
              ? `Rehearsal attendance ${rehearsalRate}%`
              : 'Plan and mark section readiness',
          cta: 'Rehearsal desk →',
          href: choirLink('music-direction'),
        },
        {
          id: 'notify',
          label: 'Member notify',
          primary: 'Send',
          secondary: 'Tell singers which songs to practice',
          cta: 'Notify members →',
          href: `${choirLink('music-direction')}?tab=notify`,
        },
      ]}
    />
  )
}
