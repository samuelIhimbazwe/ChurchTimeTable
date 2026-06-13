'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { musicApi, rehearsalsApi, choirActivityApi, choirSchedulingApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import {
  Card, StatTile, Badge, SkeletonCard, PermissionGate,
} from '@/components/shared'
import { ChoirPositionHubShell, HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { MusicSongNotifyForm } from '@/components/choir/MusicSongNotifyForm'
import { MusicCreateSongForm } from '@/components/choir/MusicCreateSongForm'
import { RehearsalPlanEditor } from '@/components/choir/RehearsalPlanEditor'
import { formatDate, formatTime } from '@/lib/utils/format'
import { MusicDirectorCommandHome } from '@/components/choir/committee/MusicDirectorCommandHome'
import { Music, Calendar, Mic2, Megaphone } from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'notify', label: 'Notify members' },
  { id: 'library', label: 'Music library' },
  { id: 'rehearsals', label: 'Rehearsals' },
]

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function MusicDirectorHubPage() {
  const [tab, setTab] = useState('overview')
  const [planEvent, setPlanEvent] = useState<{ id: string; title: string } | null>(null)

  const { data: songs, isLoading: loadingSongs } = useQuery({
    queryKey: ['music-songs-count'],
    queryFn: () => musicApi.getSongs({ limit: 1 }),
  })

  const { data: voiceSections } = useQuery({
    queryKey: ['voice-sections'],
    queryFn: rehearsalsApi.getVoiceSections,
  })

  const { data: rehearsalDash } = useQuery({
    queryKey: ['rehearsal-dashboard'],
    queryFn: rehearsalsApi.getDashboard,
  })

  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: activities, isLoading: loadingAct } = useQuery({
    queryKey: ['choir-rehearsals', choirId],
    queryFn: () => choirActivityApi.getAll({ choirId, limit: 10, activityType: 'REHEARSAL' }),
    enabled: !!choirId,
  })

  const { data: health } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })
  const h = health as Record<string, unknown> | undefined

  const { data: recentSongs } = useQuery({
    queryKey: ['music-songs-recent'],
    queryFn: () => musicApi.getSongs({ limit: 8 }),
    enabled: tab === 'library',
  })

  const rehearsalItems = activities?.items ?? []

  return (
    <ChoirPositionHubShell roleKey="music_director" tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'overview' && (
        <div className="space-y-4">
          <MusicDirectorCommandHome />
          <div className="grid sm:grid-cols-2 gap-4">
            <button type="button" onClick={() => setTab('notify')} className="text-left">
              <Card padding="md" className="hover:shadow-raised transition-shadow h-full">
                <Megaphone size={20} className="text-gold-700 mb-2" />
                <p className="font-semibold text-sm">Notify song lists</p>
                <p className="text-xs text-text-muted mt-1">Tell all members what to practice or perform</p>
              </Card>
            </button>
            <HubQuickLink href={choirLink('music')} label="Full music library" desc="Scores, audio, metadata" icon={Music} />
            <HubQuickLink href={choirLink('voice-sections')} label="Voice sections" desc="Soprano, alto, tenor, bass" icon={Mic2} />
            <HubQuickLink href={choirLink('scheduling')} label="Scheduling" desc="Service assignments" icon={Calendar} />
          </div>
        </div>
      )}

      {tab === 'notify' && (
        <div className="space-y-4">
          <MusicSongNotifyForm />
          <Link href={choirLink('announcements')} className="text-sm font-semibold text-primary-600">
            View all choir announcements →
          </Link>
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-4">
          <PermissionGate anyOf={['choir.music.manage']}>
            <div className="flex flex-wrap items-center gap-3">
              <MusicCreateSongForm />
              <Link href={choirLink('music')} className="inline-flex px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg">
                Open full library →
              </Link>
            </div>
          </PermissionGate>
          {loadingSongs ? (
            <SkeletonCard rows={5} />
          ) : (
            <ul className="space-y-3">
              {recentSongs?.items?.map((song) => (
                <Link key={song.id} href={choirLink('music', song.id)}>
                  <Card padding="md" className="hover:shadow-raised transition-shadow">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{song.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {[song.composer, song.language, song.category].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      {song.category && <Badge variant="ministry-choir">{song.category}</Badge>}
                    </div>
                  </Card>
                </Link>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'rehearsals' && (
        <div className="space-y-4">
          {planEvent && (
            <RehearsalPlanEditor
              eventId={planEvent.id}
              eventTitle={planEvent.title}
              onClose={() => setPlanEvent(null)}
            />
          )}
          {loadingAct ? (
            <SkeletonCard rows={4} />
          ) : (
            <ul className="space-y-3">
              {rehearsalItems.slice(0, 8).map((a) => (
                <Card key={a.id} padding="md">
                  <div className="flex flex-wrap justify-between gap-3 items-center">
                    <div>
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {formatDate(a.date)}
                        {a.startTime ? ` · ${formatTime(a.startTime)}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <PermissionGate anyOf={['choir.rehearsal.manage', 'choir.music.manage']}>
                        <button
                          type="button"
                          onClick={() => setPlanEvent({ id: a.id, title: a.title })}
                          className="text-xs font-semibold text-primary-600 hover:underline"
                        >
                          Plan songs
                        </button>
                      </PermissionGate>
                      <Link href={choirLink('attendance', a.id)} className="text-xs font-semibold text-primary-600">
                        Attendance →
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </div>
      )}
    </ChoirPositionHubShell>
  )
}
