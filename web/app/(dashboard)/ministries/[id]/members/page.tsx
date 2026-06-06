'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ministriesApi } from '@/lib/api'
import { Card, Avatar, SkeletonMemberRow, EmptyState } from '@/components/shared'
import { Search, Users } from 'lucide-react'

export default function MinistryMembersPage() {
  const { id } = useParams<{ id: string }>()
  const [search, setSearch] = useState('')

  const { data: members, isLoading } = useQuery({
    queryKey: ['ministry-members', id, search],
    queryFn:  () => ministriesApi.getMembers(id, { search: search || undefined }),
    enabled:  !!id,
  })

  const items = Array.isArray(members) ? members : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Ministry Members</h2>
        <p className="text-text-secondary text-sm mt-1">{items.length} members</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <Card padding="none">
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="px-4"><SkeletonMemberRow /></li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <EmptyState icon={Users} title="No members" description="This ministry has no members yet." />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((raw, i) => {
              const m = raw as Record<string, unknown>
              const name = String(m.name ?? (`${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Member'))
              const email = m.email != null ? String(m.email) : undefined
              const role  = m.role != null ? String(m.role) : undefined
              return (
                <li key={String(m.id ?? m.memberId ?? i)} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors">
                  <Avatar name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                    {email && <p className="text-xs text-text-muted truncate">{email}</p>}
                  </div>
                  {role && (
                    <span className="text-xs text-text-muted">{role}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
