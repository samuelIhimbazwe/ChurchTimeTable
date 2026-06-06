'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'
import { membersApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile, SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate, scoreBandLabel } from '@/lib/utils/format'
import { CheckCircle2, TrendingUp } from 'lucide-react'

export default function PortalAttendancePage() {
  const userId = useAuthStore((s) => s.user?.id)

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile-center', userId],
    queryFn:  () => membersApi.getProfileCenter(userId!),
    enabled:  !!userId,
  })

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['member-attendance', userId],
    queryFn:  () => membersApi.getAttendance(userId!),
    enabled:  !!userId,
  })

  const isLoading = loadingProfile || loadingAttendance
  const score = attendance?.score as Record<string, unknown> | undefined
    ?? (profile?.dashboard as Record<string, unknown> | undefined)?.attendanceScore as Record<string, unknown> | undefined
  const records = (attendance?.records ?? []) as Array<Record<string, unknown>>
  const allowed = attendance?.allowed !== false

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">My Attendance</h2>
        <p className="text-text-secondary text-sm mt-1">
          Participation score and recent records
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile
              label="Attendance Rate"
              value={Math.round(Number(score?.percentage ?? 0))}
              suffix="%"
              icon={CheckCircle2}
              animate
            />
            <StatTile
              label="Score"
              value={Math.round(Number(score?.weightedPoints ?? score?.score ?? 0))}
              suffix=" pts"
              icon={TrendingUp}
              animate
            />
            {score?.band != null && (
              <div className="flex flex-col justify-center">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                  Standing
                </p>
                <Badge
                  variant={
                    score.band === 'excellent' ? 'status-present' :
                    score.band === 'good'      ? 'status-excused' :
                                                 'status-absent'
                  }
                  dot
                >
                  {scoreBandLabel(String(score.band) as import('@/types').ScoreBand)}
                </Badge>
              </div>
            )}
          </>
        )}
      </div>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Recent Records</CardTitle>
          <CardDescription>
            {allowed ? `${records.length} records` : 'Summary only — detail restricted'}
          </CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={5} />
        ) : !allowed || records.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={allowed ? 'No attendance records' : 'Limited access'}
            description={
              allowed
                ? 'Your attendance history will appear here after services.'
                : 'Detailed attendance records are not available for your account.'
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {records.slice(0, 20).map((row, i) => (
              <li
                key={String(row.id ?? i)}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-raised transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {String(row.title ?? row.eventTitle ?? row.source ?? 'Service')}
                  </p>
                  <p className="text-xs text-text-muted">
                    {row.date || row.recordedAt
                      ? formatDate(String(row.date ?? row.recordedAt))
                      : '—'}
                  </p>
                </div>
                <Badge
                  variant={
                    String(row.outcome ?? row.status ?? '').includes('PRESENT') ||
                    String(row.outcome ?? row.status ?? '').includes('ATTENDED')
                      ? 'status-present'
                      : String(row.outcome ?? row.status ?? '').includes('EXCUSED')
                      ? 'status-excused'
                      : 'status-absent'
                  }
                >
                  {String(row.outcome ?? row.status ?? '—').replace(/_/g, ' ')}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
