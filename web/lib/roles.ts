/** Role helpers for UI permission differentiation (no backend changes). */

export const VICE_PRESIDENT_ROLES = new Set([
  'CHOIR_VICE_PRESIDENT',
  'PROTOCOL_VICE_PRESIDENT',
])

export const CHOIR_LEADERSHIP = new Set([
  'CHOIR_ADMIN', 'CHOIR_PRESIDENT', 'CHOIR_VICE_PRESIDENT', 'CHOIR_SECRETARY',
  'CHOIR_TREASURER', 'CHOIR_REHEARSAL_DIRECTOR', 'CHOIR_LOGISTICS',
  'CHOIR_FAMILY_COORDINATOR', 'CHOIR_COMMITTEE', 'CHOIR_LEADER',
])

export const PROTOCOL_LEADERSHIP = new Set([
  'PROTOCOL_ADMIN', 'PROTOCOL_LEADER', 'PROTOCOL_VICE_PRESIDENT', 'PROTOCOL_COORDINATOR',
  'PROTOCOL_TEAM_LEADER', 'PROTOCOL_ADVISOR',
])

export function isVicePresident(role?: string) {
  return role != null && VICE_PRESIDENT_ROLES.has(role)
}

/** Hide final approval / discipline decision actions for VPs without manage permission */
export function canFinalApprove(role?: string, permissions?: string[]) {
  if (permissions?.includes('discipline:manage') || permissions?.includes('protocol.manage')) {
    return true
  }
  if (
    role === 'CHOIR_PRESIDENT'
    || role === 'CHOIR_VICE_PRESIDENT'
    || role === 'PROTOCOL_LEADER'
    || role === 'CHURCH_ADMIN'
    || role === 'SUPER_ADMIN'
  ) {
    return true
  }
  return false
}

export function choirRoleGroup(role?: string): 'president' | 'secretary' | 'treasurer' | 'music' | 'welfare' | 'advisor' | 'default' {
  switch (role) {
    case 'CHOIR_PRESIDENT':
    case 'CHOIR_VICE_PRESIDENT': return 'president'
    case 'CHOIR_SECRETARY': return 'secretary'
    case 'CHOIR_TREASURER': return 'treasurer'
    case 'CHOIR_REHEARSAL_DIRECTOR': return 'music'
    case 'CHOIR_FAMILY_COORDINATOR': return 'welfare'
    case 'CHOIR_LOGISTICS':
    case 'CHOIR_COMMITTEE': return 'advisor'
    default: return 'default'
  }
}
