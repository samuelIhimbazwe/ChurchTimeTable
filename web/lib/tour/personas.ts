import type { TourPersona } from './types'

const CHOIR_LEADER_ROLES = new Set([
  'CHOIR_PRESIDENT',
  'CHOIR_LEADER',
  'CHOIR_ADMIN',
  'CHOIR_VICE_PRESIDENT',
  'CHOIR_SECRETARY',
  'CHOIR_REHEARSAL_DIRECTOR',
  'CHOIR_FAMILY_COORDINATOR',
  'SUPER_ADMIN',
  'CHURCH_ADMIN',
])

const TREASURER_ROLES = new Set(['CHOIR_TREASURER'])

const PROTOCOL_ROLES = new Set([
  'PROTOCOL_LEADER',
  'PROTOCOL_ADMIN',
  'PROTOCOL_COORDINATOR',
])

/** Picks the most specific tour track for the signed-in user. */
export function resolveTourPersona(
  role: string,
  permissions: string[],
): TourPersona {
  const upper = role.toUpperCase()

  if (
    PROTOCOL_ROLES.has(upper)
    || permissions.some((p) => p.startsWith('PROTOCOL_'))
  ) {
    return 'protocol_coordinator'
  }

  if (
    TREASURER_ROLES.has(upper)
    || permissions.some((p) =>
      p.includes('FINANCE') || p.includes('CONTRIBUTION') || p.includes('TREASUR'),
    )
  ) {
    return 'treasurer'
  }

  if (
    CHOIR_LEADER_ROLES.has(upper)
    || permissions.some((p) =>
      p.startsWith('CHOIR_') && !p.includes('MEMBER'),
    )
  ) {
    return 'choir_leader'
  }

  return 'member'
}

export function tourPersonaLabel(persona: TourPersona): string {
  switch (persona) {
    case 'choir_leader':
      return 'Choir leader'
    case 'treasurer':
      return 'Treasurer'
    case 'protocol_coordinator':
      return 'Protocol coordinator'
    default:
      return 'Member'
  }
}
