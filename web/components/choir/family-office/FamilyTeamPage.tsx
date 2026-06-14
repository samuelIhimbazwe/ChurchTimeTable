'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { familiesApi, financeApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { FamilyRankingsPanel } from '@/components/choir/FamilyRankingsPanel'
import { SplitQueueConsole } from '@/components/shared/office/SplitQueueConsole'
import { Member360Panel } from '@/components/choir/family-office/Member360Panel'
import { useResolvedChoirScope } from '@/lib/hooks'

type FamilyMemberRow = {
  id: string
  memberId: string
  role: string
  member?: {
    id?: string
    memberNumber?: string | null
    firstName?: string
    lastName?: string
    status?: string
  } | null
}

export function FamilyTeamPage() {
  const { choirLink } = useResolvedChoirScope()
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [member360Id, setMember360Id] = useState<string | null>(null)

  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyId = context?.families?.[0]?.familyId
  const contributionsPath = `${choirLink('/contributions')}`

  const { data: familyDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['family-detail', myFamilyId],
    queryFn: () => familiesApi.getById(myFamilyId!),
    enabled: !!myFamilyId,
  })

  const members = (familyDetail?.members ?? []) as FamilyMemberRow[]
  const selectedMember = members.find((row) => row.memberId === selectedMemberId) ?? null

  if (loadingContext || loadingDetail) return <SkeletonCard rows={5} />

  if (!familyDetail) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Family not found or not assigned.</p>
      </Card>
    )
  }

  const headName = familyDetail.headMember
    ? `${familyDetail.headMember.firstName ?? ''} ${familyDetail.headMember.lastName ?? ''}`.trim()
    : '—'

  return (
    <div className="space-y-4">
      <SplitQueueConsole
        title="My team"
        subtitle={`${familyDetail.familyName} · Head: ${headName} · ${members.length} members`}
        queueTitle="Family members"
        queueCount={members.length}
        items={members}
        selectedId={selectedMemberId}
        onSelect={setSelectedMemberId}
        getItemId={(row) => row.memberId}
        mobileShowDetail={mobileShowDetail}
        onMobileShowDetail={setMobileShowDetail}
        isLoading={false}
        emptyState={
          <Card padding="md">
            <p className="text-sm text-text-secondary text-center py-8">
              Member roster loads from your family record. Contact the coordinator if empty.
            </p>
          </Card>
        }
        renderQueueRow={(row) => (
          <div className="flex justify-between gap-2 items-start">
            <div>
              <p className="font-medium text-sm">
                {row.member?.firstName} {row.member?.lastName}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {row.member?.memberNumber ?? 'No member number'}
              </p>
            </div>
            <Badge variant="default">{String(row.role ?? 'MEMBER').replace(/_/g, ' ')}</Badge>
          </div>
        )}
        renderDetail={(row) =>
          row ? (
            <Card padding="md" className="min-h-[420px]">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">Member</p>
                  <p className="font-display text-xl font-bold mt-1">
                    {row.member?.firstName} {row.member?.lastName}
                  </p>
                  <p className="text-sm text-text-muted mt-0.5">
                    {row.member?.memberNumber ?? '—'} ·{' '}
                    {String(row.role ?? 'MEMBER').replace(/_/g, ' ')}
                  </p>
                  {row.member?.status && (
                    <Badge variant="default" className="mt-2">
                      {row.member.status.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMember360Id(row.memberId)}
                  className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 transition-colors"
                >
                  Open member profile
                </button>
              </div>
            </Card>
          ) : null
        }
      />

      {member360Id && myFamilyId && (
        <Member360Panel
          familyId={myFamilyId}
          memberId={member360Id}
          memberName={
            selectedMember?.member
              ? `${selectedMember.member.firstName ?? ''} ${selectedMember.member.lastName ?? ''}`.trim()
              : undefined
          }
          memberNumber={selectedMember?.member?.memberNumber}
          contributionsPath={contributionsPath}
          onClose={() => setMember360Id(null)}
        />
      )}
    </div>
  )
}

export function FamilyParticipationPage() {
  const { data: context } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyId = context?.families?.[0]?.familyId

  if (!myFamilyId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">No family assigned.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-text-primary">Participation</h2>
        <p className="text-sm text-text-muted mt-0.5">Family rankings and attendance context.</p>
      </div>
      <FamilyRankingsPanel familyId={myFamilyId} showOverview={false} />
    </div>
  )
}
