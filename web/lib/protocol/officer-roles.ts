import { protocolMemberHome, protocolPath } from '@/lib/protocol/paths'

/** Maps account roles to protocol committee role keys. */
/** System ministry leader accounts map to president (leader ≡ president). */
export const SYSTEM_PROTOCOL_ROLE_TO_COMMITTEE: Record<string, string> = {
  PROTOCOL_LEADER: 'protocol_president',
  PROTOCOL_ADMIN: 'protocol_president',
}

/** Committee role key → dashboard hub segment under `/protocol/`. */
export const COMMITTEE_ROLE_HUB_SEGMENT: Record<string, string> = {
  protocol_admin: 'admin',
  protocol_president: 'president',
  protocol_vice_president: 'vice-president',
  protocol_coordinator: 'coordinator',
  protocol_treasurer: 'treasury',
  protocol_secretary: 'secretary',
  protocol_team_head: 'team-leader',
}

export const PROTOCOL_LANDING_ROLE_PRIORITY = [
  'protocol_president',
  'protocol_admin',
  'protocol_vice_president',
  'protocol_coordinator',
  'protocol_treasurer',
  'protocol_secretary',
  'protocol_team_head',
] as const

export type ProtocolRoleRef = { roleKey: string }

export function resolveProtocolLandingPath(positions: ProtocolRoleRef[]): string {
  for (const key of PROTOCOL_LANDING_ROLE_PRIORITY) {
    if (positions.some((p) => p.roleKey === key)) {
      const segment = COMMITTEE_ROLE_HUB_SEGMENT[key]
      if (segment) return protocolPath(segment)
    }
  }
  return protocolMemberHome()
}

export function committeeHubPath(roleKey: string): string | null {
  const segment = COMMITTEE_ROLE_HUB_SEGMENT[roleKey]
  return segment ? protocolPath(segment) : null
}
