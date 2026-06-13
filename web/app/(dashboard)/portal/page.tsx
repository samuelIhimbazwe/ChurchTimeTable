'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemberPortalHome } from '@/lib/hooks/useMemberPortalHome'
import { authApi, choirApi, protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import {
  MapPin, BookOpen, Megaphone, Music, Shield, Building2,
  UserPlus, ExternalLink, Radio, Calendar, Sparkles, X,
  ChevronRight, Video, VideoOff, HeartHandshake,
} from 'lucide-react'
import { PrayerRequestForm } from '@/components/portal/PrayerRequestForm'
import {
  filterVisiblePortalChoirs,
  normalizePendingChoirJoinRequests,
  resolveChoirPortalActions,
} from '@/lib/choir/membership-display'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { ChoirDashboardEntryButton } from '@/components/choir/ChoirDashboardEntryButton'
import { ProtocolDashboardEntryButton } from '@/components/protocol/ProtocolDashboardEntryButton'
import { ProtocolMyInvitationsCard } from '@/components/protocol/ProtocolMyInvitationsCard'
import { ChoirPortalJoinControls } from '@/components/portal/ChoirPortalJoinControls'
import { ChoirJoinRequestForm } from '@/components/portal/ChoirJoinRequestForm'
import { PortalMyWeekCard } from '@/components/portal/PortalMyWeekCard'
import type { MemberPortalServiceCard } from '@/lib/api/modules/memberPortal'

function mapPreviewUrl(location: {
  mapEmbedUrl: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null
  directionsUrl: string | null
}) {
  if (location.mapEmbedUrl) return { embed: location.mapEmbedUrl, link: location.directionsUrl }
  if (location.latitude != null && location.longitude != null) {
    const link = location.directionsUrl
      ?? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`
    const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01}%2C${location.latitude - 0.01}%2C${location.longitude + 0.01}%2C${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`
    return { embed, link }
  }
  const query = [location.address, location.city].filter(Boolean).join(', ')
  if (query) {
    return {
      embed: null,
      link: location.directionsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(query)}`,
    }
  }
  return { embed: null, link: location.directionsUrl }
}

function ServiceCard({ service }: { service: MemberPortalServiceCard }) {
  const next = service.nextOccurrence
  return (
    <Card padding="md" className="h-full">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-text-primary">{service.name}</p>
          {service.code === 'IGABURO' && (
            <Badge variant="default">Members</Badge>
          )}
        </div>
        {service.description && (
          <p className="text-xs text-text-muted line-clamp-2">{service.description}</p>
        )}
        {next ? (
          <p className="text-sm text-text-secondary">
            <Calendar size={13} className="inline mr-1 -mt-0.5" />
            {formatDate(next.startAt)} · {formatTime(next.startAt)}
          </p>
        ) : (
          <p className="text-xs text-text-muted">No upcoming date scheduled</p>
        )}
        {service.liveStreamUrl && !service.liveStreamRestricted ? (
          <a
            href={service.liveStreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800"
          >
            <Video size={14} /> Watch live
          </a>
        ) : service.liveStreamRestricted ? (
          <p className="text-xs text-text-muted flex items-start gap-1.5">
            <VideoOff size={14} className="shrink-0 mt-0.5" />
            {service.restrictionReason ?? 'No live stream for this service.'}
          </p>
        ) : null}
      </div>
    </Card>
  )
}

export default function MemberPortalPage() {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useMemberPortalHome()
  const { activeChoirMemberships } = useChoirAccess()
  const { data: myJoinRequests } = useQuery({
    queryKey: ['choir-join-requests', 'mine'],
    queryFn: choirApi.getMyJoinRequests,
  })
  const pendingRequests = normalizePendingChoirJoinRequests(myJoinRequests)
  const [joiningChoirId, setJoiningChoirId] = useState<string | null>(null)
  const [joinMessage, setJoinMessage] = useState('')
  const [joinRequestType, setJoinRequestType] = useState('PERMANENT_MEMBER')
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false)
  const [showPrayerForm, setShowPrayerForm] = useState(false)

  const joinChoir = useMutation({
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
      toast.success('Choir join request submitted')
      qc.invalidateQueries({ queryKey: ['member-portal'] })
      qc.invalidateQueries({ queryKey: ['choir-join-requests'] })
      setJoiningChoirId(null)
      setJoinMessage('')
      setJoinRequestType('PERMANENT_MEMBER')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Could not submit join request'
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

  const claimProtocol = useMutation({
    mutationFn: () => protocolApi.submitClaim(),
    onSuccess: () => {
      toast.success('Protocol membership claim submitted')
      qc.invalidateQueries({ queryKey: ['member-portal'] })
    },
    onError: () => toast.error('Could not submit claim'),
  })

  const completeOnboarding = useMutation({
    mutationFn: () => authApi.completeOnboarding(),
    onSuccess: () => {
      setDismissedOnboarding(true)
      qc.invalidateQueries({ queryKey: ['member-portal'] })
      qc.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <SkeletonCard rows={2} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} rows={2} />)}
        </div>
        <SkeletonCard rows={5} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState
          title="Could not load your dashboard"
          description="Please check your connection and try again."
        />
        <div className="text-center mt-4">
          <button
            onClick={() => refetch()}
            className="text-sm font-semibold text-primary-600 hover:text-primary-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { welcome, location, spiritual, prayWithUs, services, events,
    weeklyActivitiesPreview, ministries, choirs, protocol, announcements,
    liveBroadcast, onboarding, participation } = data
  const visibleChoirs = filterVisiblePortalChoirs(activeChoirMemberships, choirs)
  const previewChoirs = visibleChoirs.slice(0, 5)
  const mapInfo = mapPreviewUrl(location)
  const showOnboarding = onboarding.showPrompt && !dismissedOnboarding
  const verse = spiritual.verseOfDay

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8">

      {/* Welcome */}
      <section className="space-y-3">
      <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
            {welcome.churchName}
          </p>
          <h1 className="font-display italic text-4xl text-text-primary leading-tight mt-1">
            Welcome, {welcome.firstName}.
          </h1>
          {welcome.welcomeMessage && (
            <p className="text-text-secondary mt-2 text-sm max-w-2xl leading-relaxed">
              {welcome.welcomeMessage}
            </p>
          )}
      </div>
        {welcome.pendingApproval && (
          <Card accent="warning" padding="md">
            <p className="text-sm text-text-primary">
              Your registration is being reviewed by church leadership.
              You can explore church information here; full ministry access unlocks after approval.
            </p>
          </Card>
        )}
      </section>

      {/* Onboarding */}
      {showOnboarding && (
        <Card accent="gold" padding="md">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-gold-700" />
                <p className="font-semibold text-text-primary">Welcome to our church family</p>
              </div>
              <p className="text-sm text-text-secondary">
                Browse services, ministries, and ways to serve. When you are ready,
                request to join a choir or claim protocol membership if you already serve.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => completeOnboarding.mutate()}
                  disabled={completeOnboarding.isPending}
                  className="px-3 py-1.5 text-xs font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400"
                >
                  Got it
                </button>
                <button
                  onClick={() => setDismissedOnboarding(true)}
                  className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised"
                >
                  Remind me later
                </button>
              </div>
            </div>
            <button
              onClick={() => setDismissedOnboarding(true)}
              className="text-text-muted hover:text-text-primary"
              aria-label="Dismiss"
            >
              <X size={16} />
              </button>
          </div>
        </Card>
      )}

      {/* Scripture + Pray with us */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card accent="info" padding="md">
          <div className="flex items-start gap-3">
            <BookOpen size={20} className="text-info shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-info">Scripture</p>
              {verse ? (
                <>
                  <p className="text-sm text-text-primary mt-2 leading-relaxed line-clamp-4">
                    {verse.verseText ?? verse.content ?? verse.title}
                  </p>
                  {verse.verseReference && (
                    <p className="text-xs text-text-muted mt-2 font-medium">— {verse.verseReference}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-text-muted mt-2">Verse of the day will appear here.</p>
              )}
              <Link
                href="/portal/devotion"
                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-primary-600"
              >
                Devotion center <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </Card>

        <Card accent="gold" padding="md">
          <div className="flex items-start gap-3">
            <HeartHandshake size={20} className="text-gold-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                Pray with us
              </p>
              <div className="mt-2 space-y-2">
                {(prayWithUs?.twoDayPrayers ?? []).slice(0, 2).map((p) => (
                  <div key={p.id}>
                    <p className="text-xs font-semibold text-gold-800">{p.dayLabel}</p>
                    <p className="text-sm text-text-primary line-clamp-2">{p.content}</p>
                  </div>
                ))}
                {(prayWithUs?.twoDayPrayers?.length ?? 0) === 0 && (
                  <p className="text-sm text-text-muted">Two-day prayer guide coming soon.</p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  href="/portal/devotion"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                >
                  More devotion
                </Link>
                {!showPrayerForm ? (
                  <button
                    type="button"
                    onClick={() => setShowPrayerForm(true)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                  >
                    Prayer request (ibyifuzo)
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          {showPrayerForm && (
            <div className="mt-4 pt-4 border-t border-border">
              <PrayerRequestForm compact initialOpen onSuccess={() => setShowPrayerForm(false)} />
            </div>
          )}
        </Card>
      </div>

      {participation && (
        <PortalMyWeekCard
          isDualMember={participation.isDualMember}
          thisWeek={participation.thisWeek}
          conflicts={participation.conflicts}
        />
      )}

      {(liveBroadcast?.isLive || spiritual.livestream?.isLive) && (
        <Card accent="danger" padding="md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Radio size={20} className="text-danger shrink-0 mt-1 animate-pulse" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-danger">Live now</p>
                <p className="font-semibold text-text-primary mt-1">
                  {(liveBroadcast ?? spiritual.livestream)?.title}
                </p>
              </div>
            </div>
            <a
              href={(liveBroadcast ?? spiritual.livestream)?.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-danger text-white rounded-lg hover:opacity-90"
            >
              Watch <ExternalLink size={12} />
            </a>
          </div>
        </Card>
      )}

      {/* Church location */}
      {(location.address || location.city || mapInfo.embed || mapInfo.link) && (
        <Card padding="md">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin size={18} /> Church location
            </CardTitle>
            <CardDescription>Find us for in-person worship and fellowship</CardDescription>
          </CardHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm text-text-secondary">
              {location.address && <p>{location.address}</p>}
              {location.city && <p>{location.city}</p>}
              {mapInfo.link && (
                <a
                  href={mapInfo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary-600 font-semibold text-xs hover:text-primary-800"
                >
                  Open in maps <ExternalLink size={12} />
                </a>
              )}
            </div>
            {mapInfo.embed && (
              <div className="rounded-lg overflow-hidden border border-border aspect-video min-h-[180px]">
                <iframe
                  title="Church location map"
                  src={mapInfo.embed}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Services */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-text-primary">Services</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Sunday worship, Tuesday service, and Igaburo
            </p>
          </div>
          <Link href="/events" className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1">
            Full calendar <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => <ServiceCard key={s.code} service={s} />)}
        </div>
      </section>

      {/* Events + weekly activities (nearest day) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Church events</CardTitle>
            <CardDescription>Concerts, revivals, and special gatherings</CardDescription>
          </CardHeader>
          {events.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">No upcoming special events.</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.slice(0, 5).map((e) => (
                <li key={e.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-text-primary">{e.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDate(e.startAt)} · {formatTime(e.startAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-border">
            <Link href="/events" className="text-xs font-semibold text-primary-600 flex items-center gap-1">
              All events <ChevronRight size={12} />
            </Link>
          </div>
        </Card>

        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>
              Weekly activities
              {weeklyActivitiesPreview?.dayLabel && (
                <span className="text-sm font-normal text-text-muted ml-2">
                  — {weeklyActivitiesPreview.dayLabel}
                </span>
              )}
            </CardTitle>
            <CardDescription>Regular church and ministry schedule</CardDescription>
          </CardHeader>
          {(weeklyActivitiesPreview?.activities?.length ?? 0) === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">No activities scheduled.</p>
          ) : (
            <ul className="divide-y divide-border">
              {weeklyActivitiesPreview?.activities.map((a) => (
                <li key={a.id}>
                  <Link
                    href="/portal/activities"
                    className="block px-5 py-3 hover:bg-surface-raised transition-colors"
                  >
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {a.startTime}
                      {a.endTime ? ` – ${a.endTime}` : ''}
                      {a.ministryName ? ` · ${a.ministryName}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-border">
            <Link href="/portal/activities" className="text-xs font-semibold text-primary-600 flex items-center gap-1">
              Full weekly schedule <ChevronRight size={12} />
            </Link>
          </div>
        </Card>
      </div>

      {/* Ministries */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-text-primary">Ministries</h2>
            <p className="text-sm text-text-secondary mt-0.5">Serve through church ministries</p>
          </div>
          <Link href="/portal/ministries" className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {ministries.length === 0 ? (
            <EmptyState icon={Building2} title="No ministries listed yet" className="col-span-full py-8" />
          ) : ministries.map((m) => (
            <Card key={m.id} padding="md">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-primary-600" />
                </div>
                <div>
        <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">{m.name}</p>
                    {m.isMember && <Badge variant="status-present">Member</Badge>}
                  </div>
                  {m.description && (
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{m.description}</p>
                  )}
                  <p className="text-xs text-text-muted mt-2">{m.memberCount} members</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Choirs + Protocol */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Music size={18} /> Choirs
            </CardTitle>
            <CardDescription>
              {activeChoirMemberships.length > 0
                ? 'Your choir dashboard and available join options'
                : 'Browse all choirs and request to join'}
            </CardDescription>
          </CardHeader>
          {previewChoirs.length === 0 ? (
            <p className="text-sm text-text-muted">No choir actions available right now.</p>
          ) : (
            <ul className="space-y-3">
              {previewChoirs.map((c) => {
                const actions = resolveChoirPortalActions(
                  activeChoirMemberships,
                  c,
                  pendingRequests,
                )
                return (
                  <li key={c.id} className="py-2 border-b border-border last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/portal/choirs/${c.id}`} className="flex-1 min-w-0 group">
                        <p className="text-sm font-medium text-text-primary group-hover:text-primary-700 dark:group-hover:text-gold-400">
                          {c.name}
                        </p>
                        {c.description && (
                          <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{c.description}</p>
                        )}
                        {c.showMemberCount && c.membershipCount != null && (
                          <p className="text-xs text-text-muted mt-0.5">{c.membershipCount} members</p>
                        )}
                      </Link>
                      {actions.showDashboardButton ? (
                        <ChoirDashboardEntryButton choirId={c.id} className="shrink-0" />
                      ) : (
                        <ChoirPortalJoinControls
                          actions={actions}
                          compact
                          joinLabel="Join"
                          joinPending={joinChoir.isPending && joiningChoirId === c.id}
                          cancelPending={cancelJoin.isPending}
                          onJoin={() => {
                            const opening = joiningChoirId !== c.id
                            setJoiningChoirId(opening ? c.id : null)
                            if (opening) {
                              setJoinMessage('')
                              setJoinRequestType('PERMANENT_MEMBER')
                            }
                          }}
                          onCancelPending={(requestId) => cancelJoin.mutate(requestId)}
                        />
                      )}
                    </div>
                    {joiningChoirId === c.id &&
                      actions.showJoinButton &&
                      !actions.joinBlockedByPending && (
                      <ChoirJoinRequestForm
                        className="mt-3 pt-3 border-t border-border"
                        requestType={joinRequestType}
                        onRequestTypeChange={setJoinRequestType}
                        message={joinMessage}
                        onMessageChange={setJoinMessage}
                        submitting={joinChoir.isPending}
                        onCancel={() => setJoiningChoirId(null)}
                        onSubmit={() =>
                          joinChoir.mutate({
                            choirId: c.id,
                            msg: joinMessage || undefined,
                            type: joinRequestType,
                          })
                        }
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {visibleChoirs.length > 5 && (
            <Link href="/portal/choirs" className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 mt-3">
              Browse all choirs <ChevronRight size={14} />
            </Link>
          )}
        </Card>

        <Card padding="md">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Shield size={18} /> Protocol
            </CardTitle>
            <CardDescription>Hospitality and service coordination</CardDescription>
          </CardHeader>
          <p className="text-sm text-text-secondary">{protocol.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {protocol.isMember ? (
              <>
                <Badge variant="status-present">
                  {participation?.isDualMember ? 'Choir & protocol member' : 'You are a protocol member'}
                </Badge>
                <ProtocolDashboardEntryButton label="Open protocol dashboard" />
              </>
            ) : protocol.status === 'PENDING_CLAIM' ? (
              <Badge variant="status-pending">Membership claim under review</Badge>
            ) : protocol.status === 'PENDING_INVITATION' ? (
              <Badge variant="status-pending">You have a pending invitation</Badge>
            ) : protocol.canClaim ? (
              <button
                onClick={() => claimProtocol.mutate()}
                disabled={claimProtocol.isPending}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
              >
                <UserPlus size={14} /> I am already a protocol member
              </button>
            ) : (
              <p className="text-xs text-text-muted">
                Protocol membership is by invitation or leader approval.
              </p>
            )}
          </div>
          {protocol.status === 'PENDING_INVITATION' && (
            <div className="mt-4">
              <ProtocolMyInvitationsCard />
            </div>
          )}
        </Card>
      </div>

      {/* Announcements */}
      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center gap-2">
            <Megaphone size={18} /> Announcements
          </CardTitle>
          <CardDescription>Updates from our local church</CardDescription>
        </CardHeader>
        {announcements.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">No announcements right now.</p>
        ) : (
          <ul className="divide-y divide-border">
            {announcements.map((a) => (
              <li key={`${a.source}-${a.id}`} className="px-5 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                  {a.pinned && <Badge variant="status-excused">Pinned</Badge>}
                  <Badge variant="default">{a.source === 'church' ? 'Church' : 'Choir'}</Badge>
                  </div>
                <p className="text-sm text-text-secondary mt-1 line-clamp-3">{a.body}</p>
                {a.publishedAt && (
                  <p className="text-xs text-text-muted mt-2">{formatDate(a.publishedAt)}</p>
                )}
                </li>
            ))}
          </ul>
        )}
        <div className="px-5 py-3 border-t border-border">
          <Link href="/announcements" className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1">
            All announcements <ChevronRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  )
}
