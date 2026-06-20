import type { ChoirAttendanceOutcome } from '@/types'

export type AttendanceMemberRow = {
  memberId: string
  memberName: string
  familyId?: string | null
  familyName?: string | null
  outcome: ChoirAttendanceOutcome | null
}

export type FamilyAttendanceGroup = {
  familyId: string
  familyName: string
  members: AttendanceMemberRow[]
  markedCount: number
  totalCount: number
}

const UNASSIGNED_FAMILY_ID = '__unassigned__'

export { UNASSIGNED_FAMILY_ID }
export function groupAttendanceByFamily(
  members: AttendanceMemberRow[],
): FamilyAttendanceGroup[] {
  const map = new Map<string, FamilyAttendanceGroup>()

  for (const member of members) {
    const familyId = member.familyId?.trim() || UNASSIGNED_FAMILY_ID
    const familyName =
      familyId === UNASSIGNED_FAMILY_ID
        ? 'No family assigned'
        : (member.familyName?.trim() || 'Unnamed family')

    const group = map.get(familyId) ?? {
      familyId,
      familyName,
      members: [],
      markedCount: 0,
      totalCount: 0,
    }

    group.members.push(member)
    group.totalCount += 1
    if (member.outcome) group.markedCount += 1
    map.set(familyId, group)
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.familyId === UNASSIGNED_FAMILY_ID) return 1
    if (b.familyId === UNASSIGNED_FAMILY_ID) return -1
    return a.familyName.localeCompare(b.familyName)
  })
}

export function countUnmarked(members: AttendanceMemberRow[]): number {
  return members.filter((m) => !m.outcome).length
}
