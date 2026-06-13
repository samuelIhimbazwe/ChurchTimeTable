import type { ContributionClaim } from '@/lib/api'

type BadgeVariant =
  | 'status-present'
  | 'status-excused'
  | 'status-pending'
  | 'status-absent'

export type MemberContributionDisplayStatus =
  | 'waiting'
  | 'approved'
  | 'partial'
  | 'rejected'

export function resolveMemberDisplayStatus(
  claim: Pick<
    ContributionClaim,
    'status' | 'claimedAmount' | 'confirmedAmount' | 'discrepancyAmount'
  >,
): MemberContributionDisplayStatus {
  if (claim.status === 'REJECTED') return 'rejected'
  if (claim.status === 'SUBMITTED' || claim.status === 'PENDING') return 'waiting'
  if (claim.status === 'CONFIRMED' || claim.status === 'APPROVED') {
    const confirmed = claim.confirmedAmount ?? claim.claimedAmount
    if (
      confirmed < claim.claimedAmount ||
      (claim.discrepancyAmount != null && claim.discrepancyAmount !== 0)
    ) {
      return 'partial'
    }
    return 'approved'
  }
  return 'waiting'
}

export function memberStatusLabel(status: MemberContributionDisplayStatus): string {
  switch (status) {
    case 'waiting':
      return 'Waiting for family'
    case 'approved':
      return 'Approved'
    case 'partial':
      return 'Partially approved'
    case 'rejected':
      return 'Rejected'
  }
}

export function memberStatusBadgeVariant(
  status: MemberContributionDisplayStatus,
): BadgeVariant {
  switch (status) {
    case 'approved':
      return 'status-present'
    case 'partial':
      return 'status-excused'
    case 'waiting':
      return 'status-pending'
    case 'rejected':
      return 'status-absent'
  }
}

export function familyReviewLabel(status: MemberContributionDisplayStatus): string {
  switch (status) {
    case 'waiting':
      return 'Waiting'
    case 'approved':
      return '✓'
    case 'partial':
      return '✓ Partial'
    case 'rejected':
      return '✗'
  }
}

export function goalProgressBarClass(progressPct: number): string {
  if (progressPct >= 100) return 'bg-success'
  if (progressPct >= 50) return 'bg-primary-600'
  return 'bg-warning'
}
