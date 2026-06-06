'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { Card, Badge, Avatar, SkeletonCard } from '@/components/shared'
import { UserCog } from 'lucide-react'

export default function TeamLeadersPage() {
  const { data: leaders, isLoading } = useQuery({
    queryKey: ['protocol-team-leaders'],
    queryFn:  protocolApi.listTeamLeaders,
  })

  const list = (leaders ?? []) as Record<string, unknown>[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Team Leaders</h2>
        <p className="text-text-secondary text-sm mt-1">
          {list.length} registered team leaders
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : list.length === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <UserCog size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No team leaders registered.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((l, i) => {
            const member = l.member as Record<string, unknown> | undefined
            const name = member
              ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
              : String(l.label ?? 'Leader')
            return (
              <Card key={String(l.id ?? i)} padding="md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{name}</p>
                      {l.label != null && (
                        <p className="text-xs text-text-muted">{String(l.label)}</p>
                      )}
                      {l.isNonChoirLeader === true && (
                        <p className="text-xs text-text-muted">Non-choir leader</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={l.active === false ? 'status-inactive' : 'status-present'}>
                    {l.active === false ? 'Inactive' : 'Active'}
                  </Badge>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
