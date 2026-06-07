'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Avatar, SkeletonCard, PermissionGate } from '@/components/shared'
import { Trophy, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const CATEGORIES = [
  { id: 'OVERALL', label: 'Overall' },
  { id: 'ATTENDANCE', label: 'Attendance' },
  { id: 'RELIABILITY', label: 'Reliability' },
  { id: 'SERVICE_COUNT', label: 'Services' },
  { id: 'REPLACEMENT_SUPPORT', label: 'Replacements' },
  { id: 'TEAMWORK', label: 'Teamwork' },
] as const

type CategoryId = (typeof CATEGORIES)[number]['id']

export default function ProtocolRankingsPage() {
  const qc = useQueryClient()
  const now = new Date()
  const [category, setCategory] = useState<CategoryId>('OVERALL')
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: rankings, isLoading } = useQuery({
    queryKey: ['protocol-rankings', year, month, category],
    queryFn: () => protocolApi.getRankings({ year, month, category }),
  })

  const generate = useMutation({
    mutationFn: () => protocolApi.generateRankings(year, month),
    onSuccess: () => {
      toast.success('Monthly rankings generated')
      qc.invalidateQueries({ queryKey: ['protocol-rankings'] })
      qc.invalidateQueries({ queryKey: ['protocol-leader-dashboard'] })
    },
    onError: () => toast.error('Ranking generation failed'),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Protocol Rankings</h2>
          <p className="text-text-secondary text-sm mt-1">
            {year} · month {month} — {CATEGORIES.find((c) => c.id === category)?.label}
          </p>
        </div>
        <PermissionGate anyOf={['protocol.manage', 'protocol.operational.monitor', 'protocol.oversight', 'protocol.team.manage']}>
          <button
            type="button"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 disabled:opacity-60"
          >
            <RefreshCw size={14} className={generate.isPending ? 'animate-spin' : ''} />
            {generate.isPending ? 'Generating…' : 'Generate this month'}
          </button>
        </PermissionGate>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
              category === cat.id
                ? 'bg-primary-700 text-white border-primary-700'
                : 'border-border text-text-secondary hover:bg-surface-raised',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonCard rows={8} />
      ) : (rankings?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Trophy size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No ranking data for this category yet.</p>
            <p className="text-xs text-text-muted mt-2">
              Officers can generate rankings after attendance has been recorded.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-border">
            {rankings?.map((r, i) => (
              <li
                key={`${r.memberId}-${i}`}
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
