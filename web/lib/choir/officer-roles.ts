import { choirPath, choirMemberHome } from '@/lib/choir/paths'

/** Maps system / membership role names to choir committee role keys. */
export const SYSTEM_CHOIR_ROLE_TO_COMMITTEE: Record<string, string> = {
  CHOIR_PRESIDENT: 'president',
  CHOIR_LEADER: 'president',
  CHOIR_VICE_PRESIDENT: 'vice_president',
  CHOIR_SECRETARY: 'secretary',
  CHOIR_TREASURER: 'treasurer',
  CHOIR_REHEARSAL_DIRECTOR: 'music_director',
  CHOIR_FAMILY_COORDINATOR: 'family_coordinator',
  CHOIR_LOGISTICS: 'secretary',
  CHOIR_COMMITTEE: 'advisor',
}

/** Committee role key → dashboard hub segment under `/choir/{id}/`. */
export const COMMITTEE_ROLE_HUB_PATH: Record<string, string> = {
  president: 'president',
  vice_president: 'vice-president',
  music_director: 'music-direction',
  family_coordinator: 'family-coordinator',
  family_head: 'family-head',
  advisor: 'advisor',
  secretary: 'records',
  treasurer: 'budget',
  discipline_social_welfare: 'care',
  spiritual_leader: 'spiritual',
}

/** Highest-priority role wins for landing when a member holds several positions. */
export const CHOIR_LANDING_ROLE_PRIORITY = [
  'president',
  'vice_president',
  'music_director',
  'family_coordinator',
  'treasurer',
  'secretary',
  'discipline_social_welfare',
  'spiritual_leader',
  'family_head',
  'advisor',
] as const

export type ChoirRoleRef = { roleKey: string }

export function resolveChoirLandingPath(
  choirId: string,
  positions: ChoirRoleRef[],
): string {
  for (const key of CHOIR_LANDING_ROLE_PRIORITY) {
    if (positions.some((p) => p.roleKey === key)) {
      const hub = COMMITTEE_ROLE_HUB_PATH[key]
      if (hub) return choirPath(choirId, hub)
    }
  }
  return choirMemberHome(choirId)
}

export function committeeHubPath(choirId: string, roleKey: string): string | null {
  const hub = COMMITTEE_ROLE_HUB_PATH[roleKey]
  return hub ? choirPath(choirId, hub) : null
}
