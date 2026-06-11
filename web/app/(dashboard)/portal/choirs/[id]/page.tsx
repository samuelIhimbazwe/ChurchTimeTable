'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import { choirApi, ApiError } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { Music, ExternalLink, ChevronRight } from 'lucide-react'
import {
  canAccessChoirPortalProfile,
  normalizePendingChoirJoinRequests,
  normalizePendingChoirSponsorRequests,
  resolveChoirPortalActions,
} from '@/lib/choir/membership-display'
import { isSponsorJoinIntent } from '@/lib/constants/choir-positions'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { ChoirDashboardEntryButton } from '@/components/choir/ChoirDashboardEntryButton'
import { ChoirSponsorEntryButton } from '@/components/choir/ChoirSponsorEntryButton'
import { ChoirPortalJoinControls } from '@/components/portal/ChoirPortalJoinControls'
import { ChoirJoinRequestForm } from '@/components/portal/ChoirJoinRequestForm'

const REDIRECT_TARGET = '/portal/choirs?reason=choir-unavailable'

export default function ChoirDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params.id)
  const qc = useQueryClient()
  const [joinFormOpen, setJoinFormOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [requestType, setRequestType] = useState('PERMANENT_MEMBER')
  const { activeChoirMemberships, isLoading: loadingMembership } = useChoirAccess()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['member-portal', 'choir', id],
    queryFn: () => memberPortalApi.getChoirPublic(id),
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false
      return count < 1
    },
  })

  const { data: myRequests } = useQuery({
    queryKey: ['choir-join-requests', 'mine'],
    queryFn: choirApi.getMyJoinRequests,
  })

  const { data: mySponsorRequests } = useQuery({
    queryKey: ['choir-sponsor-requests', 'mine'],
    queryFn: choirApi.getMySponsorRequests,
  })

  const pendingRequests = normalizePendingChoirJoinRequests(myRequests)
  const pendingSponsorRequests = normalizePendingChoirSponsorRequests(mySponsorRequests)

  const join = useMutation({
    mutationFn: async () => {
      if (isSponsorJoinIntent(requestType)) {
        await choirApi.requestSponsor(id, message || undefined, requestType)
        return
      }
      await choirApi.requestJoin(id, message || undefined, requestType)
    },
    onSuccess: () => {
      toast.success(
        isSponsorJoinIntent(requestType)
          ? 'Sponsor request submitted'
          : 'Join request submitted',
      )
      qc.invalidateQueries({ queryKey: ['member-portal'] })
      qc.invalidateQueries({ queryKey: ['choir-join-requests'] })
      qc.invalidateQueries({ queryKey: ['choir-sponsor-requests'] })
      qc.invalidateQueries({ queryKey: ['choir-membership-access'] })
      setJoinFormOpen(false)
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
      qc.invalidateQueries({ queryKey: ['member-portal'] })
      qc.invalidateQueries({ queryKey: ['choir-join-requests'] })
    },
    onError: () => toast.error('Could not cancel request'),
  })

  const cancelSponsor = useMutation({
    mutationFn: (requestId: string) => choirApi.withdrawSponsorRequest(requestId),
    onSuccess: () => {
      toast.success('Sponsor request cancelled')
      qc.invalidateQueries({ queryKey: ['member-portal'] })
      qc.invalidateQueries({ queryKey: ['choir-sponsor-requests'] })
    },
    onError: () => toast.error('Could not cancel request'),
  })

  const choirPortalActions = useMemo(() => {
    if (!data) return null
    return resolveChoirPortalActions(
      activeChoirMemberships,
      {
        id: data.id,
        code: data.code,
        choirKind: data.choirKind,
        joinStatus: data.joinStatus,
        sponsorStatus: data.sponsorStatus,
        isSponsor: data.isSponsor,
        isPublicJoinable: data.isPublicJoinable,
        pendingSponsorRequestId: data.pendingSponsorRequestId,
      },
      pendingRequests,
      pendingSponsorRequests,
    )
  }, [
    data?.id,
    data?.code,
    data?.choirKind,
    data?.joinStatus,
    data?.sponsorStatus,
    data?.isSponsor,
    data?.isPublicJoinable,
    data?.pendingSponsorRequestId,
    activeChoirMemberships,
    pendingRequests,
    pendingSponsorRequests,
  ])

  const shouldRedirect = useMemo(() => {
    if (isError && error instanceof ApiError && error.status === 404) return true
    if (isLoading || loadingMembership || !choirPortalActions) return false
    return !canAccessChoirPortalProfile(choirPortalActions)
  }, [isError, error, isLoading, loadingMembership, choirPortalActions])

  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!shouldRedirect || redirectedRef.current) return
    redirectedRef.current = true
    router.replace(REDIRECT_TARGET)
  }, [shouldRedirect, router])

  if (isLoading || loadingMembership || shouldRedirect) {
    return (
      <div className="max-w-3xl mx-auto">
        <SkeletonCard rows={5} />
      </div>
    )
  }

  if (!data || !choirPortalActions) {
    return (
      <EmptyState icon={Music} title="Choir not found" description="This choir may no longer be active." />
    )
  }

  const release = data.featuredRelease

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
          <Music size={28} className="text-primary-700" />
        </div>
        <div>
          <h1 className="font-display text-3xl text-text-primary">{data.name}</h1>
          <p className="text-xs text-text-muted mt-1">{data.code.replace(/_/g, ' ')}</p>
          {data.leader && (
            <p className="text-sm text-text-secondary mt-2">Led by {data.leader}</p>
          )}
        </div>
      </div>

      {(data.publicSummary || data.description) && (
        <Card padding="md">
          <p className="text-sm font-semibold text-text-primary mb-2">About</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {data.publicSummary ?? data.description}
          </p>
        </Card>
      )}

      {release?.url && (
        <Card padding="md" accent="gold">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700 mb-2">
            Recent release
          </p>
          <p className="font-semibold text-text-primary">{release.title}</p>
          {release.description && (
            <p className="text-sm text-text-secondary mt-1">{release.description}</p>
          )}
          <a
            href={release.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary-600 hover:text-primary-800"
          >
            Listen / watch <ExternalLink size={14} />
          </a>
        </Card>
      )}

      {data.showMemberCount && data.memberCount != null && (
        <p className="text-sm text-text-muted">{data.memberCount} members</p>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-start">
          {choirPortalActions.showDashboardButton && (
            <>
              <Badge variant="status-present">You are a member</Badge>
              <ChoirDashboardEntryButton choirId={data.id} label="Open choir dashboard" />
            </>
          )}
          {choirPortalActions.showSponsorDashboardButton && (
            <>
              <Badge variant="status-present">You are a sponsor</Badge>
              <ChoirSponsorEntryButton choirId={data.id} label="Open sponsor dashboard" />
            </>
          )}
          {!choirPortalActions.showDashboardButton &&
            !choirPortalActions.showSponsorDashboardButton && (
            <ChoirPortalJoinControls
              actions={choirPortalActions}
              joinLabel="Join"
              joinPending={join.isPending}
              cancelPending={cancelJoin.isPending || cancelSponsor.isPending}
              onJoin={() => setJoinFormOpen((open) => !open)}
              onCancelPending={(requestId) => {
                if (choirPortalActions.isPendingSponsor) {
                  cancelSponsor.mutate(requestId)
                } else {
                  cancelJoin.mutate(requestId)
                }
              }}
            />
          )}
        </div>

        {joinFormOpen &&
          choirPortalActions.showJoinButton &&
          !choirPortalActions.joinBlockedByPending && (
          <Card padding="md">
            <ChoirJoinRequestForm
              requestType={requestType}
              onRequestTypeChange={setRequestType}
              message={message}
              onMessageChange={setMessage}
              submitting={join.isPending}
              onCancel={() => setJoinFormOpen(false)}
              onSubmit={() => join.mutate()}
            />
          </Card>
        )}
      </div>

      <Link
        href="/portal/choirs"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
      >
        Browse all choirs <ChevronRight size={14} />
      </Link>
    </div>
  )
}
