'use client'

import { useState } from 'react'
import { useMembers } from '@/lib/hooks'
import {
  Card, Badge, Avatar, SkeletonMemberRow, CapabilityGate,
} from '@/components/shared'
import { Search, UserPlus, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import type { MinistryScope, MemberStatus } from '@/types'

const STATUS_BADGE: Record<MemberStatus, 'status-active' | 'status-inactive' | 'status-absent'> = {
  ACTIVE:    'status-active',
  INACTIVE:  'status-inactive',
  SUSPENDED: 'status-absent',
}

const MINISTRY_BADGE: Record<MinistryScope, 'ministry-choir' | 'ministry-protocol' | 'ministry-both' | 'role-member'> = {
  CHOIR:    'ministry-choir',
  PROTOCOL: 'ministry-protocol',
  BOTH:     'ministry-both',
  NONE:     'role-member',
}

export default function MembersDirectoryPage() {
  const [search,   setSearch]   = useState('')
  const [ministry, setMinistry] = useState<MinistryScope | ''>('')
  const [status,   setStatus]   = useState<MemberStatus | ''>('')
  const [page,     setPage]     = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useMembers({
    search:   search || undefined,
    ministry: (ministry as MinistryScope) || undefined,
    status:   (status  as MemberStatus)  || undefined,
    page,
    limit: 20,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MemberStatus }) =>
      membersApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Member status updated')
      qc.invalidateQueries({ queryKey: ['members'] })
    },
    onError: () => toast.error('Update failed'),
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Members</h2>
          <p className="text-text-secondary text-sm mt-1">
            {data?.total ?? '—'} members total
          </p>
        </div>
        <div className="flex gap-2">
          <CapabilityGate platformUiCapability="report-export">
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors text-text-secondary">
              <Download size={15} /> Export
            </button>
          </CapabilityGate>
          <CapabilityGate platformUiCapability="member-manage">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors">
              <UserPlus size={15} /> Add Member
            </button>
          </CapabilityGate>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select
          value={ministry}
          onChange={(e) => { setMinistry(e.target.value as MinistryScope | ''); setPage(1) }}
          className="px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          <option value="">All Ministries</option>
          <option value="CHOIR">Choir</option>
          <option value="PROTOCOL">Protocol</option>
          <option value="BOTH">Both</option>
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as MemberStatus | ''); setPage(1) }}
          className="px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <Card padding="none">
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="px-4"><SkeletonMemberRow /></li>
            ))}
          </ul>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <p className="text-center text-text-muted py-12 text-sm">
            No members match your filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data?.items?.map((m) => (
              <li key={m.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors">
                <Avatar name={m.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{m.name}</p>
                  <p className="text-xs text-text-muted truncate">{m.email}</p>
                </div>
                <Badge variant={MINISTRY_BADGE[m.ministry]}>{m.ministry}</Badge>
                <Badge variant={STATUS_BADGE[m.status]}>{m.status}</Badge>
                {m.attendanceRate != null && (
                  <span className="text-xs text-text-muted hidden md:block w-14 text-right">
                    {m.attendanceRate}%
                  </span>
                )}
                <CapabilityGate platformUiCapability="member-manage">
                  <select
                    value={m.status}
                    onChange={(e) => updateStatus.mutate({ id: m.id, status: e.target.value as MemberStatus })}
                    className="text-xs border border-border rounded px-2 py-1 bg-surface focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </CapabilityGate>
              </li>
            ))}
          </ul>
        )}

        {(data?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-text-muted">
              Page {data?.page} of {data?.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-border hover:bg-surface-raised disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data?.totalPages ?? 1)}
                className="p-1.5 rounded border border-border hover:bg-surface-raised disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
