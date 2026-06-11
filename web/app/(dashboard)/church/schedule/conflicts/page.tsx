'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import {
  Card, SkeletonCard, EmptyState, PermissionGate,
} from '@/components/shared'
import { AlertTriangle } from 'lucide-react'
import { ChurchScheduleConflictPanel } from '@/components/church/ChurchScheduleConflictPanel'

export default function ChurchScheduleConflictsPage() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['church-schedule-conflicts'],
    queryFn: () => churchScheduleApi.listConflicts(),
  })

  const items = Array.isArray(rows) ? rows : []

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Schedule conflicts</h2>
        <p className="text-text-secondary text-sm mt-1">
          Submissions held because room and time clash with the published timetable
        </p>
        <p className="text-xs text-text-muted mt-2">
          <Link href="/church/timetable" className="text-primary-600 font-semibold hover:underline">
            Master timetable
          </Link>
        </p>
      </div>

      <PermissionGate
        permission="church.schedule.view.queue"
        fallback={
          <Card padding="md">
            <p className="text-sm text-text-secondary">Church admin access required.</p>
          </Card>
        }
      >
        {isLoading ? (
          <SkeletonCard rows={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No conflicts in queue"
            description="When a submission clashes with an existing booking, it appears here for resolution."
          />
        ) : (
          <div className="space-y-4">
            {items.map((submission) => (
              <ChurchScheduleConflictPanel key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </PermissionGate>
    </div>
  )
}
