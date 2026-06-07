'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription, Badge, SkeletonCard,
} from '@/components/shared'
import { Shield, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import { PermissionGate } from '@/components/shared'

type TeamRow = {
  id: string
  status?: string
  occurrence?: { id: string; title?: string; startAt?: string; status?: string }
  members?: { id: string }[]
}

export default function ProtocolTeamsPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['protocol-teams'],
    queryFn:  () => protocolApi.listTeams(),
  })

  const list = (teams ?? []) as TeamRow[]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Protocol Teams</h2>
          <p className="text-text-secondary text-sm mt-1">
            {list.length} teams on record
          </p>
        </div>
        <PermissionGate anyOf={['protocol.team.manage', 'protocol.manage']}>
          <Link
            href="/protocol/teams/generate"
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            Build team
          </Link>
        </PermissionGate>
      </div>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>All Teams</CardTitle>
          <CardDescription>Click to view team details and mark attendance</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={5} />
        ) : list.length === 0 ? (
          <div className="text-center py-12">
            <Shield size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No teams generated yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((t) => {
              const occId = t.occurrence?.id
              if (!occId) return null
              return (
                <li key={t.id} className="hover:bg-surface-raised transition-colors">
                  <Link href={`/protocol/teams/${occId}`} className="flex items-center gap-4 px-5 py-3">
                    <Shield size={16} className="text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {t.occurrence?.title ?? 'Service team'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t.occurrence?.startAt && formatDate(t.occurrence.startAt)}
                        {` · ${t.members?.length ?? 0} members`}
                      </p>
                    </div>
                    {t.status && (
                      <Badge variant={
                        t.status === 'PUBLISHED' ? 'status-present' :
                        t.status === 'APPROVED'  ? 'status-excused' : 'status-pending'
                      }>
                        {t.status}
                      </Badge>
                    )}
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
