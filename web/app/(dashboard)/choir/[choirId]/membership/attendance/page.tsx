'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'
import { membersApi } from '@/lib/api'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { Card, StatTile, SkeletonCard, SkeletonStatTile } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { CheckCircle2, Calendar } from 'lucide-react'

function attendanceRateFromRecords(records: Array<Record<string, unknown>>) {
  if (records.length === 0) return 0
  const present = records.filter((row) => {
    const status = String(row.status ?? row.outcome ?? '').toUpperCase()
    return status.includes('PRESENT') || status.includes('ATTENDED')
  }).length
  return Math.round((present / records.length) * 100)
}

export default function MembershipAttendancePage() {
  const params = useParams()
  const choirId = String(params.choirId ?? '')
  const user = useAuthStore((s) => s.user)

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['member-attendance', user?.id],
    queryFn: () => membersApi.getAttendance(user!.id),
    enabled: !!user?.id,
  })

  const records = useMemo(() => {
    if (Array.isArray(attendance?.records)) {
      return attendance.records as Array<Record<string, unknown>>
    }
    if (Array.isArray(attendance?.items)) {
      return attendance.items as Array<Record<string, unknown>>
    }
    return []
  }, [attendance])

  const loading = loadingAttendance
  const rate = attendanceRateFromRecords(records)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-text-primary">My attendance</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Your participation record for choir activities and services.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        {loading ? (
          <>
            <SkeletonStatTile />
            <SkeletonStatTile />
          </>
        ) : (
          <>
            <StatTile
              label="Attendance rate"
              value={rate}
              suffix="%"
              icon={CheckCircle2}
              animate
              href={membershipOfficePath(choirId, 'attendance')}
            />
            <StatTile
              label="Events recorded"
              value={records.length}
              icon={Calendar}
              animate
              href={membershipOfficePath(choirId, 'attendance')}
            />
          </>
        )}
      </div>

      {loading ? (
        <SkeletonCard rows={5} />
      ) : records.length === 0 ? (
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-8">
            No attendance marked yet for this period.
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-border">
            {records.slice(0, 50).map((row, i) => (
              <li key={String(row.id ?? i)} className="px-4 py-3 flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-text-primary">
                    {String(row.title ?? row.activityTitle ?? row.eventName ?? 'Activity')}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {row.date || row.markedAt
                      ? formatDate(String(row.date ?? row.markedAt))
                      : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-text-secondary shrink-0">
                  {String(row.status ?? row.outcome ?? '—').replace(/_/g, ' ')}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
