'use client'

import { useQuery } from '@tanstack/react-query'
import { authApi, governanceApi } from '@/lib/api'
import { Card, Badge } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { relativeTime } from '@/lib/utils/format'

export function AdvisorElevationNotice() {
  const { choirId } = useResolvedChoirScope()

  const { data: me } = useQuery({
    queryKey: ['auth-profile'],
    queryFn: () => authApi.getProfile(),
  })

  const memberId = me?.member?.id

  const { data } = useQuery({
    queryKey: ['choir-advisor-elevations', choirId],
    queryFn: () => governanceApi.listAdvisorElevations(choirId!, true),
    enabled: !!choirId,
  })

  if (!choirId || !memberId) return null

  const mine = (data?.items ?? []).filter((row) => row.memberId === memberId)
  if (mine.length === 0) return null

  return (
    <Card padding="md" accent="info">
      <p className="text-sm font-semibold text-text-primary mb-2">Temporary elevation active</p>
      <ul className="space-y-2">
        {mine.map((row) => (
          <li key={row.id} className="text-sm text-text-secondary">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="status-approved">Elevated</Badge>
              <span>Expires {relativeTime(row.endsAt)}</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {row.permissions.join(' · ')}
              {row.reason ? ` — ${row.reason}` : ''}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-muted mt-3">
        These permissions are temporary. Refresh or sign in again if tools do not appear immediately.
      </p>
    </Card>
  )
}
