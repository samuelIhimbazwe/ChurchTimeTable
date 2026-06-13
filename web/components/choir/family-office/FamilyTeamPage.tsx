'use client'

import { useQuery } from '@tanstack/react-query'
import { familiesApi, financeApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { FamilyRankingsPanel } from '@/components/choir/FamilyRankingsPanel'

export function FamilyTeamPage() {
  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyId = context?.families?.[0]?.familyId

  const { data: familyDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['family-detail', myFamilyId],
    queryFn: () => familiesApi.getById(myFamilyId!),
    enabled: !!myFamilyId,
  })

  if (loadingContext || loadingDetail) return <SkeletonCard rows={5} />

  if (!familyDetail) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Family not found or not assigned.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-text-primary">My team</h2>
        <p className="text-sm text-text-muted mt-0.5">
          {familyDetail.name} · Head: {familyDetail.headName} · {familyDetail.memberCount} members
        </p>
      </div>
      {Array.isArray(familyDetail.members) && familyDetail.members.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
          {(
            familyDetail.members as Array<{
              member?: { firstName?: string; lastName?: string }
              role?: string
            }>
          ).map((m, i) => (
            <li key={i} className="px-4 py-3 text-sm flex justify-between gap-2">
              <span>
                {m.member?.firstName} {m.member?.lastName}
              </span>
              <Badge variant="default">{String(m.role ?? 'MEMBER').replace(/_/g, ' ')}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <Card padding="md">
          <p className="text-sm text-text-secondary">
            Member roster loads from your family record. Contact the coordinator if empty.
          </p>
        </Card>
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
