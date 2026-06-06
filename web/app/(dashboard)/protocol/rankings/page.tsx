'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { Card, Avatar, SkeletonCard } from '@/components/shared'
import { Trophy } from 'lucide-react'

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

export default function ProtocolRankingsPage() {
  const { data: rankings, isLoading } = useQuery({
    queryKey: ['protocol-rankings'],
    queryFn:  protocolApi.getRankings,
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Protocol Rankings</h2>
        <p className="text-text-secondary text-sm mt-1">
          Ranked by attendance, reliability, and service count
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={8} />
      ) : (rankings?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Trophy size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No ranking data yet.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-border">
            {rankings?.map((r, i) => (
              <li
                key={r.memberId}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors ${
                  i < 3 ? 'bg-gold-50' : ''
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
      )}
    </div>
  )
}
