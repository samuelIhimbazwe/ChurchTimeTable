'use client'

import { useParams, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { financeApi, familiesApi } from '@/lib/api'
import { DecisionConsole } from '@/components/choir/family-office/DecisionConsole'
import { Card, SkeletonCard } from '@/components/shared'
import type { FamilyOfficeKind } from '@/lib/choir/family-office'

function officeKindFromPath(pathname: string): FamilyOfficeKind {
  if (pathname.includes('/family-deputy')) return 'deputy'
  return 'leadership'
}

export function FamilyDecisionsPage() {
  const params = useParams()
  const pathname = usePathname()
  const choirId = String(params.choirId)
  const officeKind = officeKindFromPath(pathname)

  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyMeta = context?.families?.find((f) =>
    officeKind === 'deputy' ? f.role === 'ASSISTANT_HEAD' : f.role === 'HEAD',
  ) ?? context?.families?.[0]

  const myFamilyId = myFamilyMeta?.familyId

  const { data: familyDetail } = useQuery({
    queryKey: ['family-detail', myFamilyId],
    queryFn: () => familiesApi.getById(myFamilyId!),
    enabled: !!myFamilyId,
  })

  if (loadingContext) return <SkeletonCard rows={8} />

  if (!myFamilyId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-6">No family assigned.</p>
      </Card>
    )
  }

  return (
    <DecisionConsole
      choirId={choirId}
      familyId={myFamilyId}
      officeKind={officeKind}
      canApprove={myFamilyMeta?.canApprove ?? false}
      isDeputy={officeKind === 'deputy'}
      familyName={myFamilyMeta?.familyName ?? 'Your family'}
      headName={myFamilyMeta?.headName ?? familyDetail?.headName}
    />
  )
}
