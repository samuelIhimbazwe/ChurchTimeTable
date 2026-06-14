import type { ContributionClaim } from '@/lib/api'

export const CONTRIBUTION_ADJUST_CATEGORIES = [
  { value: 'CORRECTION', label: 'Correction' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'REVERSAL', label: 'Reversal' },
  { value: 'MISCLASSIFICATION', label: 'Misclassification' },
  { value: 'OTHER', label: 'Other' },
] as const

export type ContributionAdjustCategory =
  (typeof CONTRIBUTION_ADJUST_CATEGORIES)[number]['value']

export type TreasuryContributionRow = ContributionClaim & {
  effectiveAmount?: number | null
}

export function normalizeContributionList(raw: unknown): TreasuryContributionRow[] {
  if (!raw || typeof raw !== 'object') return []
  const obj = raw as Record<string, unknown>
  const items = Array.isArray(obj.items) ? obj.items : Array.isArray(raw) ? raw : []
  return items.map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: String(r.id ?? ''),
      referenceNumber: r.referenceNumber != null ? String(r.referenceNumber) : undefined,
      status: String(r.status ?? ''),
      memberId: r.memberId != null ? String(r.memberId) : undefined,
      memberName: r.memberName != null ? String(r.memberName) : undefined,
      memberNumber: r.memberNumber != null ? String(r.memberNumber) : undefined,
      familyId: r.familyId != null ? String(r.familyId) : undefined,
      familyName: r.familyName != null ? String(r.familyName) : undefined,
      familyCode: r.familyCode != null ? String(r.familyCode) : undefined,
      claimedAmount: Number(r.claimedAmount ?? r.amount ?? 0),
      confirmedAmount: r.confirmedAmount != null ? Number(r.confirmedAmount) : null,
      effectiveAmount: r.effectiveAmount != null ? Number(r.effectiveAmount) : null,
      discrepancyAmount: r.discrepancyAmount != null ? Number(r.discrepancyAmount) : null,
      discrepancyReason: r.discrepancyReason != null ? String(r.discrepancyReason) : null,
      typeName: r.typeName != null ? String(r.typeName) : undefined,
      paymentAt: r.paymentAt != null ? String(r.paymentAt) : null,
      createdAt: r.createdAt != null ? String(r.createdAt) : undefined,
    }
  })
}
