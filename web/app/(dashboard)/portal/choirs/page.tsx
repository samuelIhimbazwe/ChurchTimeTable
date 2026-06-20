'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { Music, ChevronRight } from 'lucide-react'
import {
  filterVisiblePortalChoirs,
  normalizePendingChoirJoinRequests,
  resolveChoirPortalActions,
} from '@/lib/choir/membership-display'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { ChoirDashboardEntryButton } from '@/components/choir/ChoirDashboardEntryButton'
import { ChoirAccessNotice } from '@/components/portal/ChoirAccessNotice'
import { ChoirPortalJoinControls } from '@/components/portal/ChoirPortalJoinControls'
import { ChoirJoinRequestForm } from '@/components/portal/ChoirJoinRequestForm'
import { joinRequestFormSchema } from '@/lib/validation/schemas'

function PortalChoirsContent() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [requestType, setRequestType] = useState('PERMANENT_MEMBER')
  const [requestTypeError, setRequestTypeError] = useState<string | undefined>()

  const { data: choirs, isLoading: loadingChoirs } = useQuery({
    queryKey: ['member-portal', 'public-choirs'],
    queryFn: memberPortalApi.getPublicChoirs,
  })

  const { data: myRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['choir-join-requests', 'mine'],
    queryFn: choirApi.getMyJoinRequests,
  })

  const { activeChoirMemberships, isLoading: loadingMembership } = useChoirAccess()

  const join = useMutation({
    mutationFn: ({
      choirId,
      msg,
      type,
    }: {
      choirId: string
      msg?: string
      type?: string
    }) => choirApi.requestJoin(choirId, msg, type),
    onSuccess: () => {
      toast.success('Join request submitted')
      qc.invalidateQueries({ queryKey: ['choir-join-requests'] })
      qc.invalidateQueries({ queryKey: ['member-portal'] })
      qc.invalidateQueries({ queryKey: ['choir-membership-access'] })
      setSelectedId(null)
      setMessage('')
      setRequestType('PERMANENT_MEMBER')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Request failed'
      toast.error(msg)
    },
  })

  const cancelJoin = useMutation({
    mutationFn: (requestId: string) => choirApi.withdrawJoinRequest(requestId),
    onSuccess: () => {
      toast.success('Join request cancelled')
      qc.invalidateQueries({ queryKey: ['choir-join-requests'] })
      qc.invalidateQueries({ queryKey: ['member-portal'] })
      qc.invalidateQueries({ queryKey: ['choir-membership-access'] })
    },
    onError: () => toast.error('Could not cancel request'),
  })

  const pendingRequests = normalizePendingChoirJoinRequests(myRequests)

  const isLoading = loadingChoirs || loadingRequests || loadingMembership
  const visibleChoirs = filterVisiblePortalChoirs(activeChoirMemberships, choirs ?? [])
  const hasPrimaryMembership = activeChoirMemberships.some(
    (m) => m.code !== 'YERUSALEMU' && (m.kind === 'PRIMARY' || m.kind === 'CHILDREN'),
  )
  const hasPendingJoinRequest =
    (choirs?.some((c) => c.joinStatus === 'PENDING' || c.joinStatus === 'NEEDS_INFO') ?? false) ||
    (myRequests?.some((r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO') ?? false)

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Choirs</h2>
        <p className="text-text-secondary text-sm mt-1">
          {activeChoirMemberships.length > 0
            ? hasPrimaryMembership
              ? 'Open your choir dashboard here. You may also request to join Yerusalemu (morning service). Other choirs are hidden once you belong to a primary choir.'
              : 'Open your choir dashboard or request to join another choir.'
            : 'Browse all choirs below and request to join the one you belong to.'}
        </p>
      </div>

      <ChoirAccessNotice hasPendingJoinRequest={hasPendingJoinRequest} />

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (choirs?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Music}
          title="No choirs available"
          description="Choir listings will appear here when configured."
        />
      ) : visibleChoirs.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No choirs to show"
          description="Your current choir memberships are listed in the member portal. Additional join options are limited by church membership rules."
        />
      ) : (
        <div className="space-y-4">
          {visibleChoirs.map((choir) => {
            const actions = resolveChoirPortalActions(
              activeChoirMemberships,
              choir,
              pendingRequests,
            )
            const isOpen = selectedId === choir.id

            return (
              <Card key={choir.id} padding="md">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/portal/choirs/${choir.id}`} className="flex items-start gap-3 flex-1 min-w-0 group">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <Music size={18} className="text-primary-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary group-hover:text-primary-700">
                        {choir.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {choir.code.replace(/_/g, ' ')}
                      </p>
                      {choir.description && (
                        <p className="text-sm text-text-secondary mt-2 line-clamp-3">
                          {choir.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {choir.showMemberCount && choir.membershipCount != null && (
                          <Badge variant="ministry-choir">{choir.membershipCount} members</Badge>
                        )}
                        {actions.isActiveMember && (
                          <Badge variant="status-present">Member</Badge>
                        )}
                      </div>
                      {actions.showDashboardButton ? (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <ChoirDashboardEntryButton choirId={choir.id} />
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 mt-2">
                          View choir <ChevronRight size={12} />
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="shrink-0 flex flex-col items-end gap-2 max-w-[200px]">
                    <ChoirPortalJoinControls
                      actions={actions}
                      compact
                      joinLabel="Join"
                      joinPending={join.isPending && selectedId === choir.id}
                      cancelPending={cancelJoin.isPending}
                      onJoin={() => setSelectedId(isOpen ? null : choir.id)}
                      onCancelPending={(requestId) => cancelJoin.mutate(requestId)}
                    />
                  </div>
                </div>

                {isOpen && actions.showJoinButton && !actions.joinBlockedByPending && (
                  <ChoirJoinRequestForm
                    className="mt-4 pt-4 border-t border-border"
                    requestType={requestType}
                    onRequestTypeChange={(v) => {
                      setRequestType(v)
                      setRequestTypeError(undefined)
                    }}
                    message={message}
                    onMessageChange={setMessage}
                    requestTypeError={requestTypeError}
                    submitting={join.isPending}
                    onCancel={() => setSelectedId(null)}
                    onSubmit={() => {
                      const parsed = joinRequestFormSchema.safeParse({ requestType, message })
                      if (!parsed.success) {
                        const typeErr = parsed.error.flatten().fieldErrors.requestType?.[0]
                        setRequestTypeError(typeErr)
                        return
                      }
                      join.mutate({
                        choirId: choir.id,
                        msg: message || undefined,
                        type: requestType,
                      })
                    }}
                  />
                )}
              </Card>
            )
          })}
        </div>
      )}

      {(myRequests?.length ?? 0) > 0 && (
        <Card padding="md">
          <p className="text-sm font-semibold text-text-primary mb-3">My requests</p>
          <ul className="space-y-2">
            {myRequests?.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0"
              >
                <span className="text-text-primary">{req.choirName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      req.status === 'APPROVED' ? 'status-present' :
                      req.status === 'REJECTED' ? 'status-absent' :
                                                  'status-pending'
                    }
                  >
                    {req.status}
                  </Badge>
                  {(req.status === 'PENDING' || req.status === 'NEEDS_INFO') && (
                    <button
                      type="button"
                      onClick={() => cancelJoin.mutate(req.id)}
                      disabled={cancelJoin.isPending}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-950 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  )}
                  <span className="text-xs text-text-muted">{formatDate(req.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

export default function PortalChoirsPage() {
  return (
    <Suspense fallback={null}>
      <PortalChoirsContent />
    </Suspense>
  )
}
