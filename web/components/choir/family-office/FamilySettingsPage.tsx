'use client'

import { useQuery } from '@tanstack/react-query'
import { familiesApi, financeApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import { FamilyPaymentSettingsForm } from '@/components/choir/FamilyPaymentSettingsForm'
import { FamilyPaymentHistoryPanel } from '@/components/choir/family-office/FamilyPaymentHistoryPanel'
import { FamilyDelegationSettings } from '@/components/choir/family-office/FamilyDelegationSettings'
import { FamilyWorkspaceSettings } from '@/components/choir/family-office/FamilyWorkspaceSettings'

export function FamilySettingsPage() {
  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyMeta = context?.families?.[0]
  const myFamilyId = myFamilyMeta?.familyId

  const { data: familyDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['family-detail', myFamilyId],
    queryFn: () => familiesApi.getById(myFamilyId!),
    enabled: !!myFamilyId,
  })

  if (loadingContext || loadingDetail) return <SkeletonCard rows={4} />

  if (myFamilyMeta?.role !== 'HEAD') {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">
          Payment settings are managed by your family head.
        </p>
      </Card>
    )
  }

  if (!familyDetail || !myFamilyId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Family not found.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-text-primary">Payment settings</h2>
        <p className="text-sm text-text-muted mt-0.5">
          MoMo and bank details members use when paying your family account.
        </p>
      </div>
      <FamilyDelegationSettings
        familyId={myFamilyId}
        delegationEnabled={familyDetail.delegationEnabled ?? false}
      />
      <FamilyWorkspaceSettings
        familyId={myFamilyId}
        workspaceTemplate={familyDetail.workspaceTemplate}
      />
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
      <FamilyPaymentHistoryPanel familyId={myFamilyId} />
    </div>
  )
}
