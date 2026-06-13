import type { FamilyMemberProgressRow } from '@/lib/api/modules/finance'

export type ProgressDeskFilter = 'all' | 'needs-follow-up'

export type ProgressDeskSortKey = 'name' | 'progressPct' | 'confirmed' | 'remaining'

export function memberNeedsFollowUp(row: FamilyMemberProgressRow): boolean {
  if (row.memberGoalAmount == null) {
    return row.confirmedEffective <= 0
  }
  const pct = row.progressPct ?? 0
  return pct < 50 || row.confirmedEffective <= 0
}

export function countMembersNeedingFollowUp(rows: FamilyMemberProgressRow[]): number {
  return rows.filter(memberNeedsFollowUp).length
}

export function filterProgressDeskRows(
  rows: FamilyMemberProgressRow[],
  filter: ProgressDeskFilter,
): FamilyMemberProgressRow[] {
  if (filter === 'all') return rows
  return rows.filter(memberNeedsFollowUp)
}

export function sortProgressDeskRows(
  rows: FamilyMemberProgressRow[],
  sortKey: ProgressDeskSortKey,
  direction: 'asc' | 'desc',
): FamilyMemberProgressRow[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'name':
        cmp = a.memberName.localeCompare(b.memberName)
        break
      case 'progressPct':
        cmp = (a.progressPct ?? -1) - (b.progressPct ?? -1)
        break
      case 'confirmed':
        cmp = a.confirmedEffective - b.confirmedEffective
        break
      case 'remaining':
        cmp = (a.remaining ?? -1) - (b.remaining ?? -1)
        break
    }
    return direction === 'asc' ? cmp : -cmp
  })
  return sorted
}

export function membersBelowProgressThreshold(
  rows: FamilyMemberProgressRow[],
  thresholdPct: number,
): FamilyMemberProgressRow[] {
  return rows.filter((row) => {
    if (row.memberGoalAmount == null) return row.confirmedEffective <= 0
    return (row.progressPct ?? 0) < thresholdPct
  })
}
