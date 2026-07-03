import type { ContributionClaim } from '@/lib/api'
import type { MemberContributionGoal } from '@/lib/api/modules/finance'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { resolveMemberDisplayStatus } from '@/lib/contribution/member-display'
import { formatCurrency, relativeTime } from '@/lib/utils/format'

export type MemberObligationTone = 'danger' | 'warning' | 'info' | 'neutral'

export type MemberObligation = {
  id: string
  title: string
  subtitle: string
  priority: number
  href: string
  tone: MemberObligationTone
}

export type BuildMemberObligationsInput = {
  choirId: string
  claims: ContributionClaim[]
  goals: MemberContributionGoal[]
  nextEvent?: {
    title: string
    when: string
    href: string
  }
}

export function buildMemberObligations({
  choirId,
  claims,
  goals,
  nextEvent,
}: BuildMemberObligationsInput): MemberObligation[] {
  const givingPath = membershipOfficePath(choirId, 'giving')
  const items: MemberObligation[] = []

  for (const claim of claims) {
    const display = resolveMemberDisplayStatus(claim)
    if (display === 'rejected') {
      items.push({
        id: `obligation-rejected-${claim.id}`,
        title: 'Fix rejected payment',
        subtitle: `${claim.typeName ?? 'Contribution'} · ${formatCurrency(claim.claimedAmount)}`,
        priority: 1,
        href: `${givingPath}?detailId=${claim.id}`,
        tone: 'danger',
      })
    }
  }

  for (const claim of claims) {
    const display = resolveMemberDisplayStatus(claim)
    if (display === 'waiting') {
      items.push({
        id: `obligation-pending-${claim.id}`,
        title: 'Waiting for family confirmation',
        subtitle: claim.createdAt
          ? `Submitted ${relativeTime(claim.createdAt)}`
          : formatCurrency(claim.claimedAmount),
        priority: 2,
        href: `${givingPath}?detailId=${claim.id}`,
        tone: 'warning',
      })
    }
  }

  const hasPending = claims.some((c) => resolveMemberDisplayStatus(c) === 'waiting')

  if (!hasPending) {
    for (const goal of goals) {
      const target = goal.memberGoalAmount ?? 0
      const progress = goal.progressPct ?? 0
      if (target > 0 && progress < 100) {
        const remaining = goal.remaining ?? Math.max(0, target - goal.confirmedEffective)
        items.push({
          id: `obligation-pay-${goal.campaignId}`,
          title: `Complete ${goal.typeName ?? goal.name ?? 'giving'}`,
          subtitle: `${formatCurrency(remaining)} remaining`,
          priority: 3,
          href: `${givingPath}?tab=submit`,
          tone: 'info',
        })
      }
    }
  }

  if (nextEvent) {
    items.push({
      id: 'obligation-event-next',
      title: nextEvent.title,
      subtitle: nextEvent.when,
      priority: 4,
      href: nextEvent.href,
      tone: 'info',
    })
  }

  return items.sort((a, b) => a.priority - b.priority)
}

export function obligationToneDotClass(tone: MemberObligationTone): string {
  switch (tone) {
    case 'danger':
      return 'bg-danger'
    case 'warning':
      return 'bg-warning'
    case 'info':
      return 'bg-primary-500'
    default:
      return 'bg-text-muted'
  }
}
