'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi, choirApi, protocolApi } from '@/lib/api'
import {
  Card, Avatar, Badge, SkeletonMemberRow, EmptyState,
} from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { Users, Music, Shield, Check, X } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { Member, ChoirJoinRequest } from '@/types'

type Tab = 'members' | 'choir' | 'protocol'

export default function ApprovalsPage() {
  const [tab, setTab] = useState<Tab>('members')
  const qc = useQueryClient()

  const { data: pendingMembers, isLoading: mLoading } = useQuery({
    queryKey: ['approvals', 'members'],
    queryFn:  () => membersApi.getAll({ status: 'PENDING' as Member['status'], limit: 50 }),
    enabled:  tab === 'members',
  })

  const { data: joinRequests, isLoading: cLoading } = useQuery({
    queryKey: ['approvals', 'choir-join'],
    queryFn:  () => choirApi.getJoinRequests({ status: 'PENDING' }),
    enabled:  tab === 'choir',
  })

  const { data: claims, isLoading: pLoading } = useQuery({
    queryKey: ['approvals', 'protocol-claims'],
    queryFn:  protocolApi.getClaims,
    enabled:  tab === 'protocol',
  })

  const approveMember = useMutation({
    mutationFn: (id: string) => membersApi.updateStatus(id, 'ACTIVE'),
    onSuccess: () => {
      toast.success('Member approved')
      qc.invalidateQueries({ queryKey: ['approvals', 'members'] })
    },
    onError: () => toast.error('Approval failed'),
  })

  const reviewJoin = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED' | 'REJECTED' }) =>
      choirApi.reviewJoinRequest(id, action),
    onSuccess: () => {
      toast.success('Join request reviewed')
      qc.invalidateQueries({ queryKey: ['approvals', 'choir-join'] })
    },
    onError: () => toast.error('Review failed'),
  })

  const reviewClaim = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED' | 'REJECTED' }) =>
      protocolApi.reviewClaim(id, action),
    onSuccess: () => {
      toast.success('Claim reviewed')
      qc.invalidateQueries({ queryKey: ['approvals', 'protocol-claims'] })
    },
    onError: () => toast.error('Review failed'),
  })

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'members',  label: 'Pending Members',  icon: Users },
    { id: 'choir',    label: 'Choir Join Requests', icon: Music },
    { id: 'protocol', label: 'Protocol Claims',  icon: Shield },
  ]

  const pendingClaims = (claims ?? []).filter((c) => {
    const status = (c as Record<string, unknown>).status
    return status == null || status === 'PENDING'
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Approvals</h2>
        <p className="text-text-secondary text-sm mt-1">
          Review pending member registrations, choir joins, and protocol claims
        </p>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-border pb-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t.id
                  ? 'bg-primary-700 text-white'
                  : 'text-text-secondary hover:bg-surface-raised'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      <Card padding="none">
        {tab === 'members' && (
          mLoading ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="px-4"><SkeletonMemberRow /></li>
              ))}
            </ul>
          ) : (pendingMembers?.items?.length ?? 0) === 0 ? (
            <EmptyState icon={Users} title="No pending members" description="All member registrations have been reviewed." />
          ) : (
            <ul className="divide-y divide-border">
              {pendingMembers?.items?.map((m) => (
                <li key={m.id} className="flex items-center gap-4 px-5 py-4">
                  <Avatar name={m.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{m.name}</p>
                    <p className="text-xs text-text-muted">{m.email}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Applied {formatDate(m.memberSince)}
                    </p>
                  </div>
                  <Badge variant="status-excused">PENDING</Badge>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMember.mutate(m.id)}
                      disabled={approveMember.isPending}
                      className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                      title="Approve"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => membersApi.updateStatus(m.id, 'INACTIVE').then(() => {
                        toast.success('Member rejected')
                        qc.invalidateQueries({ queryKey: ['approvals', 'members'] })
                      })}
                      className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'choir' && (
          cLoading ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="px-4"><SkeletonMemberRow /></li>
              ))}
            </ul>
          ) : (joinRequests?.length ?? 0) === 0 ? (
            <EmptyState icon={Music} title="No join requests" description="No pending choir join requests." />
          ) : (
            <ul className="divide-y divide-border">
              {joinRequests?.map((r: ChoirJoinRequest) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{r.choirName}</p>
                    <p className="text-xs text-text-muted">
                      Member {r.memberId.slice(0, 8)}… · {formatDate(r.createdAt)}
                    </p>
                    {r.message && (
                      <p className="text-xs text-text-muted mt-1">{r.message}</p>
                    )}
                  </div>
                  <Badge variant="status-excused">{r.status}</Badge>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewJoin.mutate({ id: r.id, action: 'APPROVED' })}
                      disabled={reviewJoin.isPending}
                      className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => reviewJoin.mutate({ id: r.id, action: 'REJECTED' })}
                      disabled={reviewJoin.isPending}
                      className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'protocol' && (
          pLoading ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="px-4"><SkeletonMemberRow /></li>
              ))}
            </ul>
          ) : pendingClaims.length === 0 ? (
            <EmptyState icon={Shield} title="No protocol claims" description="No pending protocol claims to review." />
          ) : (
            <ul className="divide-y divide-border">
              {pendingClaims.map((raw, i) => {
                const c = raw as Record<string, unknown>
                return (
                  <li key={String(c.id ?? i)} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {String(c.memberName ?? c.claimantName ?? `Claim ${String(c.id).slice(0, 8)}`)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {String(c.message ?? c.reason ?? '')}
                      </p>
                      {c.createdAt != null && (
                        <p className="text-xs text-text-muted mt-0.5">{formatDate(String(c.createdAt))}</p>
                      )}
                    </div>
                    <Badge variant="status-excused">{String(c.status ?? 'PENDING')}</Badge>
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewClaim.mutate({ id: String(c.id), action: 'APPROVED' })}
                        disabled={reviewClaim.isPending}
                        className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => reviewClaim.mutate({ id: String(c.id), action: 'REJECTED' })}
                        disabled={reviewClaim.isPending}
                        className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        )}
      </Card>
    </div>
  )
}
