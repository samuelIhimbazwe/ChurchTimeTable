'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { protocolApi, choirApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Card, Avatar, SkeletonCard, EmptyState } from '@/components/shared'
import { Trophy, Music, Shield } from 'lucide-react'

const BADGE_KIND_LABEL: Record<string, string> = {
  FAITHFUL_SERVANT:    '🙏 Faithful',
  EMERGENCY_HELPER:    '🚨 Emergency',
  TEAM_SUPPORTER:      '🤝 Supporter',
  RELIABLE_MEMBER:     '✅ Reliable',
  MOST_ACTIVE:         '⚡ Most Active',
  PERFECT_ATTENDANCE:  '💯 Perfect',
  SERVICE_VETERAN:     '🏅 Veteran',
  ATTENDANCE_CHAMPION: '🏆 Champion',
}

function RankingsList({
  rankings,
  isLoading,
  emptyLabel,
}: {
  rankings?: import('@/types').ProtocolRankingEntry[]
  isLoading: boolean
  emptyLabel: string
}) {
  if (isLoading) return <SkeletonCard rows={8} />

  if ((rankings?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No rankings yet"
        description={emptyLabel}
      />
    )
  }

  return (
    <Card padding="none">
      <ul className="divide-y divide-border">
        {rankings?.map((r, i) => (
          <li
            key={r.memberId}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors ${
              i < 3 ? 'bg-surface-raised' : ''
            }`}
          >
            <span className={`font-display font-bold text-2xl w-8 text-right shrink-0 ${
              i === 0 ? 'text-gold-500' :
              i === 1 ? 'text-primary-400' :
              i === 2 ? 'text-warning' : 'text-text-muted'
            }`}>
              {r.rank}
            </span>
            <Avatar name={r.memberName} size="sm" active={i === 0} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {r.memberName}
              </p>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-xs text-text-muted">
                  {r.attendanceRate}% · {r.serviceCount} services
                </span>
                {r.badges?.slice(0, 2).map((b) => (
                  <span key={b} className="text-xs">{BADGE_KIND_LABEL[b] ?? b}</span>
                ))}
              </div>
            </div>
            <span className="font-display font-bold text-2xl text-primary-600 shrink-0">
              {r.score}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function RankingsPage() {
  const [tab, setTab] = useState<'protocol' | 'choir'>('protocol')

  const { choirId, choirName } = useResolvedChoirScope()

  const { data: protocolRankings, isLoading: loadingProtocol } = useQuery({
    queryKey: ['protocol-rankings'],
    queryFn: () => protocolApi.getRankings(),
    enabled:  tab === 'protocol',
  })

  const { data: choirRankings, isLoading: loadingChoir } = useQuery({
    queryKey: ['choir-rankings', choirId],
    queryFn:  () => choirApi.getRankings(choirId),
    enabled:  tab === 'choir' && !!choirId,
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Rankings</h2>
        <p className="text-text-secondary text-sm mt-1">
          Protocol and choir leaderboards
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {([
          { id: 'protocol' as const, label: 'Protocol', icon: Shield },
          { id: 'choir'    as const, label: 'Choir',    icon: Music },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === id
                ? 'border-gold-500 text-primary-700'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'protocol' ? (
        <RankingsList
          rankings={protocolRankings}
          isLoading={loadingProtocol}
          emptyLabel="Protocol rankings will appear once members have service records."
        />
      ) : !choirId ? (
        <EmptyState
          icon={Music}
          title="No choir configured"
          description="Open rankings from a choir dashboard or join a choir first."
        />
      ) : (
        <RankingsList
          rankings={choirRankings}
          isLoading={loadingChoir}
          emptyLabel={`No rankings for ${choirName ?? 'this choir'} yet.`}
        />
      )}
    </div>
  )
}
