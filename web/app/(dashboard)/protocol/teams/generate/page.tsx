'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { ApiError } from '@/lib/api/client'
import { Card, CardHeader, CardTitle, Badge, SkeletonCard, PageContainer, PageHeader, AccessRedirectGate } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { ProtocolOccurrenceCalendarPicker } from '@/components/protocol/ProtocolOccurrenceCalendarPicker'
import { ProtocolTeamDragBuilder } from '@/components/protocol/ProtocolTeamDragBuilder'
import Link from 'next/link'
import { Calendar, RefreshCw, Trash2, Wand2 } from 'lucide-react'
import { PROTOCOL_TEAM_AUTO_SIZE } from '@/lib/protocol/team-sizing'

export default function GenerateTeamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const [occurrenceId, setOccurrenceId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'calendar' | 'builder'>('calendar')

  const { data: occurrences, isLoading } = useQuery({
    queryKey: ['protocol-team-occurrences'],
    queryFn: protocolApi.listTeamOccurrences,
  })

  useEffect(() => {
    const fromQuery = searchParams.get('occurrence')
    if (fromQuery && !occurrenceId) {
      setOccurrenceId(fromQuery)
    }
  }, [searchParams, occurrenceId])

  const { data: recommendations, isLoading: loadingRecs } = useQuery({
    queryKey: ['protocol-recommendations', occurrenceId],
    queryFn: () => protocolApi.getRecommendations(occurrenceId),
    enabled: !!occurrenceId,
  })

  const [randomizeLeader, setRandomizeLeader] = useState(false)

  const selectedOccurrence = occurrences?.find((o) => o.id === occurrenceId)
  const hasTeam = !!selectedOccurrence?.hasTeam

  const { data: existingTeam, isLoading: loadingTeam } = useQuery({
    queryKey: ['protocol-team', occurrenceId],
    queryFn: () => protocolApi.getTeamForOccurrence(occurrenceId),
    enabled: !!occurrenceId && hasTeam,
  })

  const rosterRecommendations = recommendations ?? []

  function pickAutoRoster() {
    return rosterRecommendations.map((r) => r.memberId)
  }

  function invalidateTeamQueries() {
    void qc.invalidateQueries({ queryKey: ['protocol-team', occurrenceId] })
    void qc.invalidateQueries({ queryKey: ['protocol-team-occurrences'] })
    void qc.invalidateQueries({ queryKey: ['protocol-teams'] })
  }

  useEffect(() => {
    if (!occurrenceId) return
    if (hasTeam && existingTeam?.members?.length) {
      const official = existingTeam.members
        .filter((m) => m.type === 'OFFICIAL')
        .map((m) => m.memberId)
      setSelected(new Set(official))
      return
    }
    if (!hasTeam && rosterRecommendations.length) {
      setSelected(new Set(pickAutoRoster()))
      setRandomizeLeader(false)
    }
  }, [occurrenceId, hasTeam, existingTeam?.id, recommendations])

  const generate = useMutation({
    mutationFn: (opts?: { memberIds?: string[]; randomizeLeader?: boolean }) => {
      const ids = opts?.memberIds ?? Array.from(selected)
      return protocolApi.generateTeam(occurrenceId, ids, {
        randomizeLeader: opts?.randomizeLeader ?? randomizeLeader,
      })
    },
    onSuccess: (_data, variables) => {
      const count = variables?.memberIds?.length ?? selected.size
      toast.success(`Team built with ${count} members`)
      invalidateTeamQueries()
      router.push(`/protocol/teams/${occurrenceId}`)
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Team build failed — select at least one member and ensure the service has a protocol slot'
      toast.error(msg)
    },
  })

  const saveRoster = useMutation({
    mutationFn: () =>
      protocolApi.updateTeamRoster(existingTeam!.id, Array.from(selected), {
        randomizeLeader,
      }),
    onSuccess: () => {
      toast.success('Team roster saved')
      invalidateTeamQueries()
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Could not save roster'),
  })

  const rebuildTeam = useMutation({
    mutationFn: (opts?: { memberIds?: string[]; randomizeLeader?: boolean }) =>
      protocolApi.rebuildTeam(existingTeam!.id, {
        memberIds: opts?.memberIds ?? Array.from(selected),
        randomizeLeader: opts?.randomizeLeader ?? randomizeLeader,
      }),
    onSuccess: (team) => {
      toast.success('Team rebuilt')
      const official = team.members
        .filter((m) => m.type === 'OFFICIAL')
        .map((m) => m.memberId)
      setSelected(new Set(official))
      invalidateTeamQueries()
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Rebuild failed'),
  })

  const discardTeam = useMutation({
    mutationFn: () => protocolApi.discardTeam(existingTeam!.id),
    onSuccess: () => {
      toast.success('Team discarded — you can build a new roster')
      setSelected(new Set(pickAutoRoster()))
      invalidateTeamQueries()
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Could not discard team'),
  })

  const isBusy =
    generate.isPending ||
    saveRoster.isPending ||
    rebuildTeam.isPending ||
    discardTeam.isPending

  function autoGenerate() {
    const autoPick = pickAutoRoster()
    if (autoPick.length === 0) return
    setSelected(new Set(autoPick))
    setRandomizeLeader(true)
    if (hasTeam && existingTeam) {
      rebuildTeam.mutate({ memberIds: autoPick, randomizeLeader: true })
      return
    }
    generate.mutate({ memberIds: autoPick, randomizeLeader: true })
  }

  function handleDiscard() {
    if (!window.confirm('Discard this team? You can rebuild it afterward.')) return
    discardTeam.mutate()
  }

  function handleRebuild() {
    if (
      !window.confirm(
        'Rebuild this team from the current selection? Existing roster and draft status will be replaced.',
      )
    ) {
      return
    }
    rebuildTeam.mutate({ memberIds: Array.from(selected), randomizeLeader })
  }

  return (
    <AccessRedirectGate
      platformUiCapability="protocol-team-manage"
    >
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Build Protocol Team"
            subtitle="Pick a service, review or edit the roster, then save or rebuild"
            actions={
              <Link
                href="/protocol/scheduling"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800"
              >
                <Calendar size={13} /> Protocol schedule
              </Link>
            }
          />

          <div className="grid lg:grid-cols-2 gap-6">
            <Card padding="md">
              <CardHeader>
                <CardTitle>1. Select service</CardTitle>
              </CardHeader>
              {isLoading ? (
                <SkeletonCard rows={2} />
              ) : (occurrences?.length ?? 0) === 0 ? (
                <p className="text-sm text-text-muted">
                  No upcoming protocol services found.
                </p>
              ) : (
                <ProtocolOccurrenceCalendarPicker
                  occurrences={occurrences ?? []}
                  value={occurrenceId}
                  onChange={setOccurrenceId}
                />
              )}
            </Card>

            {occurrenceId && selectedOccurrence && (
              <Card padding="md">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Selected occurrence
                </p>
                <p className="text-sm font-semibold text-text-primary mt-1">
                  {selectedOccurrence.title}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatDate(selectedOccurrence.startAt)} · {formatTime(selectedOccurrence.startAt)}
                  {' · '}
                  <Badge variant="default">{selectedOccurrence.status}</Badge>
                </p>
                {hasTeam && (
                  <p className="text-xs text-text-muted mt-2">
                    Existing team:{' '}
                    <Badge variant="status-pending">
                      {selectedOccurrence.teamStatus ?? 'GENERATED'}
                    </Badge>
                    {existingTeam && (
                      <>
                        {' · '}
                        <Link
                          href={`/protocol/teams/${occurrenceId}`}
                          className="text-primary-600 hover:text-primary-800 font-semibold"
                        >
                          Open team page
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </Card>
            )}
          </div>

          {occurrenceId && (
            <Card padding="md">
              <CardHeader
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={autoGenerate}
                      disabled={!rosterRecommendations.length || isBusy}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 disabled:opacity-50"
                    >
                      <Wand2 size={13} /> Auto-generate ({PROTOCOL_TEAM_AUTO_SIZE} + random leader)
                    </button>
                    <button
                      type="button"
                      onClick={() => setView(view === 'calendar' ? 'builder' : 'calendar')}
                      className="text-xs font-semibold px-2 py-1 rounded border border-border"
                    >
                      {view === 'builder' ? 'List view' : 'Drag builder'}
                    </button>
                  </div>
                }
              >
                <CardTitle>
                  2. {hasTeam ? 'Edit team' : 'Build team'} ({selected.size} selected)
                </CardTitle>
              </CardHeader>

              {hasTeam && (
                <p className="text-sm text-text-secondary mb-4">
                  This service already has a team. Adjust members below, save your changes, rebuild
                  from recommendations, or discard and start over.
                </p>
              )}

              {loadingRecs || (hasTeam && loadingTeam) ? (
                <SkeletonCard rows={6} />
              ) : rosterRecommendations.length === 0 ? (
                <p className="text-sm text-text-muted">No protocol members available.</p>
              ) : (
                <ProtocolTeamDragBuilder
                  recommendations={rosterRecommendations}
                  selected={selected}
                  onSelectedChange={setSelected}
                />
              )}

              {hasTeam && existingTeam && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => saveRoster.mutate()}
                    disabled={isBusy || selected.size === 0}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60"
                  >
                    {saveRoster.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRebuild}
                    disabled={isBusy || selected.size === 0}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-surface-raised disabled:opacity-60"
                  >
                    <RefreshCw size={13} /> Rebuild team
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-danger text-danger hover:bg-danger-light disabled:opacity-60"
                  >
                    <Trash2 size={13} /> Discard team
                  </button>
                  <label className="inline-flex items-center gap-2 text-xs text-text-muted ml-auto">
                    <input
                      type="checkbox"
                      checked={randomizeLeader}
                      onChange={(e) => setRandomizeLeader(e.target.checked)}
                      className="rounded border-border"
                    />
                    Randomize leader on save/rebuild
                  </label>
                </div>
              )}

              {!hasTeam && (
                <button
                  type="button"
                  onClick={() => generate.mutate({ randomizeLeader: false })}
                  disabled={!occurrenceId || isBusy || selected.size === 0}
                  className="mt-4 w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl hover:bg-primary-800 disabled:opacity-60 transition-colors"
                >
                  {generate.isPending
                    ? 'Building…'
                    : `Build team (${selected.size} selected)`}
                </button>
              )}
            </Card>
          )}
        </div>
      </PageContainer>
    </AccessRedirectGate>
  )
}
