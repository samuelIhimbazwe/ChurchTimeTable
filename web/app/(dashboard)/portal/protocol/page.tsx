'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile, SkeletonCard, EmptyState,
} from '@/components/shared'
import { Shield, Trophy, CheckCircle2 } from 'lucide-react'

const BADGE_KIND_LABEL: Record<string, string> = {
  FAITHFUL_SERVANT:    '🙏 Faithful Servant',
  EMERGENCY_HELPER:    '🚨 Emergency Helper',
  TEAM_SUPPORTER:      '🤝 Team Supporter',
  RELIABLE_MEMBER:     '✅ Reliable Member',
  MOST_ACTIVE:         '⚡ Most Active',
  PERFECT_ATTENDANCE:  '💯 Perfect Attendance',
  SERVICE_VETERAN:     '🏅 Service Veteran',
  ATTENDANCE_CHAMPION: '🏆 Attendance Champion',
}

export default function PortalProtocolPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['protocol-my-stats'],
    queryFn:  protocolApi.getMyStats,
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Protocol stats</h2>
        <p className="text-text-secondary text-sm mt-1">
          Your protocol service stats and ranking
        </p>
      </div>

      <Card padding="md" accent="info">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">Internal membership.</strong> Protocol access is
          granted by your ministry administrator — not via self-service claims on the portal.
        </p>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile
              label="My Rank"
              value={stats?.rank ? `#${stats.rank}` : '—'}
              icon={Trophy}
              animate={false}
            />
            <StatTile
              label="Attendance"
              value={stats?.attendanceRate ?? 0}
              suffix="%"
              icon={CheckCircle2}
              animate
            />
            <StatTile
              label="Services"
              value={stats?.serviceCount ?? 0}
              icon={Shield}
              animate={false}
            />
          </>
        )}
      </div>

      <Card padding="md">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Badges</CardTitle>
          <CardDescription>Recognition earned through service</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={2} />
        ) : (stats?.badges?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Shield}
            title="No badges yet"
            description="Serve consistently to earn protocol badges."
            className="py-8"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats?.badges?.map((badge) => (
              <Badge key={badge} variant="ministry-protocol">
                {BADGE_KIND_LABEL[badge] ?? badge.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
