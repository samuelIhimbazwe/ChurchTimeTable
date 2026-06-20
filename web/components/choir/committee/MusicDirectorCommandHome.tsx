'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { musicApi, rehearsalsApi, choirActivityApi, choirSchedulingApi, choirServiceOpsApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { LeadershipAttentionPanel } from '@/components/shared/office/LeadershipAttentionPanel'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function upcomingRange() {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)
  return { from: now.toISOString(), to: to.toISOString() }
}

export function MusicDirectorCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()
  const prepRange = useMemo(() => upcomingRange(), [])

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

  const { data: prepServices } = useQuery({
    queryKey: ['service-preparation-cmd', choirId, prepRange],
    queryFn: () => choirServiceOpsApi.listPreparation(choirId!, prepRange),
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
  const missingPrep = (prepServices ?? []).filter((s) => !s.hasPlan).length

  return (
    <div className="space-y-6">
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
            id: 'prep',
            label: 'Service prep gaps',
            primary: missingPrep > 0 ? missingPrep : '✓',
            secondary:
              missingPrep > 0
                ? 'Assigned services without a published plan'
                : 'All upcoming services have prep plans',
            cta: 'Service preparation →',
            href: choirLink('service-preparation'),
            tone: missingPrep > 0 ? 'warning' : 'success',
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

      <LeadershipAttentionPanel
        items={[
          ...(missingPrep > 0
            ? [{
                id: 'prep',
                label: `${missingPrep} service(s) need a preparation plan`,
                detail: 'Add songs, uniform notes, and pep talk before Sunday',
                href: choirLink('service-preparation'),
                tone: 'warning' as const,
              }]
            : []),
          ...(rehearsalRate > 0 && rehearsalRate < 70
            ? [{
                id: 'rehearsal',
                label: `Rehearsal attendance at ${rehearsalRate}%`,
                detail: 'Consider follow-up with section leaders',
                href: choirLink('reports'),
                tone: 'warning' as const,
              }]
            : []),
        ]}
      />
    </div>
  )
}
