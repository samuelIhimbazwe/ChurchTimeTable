'use client'

import { useEffect } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { familiesApi, financeApi } from '@/lib/api'
import { FamilyLeadershipContributionsHub } from '@/components/choir/FamilyLeadershipContributionsHub'
import { FamilyPaymentSettingsForm } from '@/components/choir/FamilyPaymentSettingsForm'
import { Card, SkeletonCard } from '@/components/shared'
import { familyOfficePath, type FamilyOfficeKind } from '@/lib/choir/family-office'
function officeKindFromPath(pathname: string): FamilyOfficeKind {
  if (pathname.includes('/family-deputy')) return 'deputy'
  if (pathname.includes('/family-coordination')) return 'coordination'
  return 'leadership'
}

export function FamilyContributionsPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const choirId = String(params.choirId)
  const officeKind = officeKindFromPath(pathname)
  const tabParam = searchParams.get('ftab')
  const claimIdParam = searchParams.get('claimId')
  const isHistoryRoute = pathname.includes('/history')
  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyMeta = context?.families?.[0]
  const myFamilyId = myFamilyMeta?.familyId

  useEffect(() => {
    if (tabParam !== 'pending') return
    if (officeKind !== 'leadership' && officeKind !== 'deputy') return
    const decisionsPath = familyOfficePath(choirId, officeKind, 'decisions')
    const suffix = claimIdParam ? `?claimId=${claimIdParam}` : ''
    router.replace(`${decisionsPath}${suffix}`)
  }, [tabParam, officeKind, choirId, claimIdParam, router])

  const defaultTab = isHistoryRoute    ? 'ledger'
    : tabParam === 'pending'
      ? 'pending'
      : officeKind === 'coordination'
        ? 'progress'
        : myFamilyMeta?.role === 'SECRETARY'
          ? 'progress'
          : 'overview'

  const { data: familyDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['family-detail', myFamilyId],
    queryFn: () => familiesApi.getById(myFamilyId!),
    enabled:
      !!myFamilyId &&
      (officeKind === 'leadership' || officeKind === 'deputy'),
  })

  if (loadingContext) return <SkeletonCard rows={6} />

  if (!myFamilyId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-6">No family assigned.</p>
      </Card>
    )
  }

  const title =
    officeKind === 'coordination' || isHistoryRoute
      ? 'Contribution history'
      : myFamilyMeta?.canApprove
        ? 'Contribution governance'
        : 'Contribution status'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-text-primary">{title}</h2>
        {officeKind === 'deputy' && !myFamilyMeta?.canApprove && (
          <p className="text-sm text-text-muted mt-1">
            Read-only — your family head confirms all payments.
          </p>
        )}
      </div>
      <FamilyLeadershipContributionsHub
        familyId={myFamilyId}
        defaultTab={defaultTab as 'overview' | 'pending' | 'progress' | 'ledger'}
        paymentSettingsSlot={
          officeKind === 'leadership' &&
          !loadingDetail &&
          familyDetail &&
          myFamilyMeta?.role === 'HEAD' ? (
            <FamilyPaymentSettingsForm
              familyId={myFamilyId}
              initial={{
                paymentMomoNumber: familyDetail.paymentMomoNumber ?? null,
                paymentMomoAccountName: familyDetail.paymentMomoAccountName ?? null,
                paymentBankAccount: familyDetail.paymentBankAccount ?? null,
                paymentBankName: familyDetail.paymentBankName ?? null,
                paymentInstructions: familyDetail.paymentInstructions ?? null,
              }}
            />
          ) : undefined
        }
      />
    </div>
  )
}
