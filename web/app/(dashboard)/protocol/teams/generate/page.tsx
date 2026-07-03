'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { ApiError } from '@/lib/api/client'
import {
  Card, CardHeader, CardTitle, Badge, CapabilityGate, SkeletonCard,
  PageContainer, PageHeader,
} from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { ProtocolOccurrenceCalendarPicker } from '@/components/protocol/ProtocolOccurrenceCalendarPicker'
import { ProtocolTeamDragBuilder } from '@/components/protocol/ProtocolTeamDragBuilder'
import Link from 'next/link'
import { Calendar, Wand2 } from 'lucide-react'

export default function GenerateTeamPage() {
  const router = useRouter()
  const [occurrenceId, setOccurrenceId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'calendar' | 'builder'>('calendar')

  const { data: occurrences, isLoading } = useQuery({
    queryKey: ['protocol-team-occurrences'],
    queryFn: protocolApi.listTeamOccurrences,
  })

  const { data: recommendations, isLoading: loadingRecs } = useQuery({
    queryKey: ['protocol-recommendations', occurrenceId],
    queryFn: () => protocolApi.getRecommendations(occurrenceId),
    enabled: !!occurrenceId,
  })

  const [randomizeLeader, setRandomizeLeader] = useState(false)

  const selectedOccurrence = occurrences?.find((o) => o.id === occurrenceId)

  const rosterRecommendations = recommendations ?? []

  function pickAutoRoster() {
    return rosterRecommendations.map((r) => r.memberId)
  }

  useEffect(() => {
    if (!rosterRecommendations.length) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(pickAutoRoster()))
    setRandomizeLeader(false)
  }, [recommendations, occurrenceId])

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

  function autoGenerate() {
    const autoPick = pickAutoRoster()
    if (autoPick.length === 0) return
    setSelected(new Set(autoPick))
    setRandomizeLeader(true)
    generate.mutate({ memberIds: autoPick, randomizeLeader: true })
  }

  return (
    <CapabilityGate
      platformUiCapability="protocol-team-manage"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">You do not have permission to build teams.</p>
        </div>
      }
    >
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Build Protocol Team"
            subtitle="Pick a service on the calendar, drag members into the roster, then build"
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
                      disabled={
                        !rosterRecommendations.length ||
                        selectedOccurrence?.hasTeam ||
                        generate.isPending
                      }
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
                <CardTitle>2. Build team ({selected.size} selected)</CardTitle>
              </CardHeader>

              {selectedOccurrence?.hasTeam ? (
                <p className="text-sm text-text-muted mb-4">
                  A team already exists ({selectedOccurrence.teamStatus ?? 'draft'}).
                </p>
              ) : null}

              {loadingRecs ? (
                <SkeletonCard rows={6} />
              ) : rosterRecommendations.length === 0 ? (
                <p className="text-sm text-text-muted">No protocol members available.</p>
              ) : (
                <ProtocolTeamDragBuilder
                  recommendations={rosterRecommendations}
                  selected={selected}
                  onSelectedChange={setSelected}
                  disabled={selectedOccurrence?.hasTeam}
                />
              )}

              <button
                type="button"
                onClick={() => {
                  if (selectedOccurrence?.hasTeam) {
                    router.push(`/protocol/teams/${occurrenceId}`)
                    return
                  }
                  generate.mutate({ randomizeLeader: false })
                }}
                disabled={
                  !occurrenceId ||
                  generate.isPending ||
                  (!selectedOccurrence?.hasTeam && selected.size === 0)
                }
                className="mt-4 w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl hover:bg-primary-800 disabled:opacity-60 transition-colors"
              >
                {generate.isPending
                  ? 'Building…'
                  : selectedOccurrence?.hasTeam
                    ? 'Open existing team'
                    : `Build team (${selected.size} selected)`}
              </button>
            </Card>
          )}
        </div>
      </PageContainer>
    </CapabilityGate>
  )
}
