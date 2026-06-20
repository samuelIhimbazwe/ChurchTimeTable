/** Permissions retained when an officer previews the app as a member. */
const MEMBER_PREVIEW_ALLOW = [
  'member',
  'portal',
  'read',
  'choir.member',
  'attendance.self',
  'contribution.self',
  'devotion',
  'announcement.read',
] as const

const OFFICER_MARKERS = [
  'manage',
  'admin',
  'ops',
  'approve',
  'verify',
  'treasury',
  'president',
  'write',
  'import',
  'export',
  'system',
  'governance',
] as const

export function canUseMemberPreview(permissions: string[]): boolean {
  return permissions.some((p) =>
    OFFICER_MARKERS.some((m) => p.toLowerCase().includes(m)),
  )
}

export function filterPermissionsForMemberPreview(permissions: string[]): string[] {
  return permissions.filter((p) => {
    const lower = p.toLowerCase()
    if (OFFICER_MARKERS.some((m) => lower.includes(m))) return false
    return MEMBER_PREVIEW_ALLOW.some((a) => lower.includes(a))
  })
}

export const PERMISSION_REASONS: Record<string, string> = {
  'choir.welfare.manage': 'You can manage welfare cases because you are a welfare or care officer.',
  'choir.welfare.view': 'You can view this case because you are on the choir care team.',
  'choir.ops.manage': 'You have choir operations access for scheduling and roster management.',
  'choir.ops.schedule': 'You can manage the choir schedule as an operations officer.',
  'choir.finance.manage': 'You can view finances because you are a treasurer or finance officer.',
  'choir.president': 'You have president-level access for leadership decisions.',
  'family.head': 'You can see this because you are a family head.',
  'family.payment.approve': 'You can approve payments for your family.',
  member: 'You can see your own member records.',
}

export function reasonForPermission(permission: string): string {
  return (
    PERMISSION_REASONS[permission] ??
    `You have the ${permission.replace(/[.:]/g, ' ')} permission.`
  )
}
